// 📂 routes/adminUsers.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner'); // 🟢 secondary DB model

// ✅ GET Admin, Staff (main DB) + Rider (from secondary DB)
router.get('/admin-users', async (req, res) => {
    try {
        const [adminStaffUsers, deliveryPartners] = await Promise.all([
            User.find({ role: { $in: ['Admin', 'Staff'] } }, { password: 0 }),
            DeliveryPartner.find({}, { password: 0 }) // All delivery partners
        ]);

        // Convert delivery partners into Rider-format users
        const riders = deliveryPartners.map(dp => ({
            _id: dp._id,
            name: dp.name,
            email: dp.email,
            role: 'Rider'
        }));

        const users = [...adminStaffUsers, ...riders];
        res.json(users);
    } catch (error) {
        console.error("Error fetching admin users:", error);
        res.status(500).json({ message: "Error fetching admin users" });
    }
});

// ✅ POST new Admin/Staff user (main DB only)
router.post('/admin-users', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "Email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: "Admin user added successfully" });
    } catch (error) {
        console.error("Error adding admin user:", error);
        res.status(500).json({ message: "Error adding admin user" });
    }
});

// ✅ PUT update Admin/Staff user (main DB only)
router.put('/admin-users/:id', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const updateFields = { name, email, role };
        if (password) {
            updateFields.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Admin user updated successfully" });
    } catch (error) {
        console.error("Error updating admin user:", error);
        res.status(500).json({ message: "Error updating admin user" });
    }
});

// ✅ DELETE Admin/Staff user (main DB only)
router.delete('/admin-users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Admin user deleted" });
    } catch (error) {
        console.error("Error deleting admin user:", error);
        res.status(500).json({ message: "Error deleting admin user" });
    }
});

module.exports = router;