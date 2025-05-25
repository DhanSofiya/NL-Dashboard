const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });

        if (!user || !["Godmode", "Admin", "Staff"].includes(user.role)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        req.session.user = { id: user._id, name: user.name, role: user.role };

        res.json({ token, user: req.session.user });
    } catch (error) {
        res.status(500).json({ message: "Error logging in" });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
    });
});

module.exports = router;
