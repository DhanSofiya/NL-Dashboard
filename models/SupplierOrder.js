const mongoose = require('mongoose');
const crypto = require('crypto');

const SupplierOrderSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  products: [
    {
      product: { type: String, required: true }, // could be changed to ObjectId if needed
      quantity: { type: Number, required: true }
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'completed'],
    default: 'pending'
  },
  emailToken: {
    type: String,
    required: true,
    default: () => crypto.randomBytes(16).toString('hex')
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.models.SupplierOrder || mongoose.model('SupplierOrder', SupplierOrderSchema);