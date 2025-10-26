const mysql = require('mysql2/promise');

// Membuat pool koneksi ke database
const pool = mysql.createPool({
  host: '172.17.0.2',
  user: 'root',
  database: 'projectcarbonfix',
  password:'rootpassword',
  waitForConnections: true,
  connectionLimit: 10, // Jumlah maksimal koneksi yang dapat dibuka sekaligus
  queueLimit: 0 // Tidak ada batas untuk antrean koneksi
});
console.log(pool)
// Fungsi yang mengembalikan sebuah Promise
async function fetchData(query, values) {
  let connection;
  try {
    // Mendapatkan koneksi dari pool
    connection = await pool.getConnection();
    console.log('Connected to the database as id ' + connection.threadId);

    // Menjalankan query
    const [results] = await connection.query(query, values);

    // Validasi apakah query berhasil
    if (results.affectedRows > 0) {
      console.log('Query berhasil dijalankan.');
      return 1;
    } else {
      console.log('Query dijalankan tetapi tidak mempengaruhi baris apapun.');
      return results;
    }

  } catch (error) {
    console.error('Error executing query:', error.stack);
    throw error;
  } finally {
    // Pastikan koneksi selalu dikembalikan ke pool
    if (connection) connection.release();
  }
}

// Function to get data and export
async function getData(query, values) {
  try {
    const results = await fetchData(query, values);
    return results;
  } catch (error) {
    console.error(error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
}


module.exports = { getData };
