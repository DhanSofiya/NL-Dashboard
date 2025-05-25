const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    address: { type: String },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["Admin", "Staff", "Customer", "Rider"],
        default: "Customer"
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema, 'adminUsers');