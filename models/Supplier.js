const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ },
  address: { type: String, required: true },
  imageUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);