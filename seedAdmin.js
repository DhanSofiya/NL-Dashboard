const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Failed:", err));

// Schema and Model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    password: String,
    role: { type: String, enum: ["Godmode", "Staff", "Customer", "Rider"], default: "Customer" }
}, { timestamps: true });

const AdminUser = mongoose.model('User', userSchema, 'adminUsers'); // Using 'adminUsers' collection

async function createGodmodeAdmin() {
    const email = 'overlord@example.com';
    const password = '12345';

    const existing = await AdminUser.findOne({ email });
    if (existing) {
        console.log("⚠️ Godmode Admin already exists.");
        process.exit();
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = new AdminUser({
        name: 'Overlord Supreme',
        email,
        password: hashed,
        role: 'Godmode'
    });

    await admin.save();
    console.log("✅ Godmode Admin user created successfully.");
    process.exit();
}

createGodmodeAdmin();