//Kevinpay@23
const { verifyToken } = require('./middleware/auth_middleware');

const { v4: uuidv4 } = require('uuid'); 
const midtransClient = require('midtrans-client');

// Inisialisasi Core API Client

// app.js
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
const dotenv = require('dotenv');

dotenv.config();
const {getStatusTransaction} = require('./middleware/transaksi');
const authRoutes = require('./router/auth_router');
const { getData } = require('./mysql');
// const contactRoutes = require('./router/router');
const vehicleRoutes = require('./router/router_vehicle')
const analysisRoutes = require('./router/router_analysis')
const usersRoutes = require('./router/users')
const adminRoutes = require('./router/admin')
const products = require('./router/market')
const {getTransactionToken} = require('./payment')
const bodyParser = require('body-parser');
const morgan = require('morgan');


const app = express();
const port = 3000;
app.use(bodyParser.json())
app.use(morgan('tiny'));

// Middleware setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('secret'));
app.use(session({
    httpOnly: true,
    cookie: { maxAge: 600000000 },
    secret: 'secret',
    resave: false,
    secure: true,
    saveUninitialized: true,
    sameSite: 'none',
}));
const api = process.env.API_URL
app.use(flash());
app.post(`${api}/products`, (req, res) => {
    const newProduct = req.body;
    console.log(newProduct);
    const myProduct = {
        id:1,
        barang: 'makanan',
        nama: 'soto',
        harga: 3000
    };
    res.send(newProduct);
});

const snap= new midtransClient.Snap({
    isProduction: false, // Gunakan `true` untuk mode produksi
    serverKey: process.env.NEXT_PUBLIC_SECRET,
    clientKey: process.env.NEXT_PUBLIC_CLIENT
});

const fetch = require('node-fetch');

const MIDTRANS_SERVER_KEY = process.env.NEXT_PUBLIC_SECRET; 



// Ganti dengan Server Key Anda
const mydata = ()=>{
    return  {
        transaction_details: {
            order_id: `carbonOrders-${Date.now()}`, // Gunakan order_id unik
            gross_amount: 190000
        },
        customer_details: {
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@midtrans.com",
            phone: "+62181000000000",
            notes: "Thank you for your purchase. Please follow the instructions to pay."
        },
        callbacks: {
            finish: "http://localhost:4000"
        },
        enabled_payments: ["credit_card", "bca_va", "indomaret"],
        item_details: [
            {
                id: "item-001",
                name: "Pillow",
                price: 95000,
                quantity: 2
            }
            
        ]
    };
}
// Endpoint untuk mendapatkan status transaksi
app.get('/dashboard', verifyToken, async (req, res) => {
    const query = `SELECT * FROM transaction WHERE buyerID = ?`;

    try {
        console.log("Fetching transactions for user:", req.user);

        // Ambil data transaksi berdasarkan buyerID
        const dataTransaksi = await getData(query, [req.user]);

        if (!dataTransaksi || dataTransaksi.length === 0) {
            console.log("No transactions found.");
        } else {
            console.log("Transactions fetched:", dataTransaksi);
        }

        // Inisialisasi array untuk menyimpan transaksi yang diperbarui
        const myTransaction = [];

        // Proses setiap transaksi satu per satu dengan async/await
        for (const item of dataTransaksi) {
            if (item.status === 'pending') {
                // Dapatkan status transaksi untuk item yang pending
                const data = await getStatusTransaction(item.id);

                // Log status transaksi
                console.log("Transaction status for item:", item.id, data);

                // Jika status_code adalah 200 dan transaksi masih pending, update ke success
                if (data.success && data.data.status_code === '200') {
                    // Update status transaksi di database menjadi 'success'
                    const updateQuery = `UPDATE transaction SET status = 'success' WHERE id = ?`;
                    await getData(updateQuery, [item.id]);  // Pastikan updateData menghandle query update

                    // Update status di objek transaksi agar sesuai dengan status yang baru
                    item.status = 'success';
                }
            }
            // Push transaksi yang sudah diproses ke array myTransaction
            myTransaction.push(item);
        }

        // Render dashboard dengan data transaksi yang telah diperbarui
        res.render('dashboard', {
            layout: 'layouts/main_layout',
            role: req.role,
            myTransaction
        });
    } catch (error) {
        console.error('Error while fetching transactions:', error);
        res.status(500).send('Error fetching transactions');
    }
});


