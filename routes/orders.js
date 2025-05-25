// routes/orders.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ✅ ORDER MODEL
const orderSchema = new mongoose.Schema({
  user: String,
  deliveryDate: Date,
  address: String,
  items: [
    {
      product: mongoose.Types.ObjectId,
      quantity: Number
    }
  ],
  status: String
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema, 'orders');

// ✅ CUSTOMER MODEL
const customerSchema = new mongoose.Schema({
  phone: String
}, { strict: false });

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema, 'users');

// ✅ PRODUCT MODEL
const productSchema = new mongoose.Schema({
  name: String
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');

// ✅ GET /api/orders – Manual join
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    // Extract unique customer and product IDs
    const customerIds = orders.map(o => o.user).filter(Boolean);
    const productIds = orders.flatMap(o => o.items.map(i => i.product)).filter(Boolean);

    // Query customers and products
    const customers = await Customer.find({ _id: { $in: customerIds } });
    const products = await Product.find({ _id: { $in: productIds } });

    // Create lookup maps
    const customerMap = {};
    customers.forEach(c => { customerMap[c._id.toString()] = c.phone; });

    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p.name; });

    // Build enriched orders safely
    const enrichedOrders = orders.map(o => ({
      ...o.toObject(),
      customerPhone: customerMap[o.user] || 'N/A',
      items: o.items.map(i => ({
        name: productMap[i.product?.toString?.()] ||
              (i.product ? `Product ID: ${i.product}` : 'Unknown Product'),
        quantity: i.quantity
      }))
    }));

    res.json(enrichedOrders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

module.exports = router;