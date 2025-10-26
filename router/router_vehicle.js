// routes/contactRoutes.js
const express = require('express');
const { check, validationResult } = require('express-validator');

const { verifyToken } = require('../middleware/auth_middleware');
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

const convertDate = (date) => new Date(date).toISOString().split('T')[0];
router.get('/', verifyToken, async (req, res) => {
    const datas = await getData('SELECT * FROM owner_vehicle WHERE id_owner = ?', [req.user]);
    console.log(req.user);
    console.log("VERHASILLLLLLLLLLLLLLLLLLLLLLLLLL");
    res.render('vehicle/my_vehicle', { layout: 'layouts/main_layout', title: 'Contact Page', datas, msg: req.flash('msg') ,role: req.role});
})
router.get('/add-owner', verifyToken, async (req, res) => {
    const datas = await getData(`SELECT * FROM owner WHERE id_user=${req.user}`);
   
    res.render('vehicle/add-owner', { layout: 'layouts/main_layout', title: 'Contact Page', datas, msg: req.flash('msg'),role: req.role });
});

router.get('/emission/:id', verifyToken, async (req, res) => {
    try {
        // SQL query to fetch emissions based on the logged-in user
        const query = `
            SELECT emission.* 
            FROM emission
            INNER JOIN owner_vehicle ON emission.id_vehicle = ?
            INNER JOIN user ON owner_vehicle.id_owner = user.id_user
            WHERE user.id_user = ?
            ORDER BY emission.update_time ASC
        `;

        // Fetch data from the database
        const emissions = await getData(query, [req.params.id,req.user]); // Ensure req.user.id_user contains the logged-in user's 
        if (emissions.length === 0){
            return res.render('vehicle/emission_empty', {
                layout: 'layouts/main_layout',
                title: 'No Emission Data - Vehicle Monitoring',
                msg: req.flash('msg'),
                role: req.role
            });
        }
        else{
            console.log("-----------------",emissions);
        // Return the emissions data as JSON
        res.render('vehicle/emission', {
            layout: 'layouts/main_layout',
            title: 'Vehicle Page',
            
            emissions,  // Data kendaraan (mungkin kosong jika belum ada kendaraan)
            msg: req.flash('msg'),
            role: req.role
           
        });

        }
        
    } catch (error) {
        console.error('Error retrieving emission data:', error);
        res.status(500).send('ssss retrieving emission data');
    }
});