app.get('/transaction-status/:order_id', async (req, res) => {
    const orderId = req.params.order_id;

    try {
        // Encode server key untuk otorisasi
        const encodedKey = Buffer.from(MIDTRANS_SERVER_KEY).toString('base64');
        
        // Endpoint Midtrans untuk cek status transaksi
        const url = `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

        // Fetch data dari Midtrans API
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${encodedKey}`
            }
        });

        // Parse hasil respons
        const transactionStatus =response.json();

        // Jika ada error dalam respons Midtrans
        if (!response.ok) {
            throw new Error(transactionStatus.status_message || 'Failed to fetch transaction status');
        }

        // Kirimkan data status transaksi ke klien
        res.status(200).json(transactionStatus);
    } catch (error) {
        console.error('Error fetching transaction status:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/transaksi', async function (req, res) {
    const data = mydata()
    try {
   
        // Validasi variabel environment
        const secret = process.env.NEXT_PUBLIC_SECRET;
        const apiBaseUrl = process.env.NEXT_PUBLIC_API;
    
        if (!secret || !apiBaseUrl) {
            throw new Error('Environment variables NEXT_PUBLIC_SECRET or NEXT_PUBLIC_API are not defined');
        }
    
        // Encode server key
        const encodedSecret = Buffer.from(secret).toString('base64');
    
        // Data transaksi
        
    
        // Fetch ke Midtrans untuk membuat transaksi
        const createTransactionResponse = await fetch(`${apiBaseUrl}/v1/payment-links`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${encodedSecret}`
            },
            body: JSON.stringify(data)
        });
        const transactionData = await fetch('https://api.sandbox.midtrans.com/v2/charge',{
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${encodedSecret}`
            },
            body: JSON.stringify(data)
        })
    
        if (!createTransactionResponse.ok) {
            const errorText = await createTransactionResponse.text();
            throw new Error(`Failed to create transaction: ${errorText}`);
        }
    
        const transactionResult = await createTransactionResponse.json();
        const transactionDatas  = await transactionData.json();
        console.log(transactionDatas);
        console.log('Transaction Result:', transactionResult);
    
        // Fetch ke Midtrans untuk mendapatkan status transaksi
        const orderId = transactionResult.order_id;
        const options = {method: 'GET', headers: {accept: 'application/json'}};

        console.log(`https://api.sandbox.midtrans.com/v2/${orderId}/status`, options)
           
       
        // Gabungkan hasil transaksi dan status
        const result = {
            ...transactionResult,
           
        };
    
        // Kirim respons ke klien
        res.status(200).json(result);
    
    } catch (error) {
        console.error('Error processing transaction:', error.message);
        res.status(500).send({
            error: 'An error occurred while processing your transaction.',
            message: error.message
        });
    }
});

app.get('/status', async (req, res) => {
    const orderId = "carbonOrders-1733812014737"; // Order ID yang ingin dicek

    try {
        // Fetch transaction status using Snap SDK
        const response = await snap.transaction.status(orderId);

        // Send the transaction status back to the client
        res.status(200).json(response);
    } catch (err) {
        console.error('Error fetching transaction status:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/create', async (req, res) => {
    try {
        // Pastikan data yang Anda kirim sudah sesuai dengan format Midtrans
        const transaction = await snap.createTransaction(mydata());
    
        console.log('Transaction created:', transaction);
    
        // Return URL untuk redirect pengguna ke halaman pembayaran
        return transaction.redirect_url;
      } catch (error) {
        console.error('Error creating transaction:', error.message);
        return null;
      }
});
app.post('/create-transaction', async (req, res) => {
    const payload = {
        transaction_details: {
            order_id: `carbonOrder-${Date.now()}`,
            gross_amount: 100000, // Jumlah pembayaran
        },
        customer_details: {
            first_name: "John",
            last_name: "Doe",
            email: "johndoe@example.com",
            phone: "08123456789",
        },
    };

    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: 'Basic U0ItTWlkLXNlcnZlci1kT2JBQ0FYSVZoSG5OQ3AzWGNIMkdudXY=' // Ganti dengan Server Key Base64
        },
        body: JSON.stringify(payload)
    };

    try {
        const response = await fetch('https://api.sandbox.midtrans.com/v2/charge', options);
        const result = await response.json();

        if (response.ok) {
            // Kirimkan respons termasuk order_id ke client
            res.status(200).json(result);
        } else {
            console.error('Error creating transaction:', result);
            res.status(response.status).json(result);
        }
    } catch (err) {
        console.error('Error creating transaction:', err.message);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});
app.get('/mytransaksi',(req,res)=>{
    const data = mydata()
    


    snap.createTransaction(data)
        .then((transaction)=>{
            // transaction token
            let transactionToken = transaction.token;
            res.render('cobaTransaksi',{
                layout:false,
                transaksi:transactionToken


            })
        })
    })


app.get('/history', async (req, res) => {
        // Menghitung tanggal dua minggu lalu dan hari ini
        const today = new Date();
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 14); // Mengurangi 14 hari dari hari ini
      
        // Format tanggal menjadi YYYY-MM-DD
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Menambahkan leading zero
          const day = String(date.getDate()).padStart(2, '0'); // Menambahkan leading zero
          return `${year}-${month}-${day}`;
        };
      
        const from_date = formatDate(twoWeeksAgo);
        const to_date = formatDate(today);
      
        // Menyiapkan body request dengan rentang tanggal yang sudah dihitung
        const options = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic U0ItTWlkLXNlcnZlci1kT2JBQ0FYSVZoSG5OQ3AzWGNIMkdudXY6', // Ganti dengan Base64 Server Key Anda
          },
        
        };
      
        try {
          // Endpoint untuk mendapatkan riwayat transaksi
          const url =  `https://api.sandbox.midtrans.com/v1/statements?from_date=${from_date}&to_date=${to_date}`;
          
          const response = await fetch(url, options);
      
          // Cek apakah respons berhasil
          if (!response.ok) {
            const errorDetails = await response.text();
            console.error('Error Response:', errorDetails);
            return res.status(response.status).json({ error: 'Failed to fetch transaction history', details: errorDetails });
          }
      
          // Mengambil data dari response jika berhasil
          const status = await response.json();
      
          // Kirimkan hasil status transaksi ke client
          res.status(200).json(status);
      
        } catch (err) {
          console.error('Error fetching transaction history:', err.message);
          res.status(500).json({ error: 'Failed to fetch transaction history', message: err.message });
        }
      });

// Routes
app.use('/', authRoutes);
// app.use('/contact', contactRoutes);
app.use('/vehicle',vehicleRoutes);
app.use('/analysis',analysisRoutes);
app.use('/market',products);
// 404 handler
app.use('/users',usersRoutes);
app.use('/admin',adminRoutes);
app.use((req, res) => {
    res.status(404).render('error', { title: '404 Not Found' });
});

app.listen(3000, () => {
    console.log(`Servers listening on port ${3000}`);
});


