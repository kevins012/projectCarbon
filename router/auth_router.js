// routes/authRoutes.js
const express = require('express');
const { check, validationResult } = require('express-validator');
const { getData } = require('../mysql');
const { getPw } = require('../bcrypt');
const { generate } = require('../jwt');
const { verifyToken } = require('../middleware/auth_middleware');
const { v4: uuidv4 } = require('uuid'); // v4 generates a random UUID

// Generate a UUID

const router = express.Router();
const jwt = require('jsonwebtoken')
router.get('/login', async (req, res) => {  // ✅ TAMBAH async
    const authorization = req.cookies.token;
    
    try {
        const decoded = jwt.verify(authorization, process.env.JWT_SECRET_KEY);
        req.user = decoded; 
        res.redirect('/');
    } catch (error) {
        try {
            
            // ✅ PERBAIKI TYPO: resulta -> results
            console.log("VERIkamuuu-------------------");
            const results = await getData('SELECT * FROM user'); // ✅ BENAR
           
            res.render('auth/login', { title: 'Login Page', layout: 'layouts/first' });
        } catch (dbError) {
            console.error('Database error:', dbError);
            res.render('auth/login', { title: 'Login Page', layout: 'layouts/first' });
        }
    }
});
router.get('/registration', (req, res) => {
    res.render('auth/registration', { title: 'Registration Page', layout: 'layouts/first' });
});

router.get('/logout', (req, res) => {
    res.clearCookie("token");
    return res.redirect('/login');
});

router.post('/login/user', [
    check('email').custom(async (value, { req }) => {
        const results = await getData('SELECT * FROM user');
        console.log('haigggggggggggggggggggii')
        const pwChecks = results.filter((r) => r.email === req.body.email)
                                .map(async (r) => getPw(req.body.password, r.password, 1));
        const pwResults = await Promise.all(pwChecks);
        req.userId = results.find(r => r.email === req.body.email).id_user;
        req.role = results.find(r => r.email === req.body.email).role;
        if (!pwResults.some(result => result)) {
            return Promise.reject('Invalid password');
        }
        return true;
    }),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('auth/login', { title: 'Login Page', layout: 'layouts/first', errors: errors.array() });
    } else {
       
        const role = req.role === 0 ? 'users' : 'admin';
        const token = generate(req.userId ,req.body.email,role);
        res.cookie('token', token, { maxAge: 900000, httpOnly: true, secure: false });
        res.redirect('/');
    }
});

router.post('/registration/user', [
    check('email').custom(async (value, { req }) => {
        const results = await getData('SELECT * FROM user');
        for (const r of results) {
            if (r.email === value) throw new Error('Email already in use');
            if (req.body.noHp === r.noHp) throw new Error('noHp already in use');
        }
        if (req.body.password !== req.body.confirmPassword) throw new Error('Passwords do not match');
        return true;
    }),
    check('email', 'Invalid email').isEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('auth/registration', { title: 'Registration Page', layout: 'layouts/first', errors: errors.array() });
    } else {
        const password = await getPw(req.body.password);

        const query = 'INSERT INTO `user` (`id_user`, `Nama`, `password`, `email`, `noHp`, `role`,`last_login`, `created_at`) VALUES (?, ?, ?, ?, ?,?, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())';

        await getData(query, [uuidv4(), req.body.fullName, password, req.body.email, req.body.noHp,0]);
        res.clearCookie("token");
        res.redirect('/login');
    }
});

router.get('/', verifyToken, (req, res) => {
    const mahasiswa = [
        { nama: 'bulan', email: 'bulan456@gmail.com' },
        { nama: 'angin', email: 'angin012@gmail.com' },
    ];
    console.log(req.role);
    res.render('index', { layout: 'layouts/main_layout', nama: 'KevBlod', title: 'Belajarku', mahasiswa,role:req.role });
});

router.get('/about', verifyToken, (req, res) => {
    res.render('about', { layout: 'layouts/main_layout', title: 'About Page' });
});

module.exports = router;
