const express = require('express');
const multer = require('multer');
const path = require('path');
const connectDB = require('./config/db');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 📦 Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 🔗 Connect MongoDB
connectDB();
const mongoose = require('mongoose');

mongoose.connection.on('connected', () => {
  console.log(`✅ Connected to MongoDB database: ${mongoose.connection.name}`);
});


// 🛠 Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5000", credentials: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Serve reusable components
app.use('/components', express.static(path.join(__dirname, 'components')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 60 * 60 * 1000 } // 1 hour
}));

// 📌 API ROUTES
app.use('/api/admin-users', require('./routes/adminUsers'));
app.use('/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/supplier-orders', require('./routes/supplierOrders'));
app.use('/components', express.static(path.join(__dirname, 'components')));


// 📄 VIEWS ROUTES
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/admin-users', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'adminUsers.html'));
});

app.get('/addUser.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'addUser.html'));
});

app.get('/suppliers', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'suppliers.html'));
});

app.get('/addSupplier', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'addSupplier.html'));
});

app.get('/supplierDetails', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'supplierDetails.html'));
});

app.get('/inventory', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'inventory.html'));
});

app.get('/addProduct', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'addProduct.html'));
});

app.get('/editProduct.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'editProduct.html'));
});

app.get('/editAdmin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'editAdmin.html'));
});

app.get('/finance', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'finance.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'orders.html'));
});

// ✅ NEW: Supplier email button redirect page (auto-close window)
app.get('/trigger-action.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'trigger-action.html'));
});

// 📤 Image Upload
app.post('/uploadImage', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ message: 'Image upload failed' });
  }
});

// 🔒 Logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Error logging out" });
    res.clearCookie('connect.sid');
    res.json({ message: "Logged out successfully" });
  });
});

// 🌐 Default redirect
app.get('/', (req, res) => {
  res.redirect('/login');
});

// 🚀 Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🎶 Dashboard running on port ${PORT}. Ease on your FYP, Sofiya 🌹`));