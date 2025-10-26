const path = require('path')
// routes/authRoutes.js
const express = require('express');
const { check, validationResult } = require('express-validator');
const { getData } = require('../mysql');
const { getPw } = require('../bcrypt');
const { generate } = require('../jwt');
const { verifyToken } = require('../middleware/auth_middleware');
const { v4: uuidv4 } = require('uuid'); // v4 generates a random UUID
var multer  = require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, './public/img/users');
    },
    filename: (req, file, cb) => {
        // Buat nama file unik dengan UUID + ekstensi asli file
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName); // Simpan dengan nama file baru
    }
})

var upload = multer({ storage: storage })
// Generate a UUID

const router = express.Router();
const jwt = require('jsonwebtoken')

// async function updateCapQuota(co , id_vehicle){
//     const queryUpdate = `
//         UPDATE capquota cq 
//         SET cq.currentQuota = cq.currentQuota + ? 
//         WHERE cq.vehicleID = ?
//   `; 
//     await getData(queryUpdate,[co,id_vehicle]);


// }
router.get('/', verifyToken, async(req, res) => {

    
    const datas = await getData(`SELECT * FROM profilseller WHERE id_user = ?`, [ req.user]);

    if (datas.length >0 ){
   console.log(datas[0]);
    res.render('users/usersData',{ layout: 'layouts/main_layout', role :req.role ,datas:datas[0]})

   }else{
    res.render('users/addProfile', { layout: 'layouts/main_layout', role :req.role,datas:null })
   }
   
    
    // res.render('users/userData',{title: 'Registration Page',layout:'layouts/main_layout',role:req.role,datas})
});
router.post('/add-profile', verifyToken,upload.single('img'), async (req, res) => {
    // Log data yang diterima dari form
    

    // Validasi fullName dan rating
    if (!req.body.fullName || req.body.fullName.trim() === '') {
        return res.status(400).send({ error: 'Full Name is required.' });
    }

    const userImg = req.file ? req.file.filename : null; // Gunakan nilai rating dari request atau default ke 0

    const query5 = `
    INSERT INTO profilseller (id, id_user, fullName, address, shopName, no_Hp,rating, img, total_co)
        SELECT 
            ?, 
            u.id_user, 
            ?, 
            ?, 
            ?, 
            ?, 
            ?, 
            ?,
            IFNULL(SUM(e.CO), 0) AS total_co_value
        FROM 
            user u
        LEFT JOIN 
            owner_vehicle v ON u.id_user = v.id_owner
        LEFT JOIN 
            emission e ON v.id = e.id_vehicle
        WHERE 
            u.id_user = ?
        GROUP BY 
            u.id_user
        ON DUPLICATE KEY UPDATE 
            total_co = VALUES(total_co),
            fullName = VALUES(fullName),
            address = VALUES(address),
            shopName = VALUES(shopName),
            rating = VALUES(rating),
            img = VALUES(img);
    `;

    try {
        // Melakukan query dengan data yang dikirimkan dalam request
        await getData(query5, [
            uuidv4(),       // id
            req.body.fullName,    // fullName
            req.body.address,        // address
            req.body.shopName, 
            req.body.noHp,      // shopName
            0,         // rating
            userImg,     // img
            req.user // WHERE id_user
        ]);

        // Setelah berhasil, redirect ke halaman /users
        res.redirect('/users');
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while saving the profile.' });
    }
});

router.get('/update',verifyToken,async(req,res)=>{
    const datas = await getData(`SELECT * FROM profilseller WHERE id_user = ?`, [ req.user]);

    res.render('users/addProfile', { layout: 'layouts/main_layout', role :req.role,datas:datas[0] })
})
router.post('/update', verifyToken, upload.single('img'), async (req, res) => {
    try {
        console.log('=== 🔄 UPDATE PROFILE REQUEST ===');
        
        console.log('📝 Request Body:', req.body);
        console.log('📁 Request File:', req.file);
        console.log('👤 User ID:', req.user);

        if (!req.body.fullName || req.body.fullName.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'Full Name is required.' 
            });
        }

        let updateQuery;
        let queryParams;

        if (req.file) {
            // ✅ File disimpan di public/img/users/filename.jpg
            // ✅ Diakses via /img/users/filename.jpg
            updateQuery = `
                UPDATE profilseller 
                SET fullName = ?, address = ?, shopName = ?, no_Hp = ?, rating = 0, img = ?, total_co = 0
                WHERE id_user = ?
            `;
            queryParams = [req.body.fullName, req.body.address, req.body.shopName, req.body.noHp, req.file.filename, req.user];
        } else {
            updateQuery = `
                UPDATE profilseller 
                SET fullName = ?, address = ?, shopName = ?, no_Hp = ?, rating = 0, total_co = 0
                WHERE id_user = ?
            `;
            queryParams = [req.body.fullName, req.body.address, req.body.shopName, req.body.noHp, req.user];
        }

        await getData(updateQuery, queryParams);
        console.log('✅ Profile updated successfully');
        res.redirect('/users');

    } catch (error) {
        console.error('❌ Error updating profile:', error);
        res.status(500).json({ 
            success: false, 
            error: 'An error occurred while updating the profile.' 
        });
    }
});

router.get('/sensors/add_emission', async(req, res) => {
    const vehicleID = '6190eefa-b7a4-476c-befa-8d8297ba38a3';
    // const query2 = `SELECT SUM(e.CO) AS total_co FROM emission e WHERE e.id_vehicle = ?`
    try {
        await updateCapQuota(vehicleID); // Memanggil fungsi untuk mengupdate emission
        res.status(200).json({ message: 'Emission data added successfully.' }); // Mengirimkan respons sukses
    } catch (error) {
        console.error(error); // Log error untuk debug
        res.status(500).json({ message: 'Failed to add emission data.' }); // Mengirimkan respons error
    }
    // const currentCO = (await getData(query2,[vehicleID]))[0].total_co;
    // const query = `INSERT capquota (id,vehicleID,initialQuota,currentQuota,created_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP())`
    // await getData(query,[uuidv4(),vehicleID,0,currentCO])
    // Query UPDATE yang ingin dijalankan
    // const query = `
    // UPDATE capquota cq
    // SET cq.initialQuota = cq.initialQuota + 30 + (
    //     SELECT SUM(e.CO)
    //     FROM emission e
    //     WHERE e.id_vehicle = cq.vehicleID
    //     GROUP BY e.id_vehicle
    // )
    // WHERE cq.vehicleID = ?
    // `;
    
    // const datas = await getData(query, [vehicleID]);
   

});
// router.post('/delete', verifyToken, async (req, res) => {
//     const userId = req.body.id_user;  // Get user ID from the route parameter

//     // Correct the SQL query by using parameterized queries to avoid SQL injection
//     await getData('DELETE FROM `user` WHERE `id_user` = ?', [userId]);

//     res.redirect('/users');
// });
module.exports = router;