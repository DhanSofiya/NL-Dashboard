const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ },
  address: { type: String, required: true },
  imageUrl: { type: String, required: true },
  rating: { type: Number, default: 0 }, // ⭐ Rating from 0–5
  onTimeDeliveries: { type: Number, default: 0 }, // ✅ Delivered on or before expected date
  totalCompletedOrders: { type: Number, default: 0 } // 📦 All completed or delayed orders
}, { timestamps: true });

// 🧹 Force model recompilation
delete mongoose.models.Supplier;

module.exports = mongoose.model('Supplier', SupplierSchema);