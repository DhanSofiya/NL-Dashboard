// models/Order.js
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  deliveryLocation: {
    address: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number }
  },
  totalPrice: {
    type: Number,
    required: true
  },
  riderCommission: {
    type: Number,
    required: true
  },
  platformProfit: {
    type: Number,
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      quantity: {
        type: Number,
        required: true
      }
    }
  ],
  status: {
    type: String,
    enum: [
      "pending",     // customer places order
      "packed",      // shop prepares order
      "cancelled",   // shop cancels order
      "picked_up",   // rider collects the item
      "in_transit",  // rider is on the way
      "delivered",   // customer receives the item
      "completed"    // optional final stage
    ],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", OrderSchema);