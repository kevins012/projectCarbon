// const { Client, ServerApiVersion } = require('db');
// const uri = "db+srv://souka:souka212@cluster1.ufd8j.db.net/?retryWrites=true&w=majority&appName=cluster1";

// // Create a Client with a ClientOptions object to set the Stable API version
// const client = new Client(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server
//     await client.connect();

//     // Pilih database dan koleksi
//     const database = client.db('data_kendaraan');  // ganti dengan nama database kamu
//     const collection = database.collection('data1');  // ganti dengan nama koleksi kamu

//     // Insert multiple documents
//     const result = await collection.insertMany([{
//       nama: 'saddd121uke',
//       nik: '1gttt53d42'
//       ,age:45
//     },
//     {
//       nama: '122eee',
//       nik: 'g5453d42',
//       email:"djdjsi"
//       ,age:20
//     }]);
//     console.log('Insert result:', result);

//     // Select all documents (tanpa filter akan memilih semua dokumen)
//     const allDocuments = await collection.find({}).toArray();
//     console.log('All documents:', allDocuments);

//     // Cetak timestamp dari _id
//     if (allDocuments.length > 0) {
//       const timestampUTC = allDocuments[0]._id.getTimestamp();
//       const timestampWIB = new Date(timestampUTC.getTime() + 7 * 60 * 60 * 1000); // Convert UTC to WIB (UTC+7)
//       console.log("Timestamp in WIB:", timestampWIB.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
//     }
//   } catch (err) {
//     console.error("Error:", err);
//   } finally {
//     // Pastikan koneksi tertutup setelah selesai
//     await client.close();
//   }
// }
// run().catch(console.dir);


// const { Client, ObjectId, ServerApiVersion } = require('db');
// const uri = "db+srv://souka:souka212@cluster1.ufd8j.db.net/?retryWrites=true&w=majority&appName=cluster1";

// const client = new Client(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     await client.connect();
//     const database = client.db('data_kendaraan');
//     const collection = database.collection('data1');

//     // 1. Mencari dokumen berdasarkan _id
//     const idSearch = new ObjectId('66db6775fe5ae6544f9af468');
//     const resultById = await collection.findOne({ _id: idSearch });
//     console.log('Mencari berdasarkan _id:', resultById);

//     // 2. Mencari dokumen berdasarkan nama
//     const resultByName = await collection.find({ nama: 'sadddssuke' }).toArray();
//     console.log('Mencari berdasarkan nama:', resultByName);

//     // 3. Mencari dokumen berdasarkan nik
//     const resultByNik = await collection.find({ nik: '1gttt53d42' }).toArray();
//     console.log('Mencari berdasarkan nik:', resultByNik);

//     // 4. Mencari dokumen dengan beberapa kriteria
//     const resultByMultipleCriteria = await collection.find({
//       nama: 'sadddssuke',
//       nik: '1223d42',
//       email: { $exists: true }
//     }).toArray();
//     console.log('Mencari dengan beberapa kriteria:', resultByMultipleCriteria);

//     // 5. Mencari dokumen dengan rentang nilai
//     const resultByAgeRange = await collection.find({
//       age: { $gte: 20, $lte: 45 }
//     }).toArray();
//     console.log('Mencari berdasarkan rentang usia:', resultByAgeRange);

//     // 6. Mencari dokumen dengan field yang tidak sama
//     const resultByNotEqual = await collection.find({
//       nama: { $ne: 'sadddssuke' }
//     }).toArray();
//     console.log('Mencari berdasarkan field yang tidak sama:', resultByNotEqual);

//     // 7. Mencari dokumen yang memiliki field email
//     const resultByEmailExists = await collection.find({
//       email: { $exists: true }
//     }).toArray();
//     console.log('Mencari dokumen dengan field email:', resultByEmailExists);

//     // 8. Mencari dokumen dengan nama salah satu dari beberapa nilai
//     const resultByNameIn = await collection.find({
//       nama: { $in: ['sadddssuke', 'fggfe'] }
//     }).toArray();
//     console.log('Mencari berdasarkan nama salah satu dari beberapa nilai:', resultByNameIn);

//     // 9. Mencari dokumen dengan operator logika $or dan $and
//     const resultByLogicalOperators = await collection.find({
//       $or: [
//         { $and: [{ age: { $gt: 20 } }, { email: { $exists: true } }] },
//         { nama: 'sadddssuke' }
//       ]
//     }).toArray();
//     console.log('Mencari dengan operator logika $or dan $and:', resultByLogicalOperators);

//   } catch (err) {
//     console.error("Error:", err);
//   } finally {
//     await client.close();
//   }
// }

// run().catch(console.dir);

// getting-started.js
// const ose = require('mongoose');


// // URL koneksi DB Cloud
// const URI = 'db+srv://souka:souka212@cluster1.ufd8j.db.net/data_kendaraan?retryWrites=true&w=majority&appName=cluster1';

// // Koneksi ke DB saat aplikasi dimulai
// ose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('Terhubung ke DB'))
//   .catch(err => console.error('Terjadi kesalahan saat menghubungkan ke DB:', err));

// // Membuat skema yang sesuai dengan data yang ada di database
// const dataSchema = new ose.Schema({
//     nama: String,
//     email: String,
//     no_Hp: String
// }, { versionKey: false });

// // Membuat model untuk koleksi 'data1'
// const Data = ose.model('data1', dataSchema);

// // Fungsi untuk menambah data baru atau mengupdate data
// async function addData(newData, t) {
//     try {
//         if (t === 1) {
//             const filter = { _id: newData._id };
//             const update = { nama: newData.nama, email: newData.email, no_Hp: newData.no_Hp };

//             let updatedDoc = await Data.findOneAndUpdate(filter, update, { new: true });
//             console.log("Data berhasil diperbarui:", updatedDoc);
//         } else {
//             const insertedData = await Data.create(newData);
//             console.log('Data baru berhasil ditambahkan:', insertedData);
//         }
//     } catch (error) {
//         console.error('Terjadi kesalahan:', error);
//     }
// }

// // Fungsi untuk menampilkan semua data
// async function fetchAllData(data) {
//     try {
//         const allData = await Data.find(data);
//         return allData;
//     } catch (error) {
//         console.error('Terjadi kesalahan:', error);
//     }
// }

// // Fungsi untuk menghapus data
// async function deleteData(data) {
//     try {
//         if (!ose.Types.ObjectId.isValid(data)) {
//             console.log("ID tidak valid");
//             return null;
//         }
//         const deleted = await Data.findByIdAndDelete({ _id: data });
//         return deleted;
//     } catch (error) {
//         console.error('Terjadi kesalahan:', error);
//     }
// }

// // Pada akhir aplikasi, tutup koneksi
// process.on('SIGINT', async () => {
//     await ose.connection.close();
//     console.log('Koneksi DB ditutup');
//     process.exit(0);
// });


// deleteData('66dd5ee437bb82394fb61').then((r) => {
//     console.log(r);
//     if (r){
//         console.log("data terhapus");
        
//     }else{
//         console.log("data ga ada");
//     }
// })
// // })
// fetchAllData().then((r) => {
//     console.log(r);
// })
// module.exports = {fetchAllData,addData,deleteData};

// Panggil fungsi untuk menambah data baru
// addData().then(() => {
//     // Setelah menambah data, panggil fungsi untuk menampilkan semua data
//     fetchAllData();
// });
// fetchAllData({nama:"souka"}).then((result) => {
//     console.log(result);
//     // result.forEach((r, index) => {
//     //     console.log(r._id.toString());
//     // });