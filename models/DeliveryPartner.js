// models/DeliveryPartner.js
const mongoose = require('mongoose');
const connectSecondaryDB = require('../config/secondaryDb');

const deliveryPartnerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  phone: Number,
  role: { type: String, enum: ["DeliveryPartner"], default: "DeliveryPartner" },
  liveLocation: {
    latitude: Number,
    longitude: Number,
  },
  address: String,
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
  commission: {
    type: Number,
    default: 0,
  },
});

const secondaryConnection = connectSecondaryDB();
const DeliveryPartner = secondaryConnection.model('DeliveryPartner', deliveryPartnerSchema);

module.exports = DeliveryPartner;
