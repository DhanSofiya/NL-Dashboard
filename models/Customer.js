// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  phone: String,
  role: String
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema, 'users'); 
// Uses the 'users' collection