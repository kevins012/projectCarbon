// // routes/contactRoutes.js
// const express = require('express');
// const { check, validationResult } = require('express-validator');
// const { fetchAllData, addData, deleteData } = require('../proxy');
// const { verifyToken } = require('../middleware/auth_middleware');

// const router = express.Router();

// router.get('/', verifyToken, async (req, res) => {
//     const contacts = await fetchAllData();
//     res.render('contact', { layout: 'layouts/main_layout', title: 'Contact Page', contacts, msg: req.flash('msg') });
// });


// // Keep this route as '/contact/add'
// router.get('/add', verifyToken, (req, res) => {
//     res.render('add-contact', { title: 'Add Contact Form', layout: 'layouts/main_layout', contact: [] });
// });
// 22
// router.post('/add', [
//     check('email').custom(async (value) => {
//         const contacts = await fetchAllData({ email: value });
//         if (contacts.length > 0) throw new Error('Contact already exists');
//         return true;
//     }),
//     check('email', 'Invalid email').isEmail(),
//     check('no_Hp', 'Invalid phone number').isMobilePhone('id-ID'),
// ], async (req, res) => {
//     console.log('Form submitted:', req.body); // Log submitted form data
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         console.log('Validation errors:', errors.array()); // Log validation errors
//         res.render('add-contact', { title: 'Add Contact Form', layout: 'layouts/main_layout', errors: errors.array(), contact: [] });
//     } else {
//         await addData([req.body], 0);
//         req.flash('msg', 'Contact added successfully');
//         res.redirect('/contact');
//     }
// });


// router.get('/edit/:id', verifyToken, async (req, res) => {
//     const contact = await fetchAllData({ _id: req.params.id });
//     res.render('add-contact', { title: 'Edit Contact Form', layout: 'layouts/main_layout', contact });
// });

// router.post('/update', [
//     check('email').custom(async (value, { req }) => {
//         const contacts = await fetchAllData({ email: value });
//         if (value !== req.body.oldEmail && contacts.length > 0) throw new Error('Contact already exists');
//         return true;
//     }),
//     check('email', 'Invalid email').isEmail(),
//     check('no_Hp', 'Invalid phone number').isMobilePhone('id-ID'),
// ], async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         res.render('add-contact', { title: 'Edit Contact Form', layout: 'layouts/main_layout', errors: errors.array(), contact: [req.body] });
//     } else {
//         await addData(req.body, 1);
//         req.flash('msg', 'Contact updated successfully');
//         res.redirect('/contact');
//     }
// });

// router.get('/delete/:id', verifyToken, async (req, res) => {
//     const deleted = await deleteData(req.params.id);
//     if (deleted) {
//         req.flash('msg', 'Contact deleted successfully');
//         res.redirect('/contact');
//     } else {
//         res.status(404).render('error', { title: '404 Not Found' });
//     }
// });


// router.get('/:id', verifyToken, async (req, res) => {
//     const contact = await fetchAllData({ _id: req.params.id });
//     res.render('detail', { layout: 'layouts/main_layout', title: 'Contact Details', contact: contact[0] });
// });

// module.exports = router;
