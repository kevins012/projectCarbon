

// routes/contactRoutes.js
const express = require('express');
const { check, validationResult } = require('express-validator');

const { verifyToken } = require('../middleware/auth_middleware');
const { transaction,getStatusTransaction } = require('../middleware/transaksi');
const { getData } = require('../mysql');
const { getPw } = require('../bcrypt');
const { generate } = require('../jwt');
const router = express.Router();
const path = require('path')
var multer  = require('multer')

const { v4: uuidv4 } = require('uuid'); 
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, './public/img');
    },
    filename: (req, file, cb) => {
        // Buat nama file unik dengan UUID + ekstensi asli file
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName); // Simpan dengan nama file baru
    }
})

var upload = multer({ storage: storage })
const midtransClient = require('midtrans-client');
// Create Snap API instance
let snap = new midtransClient.Snap({
        isProduction : false,
        serverKey : process.env.NEXT_PUBLIC_SECRET,
        clientKey : process.env.NEXT_PUBLIC_CLIENT
    });
const convertDate = (date) => new Date(date).toISOString().split('T')[0];
const mydata = (transactionID, price, amount, first, last, email) => {
    // Pastikan price dan amount adalah angka
    const numericPrice = parseInt(price, 10);
    const numericAmount = parseInt(amount, 10);
    
    // Menghitung gross_amount berdasarkan harga per item dan jumlah
 

    return {
        transaction_details: {
            order_id: transactionID,  // Gunakan order_id unik
            gross_amount: numericPrice   // Total harga untuk transaksi
        },
        customer_details: {
            first_name: first,
            last_name: last,
            email: email,
            phone: "+62181000000000",
            notes: "Thank you for your purchase. Please follow the instructions to pay."
        },
        callbacks: {
            finish: `http://localhost:3000/market/mypayment?token=${transactionID} ` // Ganti dengan URL yang sesuai setelah pembayaran selesai
        },
        enabled_payments: ["credit_card", "bca_va", "indomaret"],
        item_details: [
            {
                id: "carbon-001",
                name: "Carbon",
                price: 10000,  // Harga per item
                quantity: numericAmount  // Jumlah item yang dibeli
            }
        ]
    };
}
router.get('/',verifyToken,async(req,res)=>{

    const query = `SELECT *
                FROM profilseller ;` 

    try {


        const datas = await getData(query);
  
        const myData = datas.filter(user => user.id_user === req.user);
        if (myData.length ===0){

        }
        console.log(datas);
        console.log("---------------------------------------------");
        console.log(myData);
        res.render('users/market', {
            layout: 'layouts/main_layout',
            title: 'Vehicle Page',
            datas,
            role:req.role,
            myuser:req.user,
            // myData:myData[0]
           
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('An error occurred while fetching data');
    }
});
router.get('/mypayment',verifyToken,(req,res)=>{
    const query = `UPDATE transaction
    SET status = 'success', created_at = CURRENT_TIMESTAMP()
    WHERE id = ?;`
    getData(query,[req.query.token])
    res.send('Sucess')
})
router.get('/status',verifyToken,async(req,res)=>{
    const transactionID = req.query.id
    const statusTransaction = await getStatusTransaction(transactionID)
    if (statusTransaction.success){
        res.render('users/viewTransaction', {
            layout: 'layouts/main_layout',
            title: 'Vehicle Page',
            datas:statusTransaction.data,
            role:req.role
        });
    }
    else{
        res.send('Transaksi ga Ada')
    }
})
router.post('/buy', verifyToken, async (req, res) => {
    const transactionID = `carbons-${new Date().getTime()}`;
    const { id_seller, price, myName } = req.body;
    
    console.log(req.body);

    // Query untuk insert jika tidak ada duplikat
    const query = `
        INSERT INTO transaction (id, sellerID, buyerID, capQuotaID, amount, link, status, created_at)
        SELECT ?, ?, ?, 0, ?, ?, 'pending', CURRENT_TIMESTAMP()
        FROM DUAL
        WHERE NOT EXISTS (
            SELECT 1
            FROM transaction
            WHERE sellerID = ? AND buyerID = ? AND status = 'pending'
    );
    `;
    const query2 =`SELECT 
         * FROM user WHERE id_user = ?;
    `
    const mydatas = await getData(query2,[req.user])
    // Proses nama untuk mendapatkan firstName dan lastName
    const name = mydatas[0].Nama.split(' ');
    const firstName = name[0];
    const lastName = name[name.length - 1];

    // Pastikan data memiliki struktur yang benar
    const data = mydata(transactionID, price, req.body.amount, firstName, lastName, 'haloWorld@gmail.com');

    try {
        // Memastikan req.user terdefinisi (middleware verifyToken)
        if (!req.user) {
            return res.status(401).send('Unauthorized: No user token found.');
        }

        // Membuat transaksi Midtrans
        const transaction = await snap.createTransaction(data);
        const link = transaction.redirect_url;

        // Menyimpan data transaksi ke database
        
        const result =await getData(query, [transactionID, id_seller, req.user, price, link,id_seller,req.user]);
        
        if (result > 0) {
            res.redirect(link);
        } else {
            res.send('aa')
        }
        // Redirect ke halaman pembayaran Midtrans
       
    } catch (error) {
        console.error('Error while creating transaction or querying database:', error.message);
        res.status(500).send('An error occurred while processing the transaction.');
    }
});

router.post('/buys', verifyToken, async (req, res) => {
    const transactionID = `carbon-${new Date().getTime()}`;
    const { id_seller, price } = req.body;
    console.log(req.body);

    // Query untuk insert jika tidak ada duplikat
    const query = `
        INSERT IGNORE INTO transaction (id, sellerID, buyerID, capQuotaID, amount, link, created_at)
        VALUES (?, ?, ?, 0, ?,?, CURRENT_TIMESTAMP()) WHERE NO sellerID = ? AND buyerID = ? AND  status = 'pending';
    `;
    const query2 = `SELECT * FROM transaction WHERE sellerID = ? AND buyerID = ? AND created_at > NOW() - INTERVAL 1 DAY;`;

    // Validasi dan proses nama
    const myName = req.body.myName.split(" ");
    const firstName = myName[0];
    const lastName = myName[myName.length - 1];
    const data = mydata(transactionID, req.body.price, req.body.amount, firstName, lastName, 'haloWorld@gmail.com');

    // Periksa duplikat transaksi
    let result;
    try {
        result = await getData(query2, [id_seller, req.user]);
    } catch (error) {
        console.error('Error while querying transaction:', error.message);
        return res.status(500).send('Database error occurred.');
    }

    if (result.length > 0) {
        // Jika transaksi sudah ada, redirect ke link transaksi yang ada
         res.redirect(result[0].link);
    }
    else{
        try {
            // Lakukan transaksi baru
            const transaksi = await transaction(data);
            const result = await getData(query, [transactionID, id_seller, req.user, req.body.price, transaksi.payment_url]);
            if (result.affectedRows > 0) {
                res.send('Transaction created successfully');
            } else {
                res.send('Transaction already exists with the same seller and buyer');
            }
            // Redirect ke URL pembayaran
            res.redirect(transaksi.payment_url);
        } catch (error) {
            console.error('Error processing transaction:', error.message);
            res.status(500).send({
                error: 'An error occurred while processing your transaction.',
                message: error.message
            });
        }

    }

    
});




router.post('/save-transaction', verifyToken, async (req, res) => {
    const { transactionID, sellerID, price, link } = req.body;

    // Validasi input
    if (!transactionID || !sellerID || !price || !link) {
        return res.status(400).send('Missing required fields');
    }

    const query = `
        INSERT IGNORE INTO transaction (id, sellerID, buyerID, capQuotaID, amount, link, created_at)
        VALUES (?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP());
    `;

    console.log('HELLO');
    console.log(req.body);

    try {
        // Pastikan req.user sudah terdefinisi di middleware verifyToken
        await getData(query, [transactionID, sellerID, req.user.id, price, link]);

        // Kirim respons dengan status yang sesuai
        return res.json({ status: 'PENDING', message: 'Transaction saved successfully.' });
    } catch (error) {
        console.error('Error while querying transaction:', error.message);
        res.status(500).send('Database error occurred.');
    }
});

router.get('/tambah',async(req,res)=>{

    const query5 = `
    INSERT INTO profilseller (id, id_user, fullName, address, shopName, rating, img, total_co)
        SELECT 
            ?, 
            u.id_user, 
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

        const success = await getData(query5, [
            uuidv4(),       // id
            'MESSI',    // fullName
            'ss',        // address
            'dsEEEEd',       // shopName
            4.3,         // rating
            'esddd',     // img
            '85487c0e-0592-4183-a1e9-5bd3d8ef94b9' // WHERE id_user
        ]);
        res.status(200).json({ status: "success", result: success });
    
})
router.get('/contoh',verifyToken, (req, res) => {
    const price = parseFloat(req.query.price); // Konversi ke angka
    const amount = parseFloat(req.query.amount); // Konversi ke angka

    if (isNaN(price) || isNaN(amount)) {
        // Jika salah satu nilai bukan angka, kirimkan respons error
        return res.status(400).send('Invalid input: price and amount must be numeric.');
    }

    // Hitung total
    const total = price * amount;

    // Kirimkan hasil perhitungan sebagai respons
    // Render halaman dengan data yang diambil
    res.render('users/confirmation', {
        layout: 'layouts/main_layout',
        title: 'Vehicle Page',
        data:req.query,
        role:req.role
    });
});
router.post('/payment',verifyToken,async (req, res) => {
    console.log(req.user);
    const query = `
        SELECT 
            v.id AS vehicle_id, 
            v.vehicle, 
            SUM(e.CO) AS total_co, 
            u.id_user, 
            u.Nama, 
            u.role ,
            c.id

        FROM 
            owner_vehicle v 
        JOIN 
            emission e ON v.id = e.id_vehicle 
        JOIN 
            user u ON u.id_user = v.id_owner 

        JOIN 
            capquota c ON c.vehicleID = v.id

        WHERE 
            u.role = 0 AND u.Nama = ?
        
        GROUP BY 
            v.id, v.vehicle, u.id_user, u.Nama, u.role;
    `;
    
    const uuid = `carbon-${new Date().getTime()}`;
    try {
    
        // Ambil data dari database
        const datas = await getData(query,[req.body.seller]);
        const query2= `INSERT INTO transaction(id,sellerID,buyerID,
        capQuotaID,amount,created_at) 
        VALUES (?,?,?,?,?,CURRENT_TIMESTAMP())`
        const query3 = `
        INSERT INTO payment (id, transactionID, amount, status, paymentMethod, created_at) 
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP());
    `;


        await getData(query2,[uuid,datas[0].id_user ,req.user,datas[0].id,req.body.price])
        await getData(query3, [uuidv4(), uuid, 0, 0, 'BCA']);

        // Render halaman dengan data yang diambil
       
        res.redirect(`/transaksi?uuid=${uuid}`);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('An error occurred while fetching data');
    }
    
});

router.get('/sddddsddf',  async (req, res) => {
    
    const datas = await getData(`SELECT v.id AS vehicle_id, v.vehicle, SUM(e.CO) AS total_co FROM owner_vehicle v JOIN emission e ON v.id = e.id_vehicle   WHERE v.id = '846e496c-9c2c-4f9f-97ef-a6dc5401a6f6'   GROUP BY v.id, v.vehicle`, [req.user]);
    const query = `
        UPDATE capquota cq
        SET cq.currentQuota = cq.currentQuota - 30 + (
            SELECT SUM(e.CO)
            FROM emission e
            WHERE e.id_vehicle = cq.vehicleID
            GROUP BY e.id_vehicle
        )
        WHERE cq.vehicleID = ?;
    `;
    await getData(query, [`6190eefa-b7a4-476c-befa-8d8297ba38a3` 	]);
    console.log(`Initial quota updated for vehicleID: `);
    try {
        // await getData('INSERT capquota (`id`,`vehicleID`, `initialQuota`,`currentQuota`,`created_at`) VALUES (?,?,?,?,CURRENT_TIMESTAMP() )',[uuidv4(),datas[0].vehicle_id,0,datas[0].total_co]);
        res.send(datas[0].vehicle_id);
    }catch(e){
        res.send('e')
    }
    
    
})
router.get('/',  async (req, res) => {
    
    const datas = await getData(`SELECT v.id AS vehicle_id, v.vehicle, SUM(e.CO) AS total_co FROM owner_vehicle v JOIN emission e ON v.id = e.id_vehicle   WHERE v.id = '846e496c-9c2c-4f9f-97ef-a6dc5401a6f6'   GROUP BY v.id, v.vehicle`, [req.user]);
    const query = `
        UPDATE capquota cq
        SET cq.currentQuota = cq.currentQuota - 30 + (
            SELECT SUM(e.CO)
            FROM emission e
            WHERE e.id_vehicle = cq.vehicleID
            GROUP BY e.id_vehicle
        )
        WHERE cq.vehicleID = ?;
    `;
    await getData(query, [`6190eefa-b7a4-476c-befa-8d8297ba38a3` 	]);
    console.log(`Initial quota updated for vehicleID: `);
    try {
        // await getData('INSERT capquota (`id`,`vehicleID`, `initialQuota`,`currentQuota`,`created_at`) VALUES (?,?,?,?,CURRENT_TIMESTAMP() )',[uuidv4(),datas[0].vehicle_id,0,datas[0].total_co]);
        res.send(datas[0].vehicle_id);
    }catch(e){
        res.send('e')
    }
    
    
})
router.post('/sell', verifyToken, async (req, res) => {
    console.log(req.body);
    const { id_vehicle, co } = req.body;
    
    try {
        // 1. Cek currentQuota terlebih dahulu
        const currentData = await getData(
            `SELECT currentQuota FROM capquota WHERE vehicleID = ?`, 
            [id_vehicle]
        );

        // 2. Validasi apakah data ditemukan
        if (!currentData || currentData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data kendaraan tidak ditemukan'
            });
        }

        const currentQuota = currentData[0].currentQuota;

        // 3. Pastikan currentQuota cukup untuk dijual
        if (currentQuota < co) {
            return res.status(400).json({
                success: false,
                message: `Kuota tidak mencukupi. Current: ${currentQuota}, Request: ${co}`
            });
        }

        // 4. Lakukan update jika kuota mencukupi
        await getData(
            `UPDATE capquota SET currentQuota = currentQuota - ? WHERE vehicleID = ?`,
            [co, id_vehicle]
        );

        // 5. Set flash message
        req.flash('msg', {
            type: 'success',
            message: `Berhasil menjual ${co} kuota karbon! Sisa kuota: ${currentQuota - co}`
        });

        // 6. Redirect ke halaman emission dengan id vehicle
        res.redirect(`/vehicle/emission/${id_vehicle}`);

    } catch (error) {
        console.error('Error selling carbon quota:', error);
        
        // Set flash message error
        req.flash('msg', {
            type: 'error', 
            message: 'Terjadi kesalahan server saat menjual kuota'
        });
        
        res.redirect(`/vehicle/emission/${id_vehicle}`);
    }
});

module.exports = router;



// // await getData(`UPDATE capquota c
//     //             JOIN owner_vehicle v
//     //             ON c.vehicleID = v.id
//     //             SET c.currentQuota = c.currentQuota-40
            
//     //             WHERE condition;
//     //                 `)
//     // await getData(`INSERT INTO transaction(id,sellerID,buyerID,capQuotaID,amount,created_at) 
//     // VALUES (?,?,?,?,?,CURRENT_TIMESTAMP())`,[uuidv4(),,req.user,datas.id])
//     const query = `SELECT id, id_user, fullName, address, shopName, rating, img, total_co 
//     FROM profilseller;` 
// // UPDATE profilseller
// // SET total_co = total_co + ? 
// // WHERE id_user = ?;
// // const query = `
// //     SELECT 
    
    
// //         SUM(e.CO) AS total_co, 
// //         u.id_user, 
// //         u.Nama, 
// //         u.role 
// //     FROM 
// //         owner_vehicle v 
// //     JOIN 
// //         emission e ON v.id = e.id_vehicle 
// //     JOIN 
// //         user u ON u.id_user = v.id_owner 

// //     JOIN 
// //         capquota c ON c.vehicleID = v.id

// //     WHERE 
// //         u.role = 0 AND NOT u.id_user = ?
    
// //     GROUP BY 
// //         v.id, v.vehicle, u.id_user, u.Nama, u.role;
// // `;
// // const query4 =  `
// //         SELECT 
// //             t.id, t.sellerID,t.buyerID
// //         FROM 
// //             transaction t
// //         JOIN 
// //             user u ON u.id_user = t.buyerID
// //         WHERE  t.buyerID = ?

// //     `;


// router.get('/',verifyToken,async(req,res)=>{

//     const query = `SELECT *
//                 FROM profilseller ;` 

//     try {
    
//         // Ambil data dari database
//         const datas = await getData(query);
//         // const dataBuyer =  await getData(query4,[req.user]);
//         // console.log(req.user);
//         const myData = datas.filter(user => user.id_user === req.user);

        
//         // console.log(dataBuyer);
//         // // Render halaman dengan data yang diambil
//         res.render('users/market', {
//             layout: 'layouts/main_layout',
//             title: 'Vehicle Page',
//             datas,
//             role:req.role,
//             myuser:req.user,
//             myData:myData[0]
           
//         });
//     } catch (error) {
//         console.error('Error fetching data:', error);
//         res.status(500).send('An error occurred while fetching data');
//     }
// });


// router.post('/buy', verifyToken, async(req, res) => {
//     const transactionID = `carbon-${new Date().getTime()}`;
//     const { id_seller, price } = req.body;
//     console.log(req.body);

//     // Query untuk insert jika tidak ada duplikat
//     // const query = `
//     //     INSERT IGNORE INTO transaction (id, sellerID, buyerID, capQuotaID, amount, link, created_at)
//     //     VALUES (?, ?, ?, 0, ?,?, CURRENT_TIMESTAMP());
//     // `;
//     const query= `SELECT * FROM transaction WHERE sellerID = ? AND buyerID = ? AND created_at > NOW() - INTERVAL 1 DAY;`;
//     let result
//     try {
//          result = await getData(query, [id_seller, req.user]);
//     } catch (error) {
//         console.error('Error while querying transaction:', error.message);
//         return res.status(500).send('Database error occurred.');
//     }

//     if (result.length > 0) {
//         // Jika transaksi sudah ada, redirect ke link transaksi yang ada
//          res.redirect(result[0].link);
//     }
//     // Validasi dan proses nama
//     const myName = req.body.myName.split(" ");
//     const firstName = myName[0];
//     const lastName = myName[myName.length - 1];
//     const mydatas = mydata(transactionID, req.body.price, req.body.amount, firstName, lastName, 'haloWorld@gmail.com');
//     const dataTransaksi = [transactionID, id_seller, req.user, req.body.price,'aa']
//     snap.createTransaction(mydatas)
//         .then((transaction)=>{
//             // transaction token
//             let transactionToken = transaction.token;
//             console.log('transactionToken:',transactionToken);
//             res.render('cobaTransaksi',{ layout:'layouts/main_layout',role:req.role,transaksi:transactionToken,dataTransaksi,mydatas })
//         })

    
// });