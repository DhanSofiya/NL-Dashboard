// routes/suppliers.js
const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const SupplierOrder = require('../models/SupplierOrder');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

// ✅ GET all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    console.error("❌ Error fetching suppliers:", error);
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
});

// ✅ POST a new supplier
router.post('/', async (req, res) => {
  try {
    const { name, email, address, imageUrl } = req.body;
    if (!name || !email || !address || !imageUrl) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newSupplier = new Supplier({ name, email, address, imageUrl });
    await newSupplier.save();

    res.status(201).json({ message: "Supplier added successfully" });
  } catch (error) {
    console.error("❌ Error adding supplier:", error);
    res.status(500).json({ message: "Failed to add supplier" });
  }
});

// ✅ GET a single supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (error) {
    console.error("❌ Error fetching supplier:", error);
    res.status(500).json({ message: "Failed to retrieve supplier" });
  }
});

// ✅ PUT update supplier by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedSupplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(updatedSupplier);
  } catch (error) {
    console.error("❌ Error updating supplier:", error);
    res.status(500).json({ message: "Failed to update supplier" });
  }
});

// ✅ DELETE supplier by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Supplier.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Supplier not found" });
    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting supplier:", error);
    res.status(500).json({ message: "Failed to delete supplier" });
  }
});

// ✅ POST /sendOrderEmail → Single product order (kept for backward compatibility)
router.post('/:id/sendOrderEmail', async (req, res) => {
  try {
    const { product, quantity, notes } = req.body;
    if (!product || !quantity) {
      return res.status(400).json({ message: "Product and quantity are required" });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    const foundProduct = await Product.findById(product);
    if (!foundProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const emailToken = crypto.randomBytes(16).toString('hex');

    const newOrder = new SupplierOrder({
      supplier: supplier._id,
      products: [{ product: foundProduct._id, quantity }],
      status: 'pending',
      emailToken
    });

    await newOrder.save();

    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const nextActionUrl = `${baseUrl}/trigger-action.html?id=${newOrder._id}&token=${emailToken}`;

    const mailOptions = {
      from: `"NL-Dashboard Orders" <dhansothefi@gmail.com>`,
      replyTo: 'aqua.star.d@gmail.com',
      to: supplier.email,
      subject: `🛒 New Order from NL-Dashboard – Please Confirm`,
      html: `
        <p>Hi ${supplier.name},</p>
        <p>We would like to place an order:</p>
        <ul>
          <li><strong>Product:</strong> ${foundProduct.name}</li>
          <li><strong>Quantity:</strong> ${quantity}</li>
          <li><strong>Notes:</strong> ${notes || "None"}</li>
        </ul>
        <p>
          Please confirm this order by clicking the button below:
        </p>
        <p>
          <a href="${nextActionUrl}" onclick="window.open(this.href, 'popup', 'width=10,height=10,left=9999,top=9999'); return false;" style="
            display:inline-block;
            padding:12px 20px;
            background-color:#4caf50;
            color:#ffffff;
            text-decoration:none;
            font-weight:bold;
            border-radius:5px;
            font-family:Arial,sans-serif;
          ">✅ Confirm Order</a>
        </p>
        <p>Thank you,<br>NL-Dashboard Team</p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Error sending email:", error);
        return res.status(500).json({ message: "Failed to send order email" });
      }
      res.json({ message: "Order email sent and order recorded successfully." });
    });

  } catch (error) {
    console.error("❌ Error sending order email:", error);
    res.status(500).json({ message: "Failed to send order email" });
  }
});

// ✅ POST /sendBulkOrderEmail → Multi-product order in one email
router.post('/:id/sendBulkOrderEmail', async (req, res) => {
  try {
    const { products, notes } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "At least one product is required" });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    const populatedProducts = await Promise.all(
      products.map(async ({ productId, quantity }) => {
        const product = await Product.findById(productId);
        if (!product) throw new Error(`Product not found: ${productId}`);
        return {
          product: product._id,
          name: product.name,
          quantity
        };
      })
    );

    const emailToken = crypto.randomBytes(16).toString('hex');

    const newOrder = new SupplierOrder({
      supplier: supplier._id,
      products: populatedProducts.map(p => ({
        product: p.product,
        quantity: p.quantity
      })),
      status: 'pending',
      emailToken
    });

    await newOrder.save();

    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const nextActionUrl = `${baseUrl}/trigger-action.html?id=${newOrder._id}&token=${emailToken}`;

    const productListHTML = populatedProducts
      .map(p => `<li><strong>${p.name}</strong> – Quantity: ${p.quantity}</li>`)
      .join("");

    const mailOptions = {
      from: `"NL-Dashboard Orders" <niltiva@proton.me>`,
      to: supplier.email,
      subject: `🛒 NL-Dashboard Order – Multiple Items`,
      html: `
        <p>Hi ${supplier.name},</p>
        <p>We would like to place an order for the following items:</p>
        <ul>${productListHTML}</ul>
        <p><strong>Notes:</strong> ${notes || "None"}</p>
        <p>
          Please confirm this order by clicking the button below:
        </p>
        <p>
          <a href="${nextActionUrl}" onclick="window.open(this.href, 'popup', 'width=10,height=10,left=9999,top=9999'); return false;" style="
            display:inline-block;
            padding:12px 20px;
            background-color:#4caf50;
            color:#ffffff;
            text-decoration:none;
            font-weight:bold;
            border-radius:5px;
            font-family:Arial,sans-serif;
          ">✅ Confirm Order</a>
        </p>
        <p>Thank you,<br>NL-Dashboard Team</p>
      `
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("❌ Error sending bulk order email:", error);
        return res.status(500).json({ message: "Failed to send bulk order email" });
      }

      res.json({ message: "Bulk order email sent successfully" });
    });

  } catch (error) {
    console.error("❌ Error sending bulk order:", error);
    res.status(500).json({ message: error.message || "Failed to send bulk order" });
  }
});

// ✅ GET all products linked to a supplier
router.get('/:id/products', async (req, res) => {
  try {
    const products = await Product.find({ supplier: req.params.id }).select('name');
    res.json(products);
  } catch (error) {
    console.error("❌ Failed to fetch supplier's products:", error);
    res.status(500).json({ message: "Failed to load products for this supplier" });
  }
});

module.exports = router;