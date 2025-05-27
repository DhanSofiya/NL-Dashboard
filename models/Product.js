// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image_uri: { type: String, required: true },
  price: { type: Number, required: true },
  supplier_price: { type: Number, required: true },
  ar_uri: { type: String, default: "" },
  description: { type: String, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  stock: { type: Number, default: 0 } // ✅ Corrected to match POST logic
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);