router.post('/detail', verifyToken, async (req, res) => {
    try {
        const vehicleId = req.body.vehicleId;
        // const data = await getData(`SELECT * FROM owner WHERE id_user=${req.user}`);
        const datas = await getData(` SELECT owner_vehicle.* FROM owner_vehicle JOIN user ON owner_vehicle.id_owner = user.id_user  WHERE owner.id = ? AND user.id_user = ?`, [vehicleId, req.user]);
        console.log(datas.length);
   
        //    console.log(req.user!=id_user);
    //    console.log(id_user);
    //     // Kondisi kedua: jika pengguna memanipulasi ID dan mencoba mengakses kendaraan orang lain
    //     if (datas.length === 0 ) {
         
    //         const check = await getData(`
    //            SELECT owner_vehicle.* 
    //             FROM owner_vehicle 
    //             JOIN owner ON owner_vehicle.id_owner = owner.id 
    //             WHERE owner.id_user = ?`
    //         , [ req.user]);
    //         console.log('hLO');
    //         if (check.length === 0) {
    //             return res.status(200).json({ message: 'Belum ada kendaraan yang ditambahkan.' });
    //         } 
    //         // Akses ditolak jika pengguna mencoba mengakses kendaraan yang bukan miliknya
            
    //     }

        // Kondisi pertama: Render halaman dengan data kendaraan (meskipun kosong)
        res.render('vehicle/my_vehicle', {
            layout: 'layouts/main_layout',
            title: 'Vehicle Page',
            vehicleId,
            datas,  // Data kendaraan (mungkin kosong jika belum ada kendaraan)
            msg: req.flash('msg'),
            role: req.role
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving vehicle data');
    }
});
router.get('/adds', verifyToken, async (req, res) => {
    
   

   const datas = await getData(`SELECT * FROM owner_vehicle WHERE id_owner = ?`, [ req.user]);
// if (datas.length === 0) {
//     // Jika tidak ada data, berarti kendaraan tersebut bukan milik user yang sedang login
//     return res.status(403).send('Access denied');
// }
    res.render('vehicle/add-vehicle', {
        layout: 'layouts/main_layout',
        title: 'Vehicle Page',
        role: req.role
        // Asumsikan 'contacts' mengacu pada data yang diambil dari database
      
    });
   
});

router.get('/update/:id', verifyToken, async (req, res) => {
    
   

    const datas = await getData(`SELECT * FROM owner_vehicle WHERE id_owner = ? AND id = ?`, [ req.user,req.params.id] );
    const last_oil_change_date = convertDate(datas[0].last_oil_change_date);
    const serviceDate = convertDate(datas[0].riwayat_service);

    res.render('vehicle/update', {
         layout: 'layouts/main_layout',
         title: 'Vehicle Page',
         vehicle:datas[0],
         last_oil_change_date,
         serviceDate,
         role: req.role
         
         // Asumsikan 'contacts' mengacu pada data yang diambil dari database
       
     });
    
 });
 router.post('/adds/:id?', verifyToken, upload.single('vehiclePhoto'), async (req, res) => {
    const id = req.params.id; // Jika ada :id, maka ini adalah update
    const isUpdate = !!id; // Boolean: true jika update, false jika add

    try {
        // Foto kendaraan
        const vehiclePhotoPath = req.file ? req.file.filename : null;

        if (isUpdate) {
            // Logika update
            const updateQuery = `
                UPDATE owner_vehicle 
                SET 
                    number_registration = ?, 
                    vehicle = ?, 
                    type_vehicle = ?, 
                    transmission_type = ?, 
                    last_oil_change_date = ?, 
                    fuel = ?, 
                    cylinder_volume = ?, 
                    description_vehicle = ?, 
                    vehicle_photo = IFNULL(?, vehicle_photo), 
                    riwayat_service = ?, 
                    last_update = CURRENT_TIMESTAMP() 
                WHERE id = ? AND id_owner = ?;
            `;

            await getData(updateQuery, [
                req.body.numberRegistration,
                req.body.vehicle,
                req.body.typeVehicle,
                req.body.transmissionType,
                req.body.lastOilChangeDate,
                req.body.fuel,
                req.body.cylinderVolume,
                req.body.descriptionVehicle,
                vehiclePhotoPath,
                req.body.serviceDate,
                id,
                req.user,
            ]);

            console.log(`Vehicle with ID ${id} updated successfully.`);
        } else {
            // Logika add
            const addQuery = `
                INSERT INTO owner_vehicle 
                (id, id_owner, number_registration, vehicle, type_vehicle, transmission_type, last_oil_change_date, fuel, cylinder_volume, description_vehicle, vehicle_photo, riwayat_service, status_emisi, last_update) 
                VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP());
            `;

            await getData(addQuery, [
                uuidv4(),
                req.user,
                req.body.numberRegistration,
                req.body.vehicle,
                req.body.typeVehicle,
                req.body.transmissionType,
                req.body.lastOilChangeDate,
                req.body.fuel,
                req.body.cylinderVolume,
                req.body.descriptionVehicle,
                vehiclePhotoPath,
                req.body.serviceDate,
                0, // Default status_emisi untuk add
            ]);

            console.log('New vehicle added successfully.');
        }

        // Redirect ke halaman kendaraan setelah berhasil
        res.redirect('/vehicle');
    } catch (error) {
        console.error('Error processing vehicle data:', error);
        res.status(500).send('Error processing vehicle data');
    }
});



router.post('/add-owner',verifyToken, async (req, res) => {
    const query = 'INSERT INTO `owner` (`ID`, `owner`, `id_user`,`email`,`no_Hp`) VALUES (NULL, ?, ?, ?, ?);';
    await getData(query,[req.body.owner,req.user,req.body.email,req.body.no_Hp])
        //ownerName , nik , numberRegistration ,vehicle,typeVehicle,transmissionType,
    res.redirect('/vehicle')
   
});
router.post('/delete-vehicle/:id',verifyToken,async (req, res) => {
    const vehicleId = req.params.id; // Mengambil ID dari parameter URL

    // Query SQL untuk menghapus owner berdasarkan ID
    const query = 'DELETE FROM `owner_vehicle` WHERE `id` = ?'; // Pastikan nama tabel dan kolom sesuai dengan yang ada di database

    try {
        await getData(query, [vehicleId]); // Ganti dengan fungsi Anda untuk menjalankan query
        res.redirect(`/vehicle`); // Redirect ke halaman owner setelah penghapusan
    } catch (error) {
        console.error('Error deleting owner:', error);
        res.status(500).send('Error deleting owner');
    }
   
}
)


router.get('/:id', verifyToken, async (req, res) => {
    try {
        const vehicleId = req.params.id;
        // const data = await getData(`SELECT * FROM owner WHERE id_user=${req.user}`);
        const data = await getData(`SELECT * FROM owner_vehicle WHERE ID=${vehicleId}`);
        res.render('vehicle/add-vehicle', {
            layout: 'layouts/main_layout',
            title: 'Vehicle Page',
             data, // Asumsikan 'contacts' mengacu pada data yang diambil dari database
            msg: req.flash('msg'),
            role: req.role
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving vehicle data');
    }
});

module.exports = router;