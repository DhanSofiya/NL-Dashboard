const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const Product = require('../models/Product'); // ✅ Added
const nodemailer = require('nodemailer');
require('dotenv').config();  // Ensure env variables are loaded

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

// ✅ SEND ORDER EMAIL to supplier
router.post('/:id/sendOrderEmail', async (req, res) => {
  try {
    const { product, quantity, notes } = req.body;
    if (!product || !quantity) {
      return res.status(400).json({ message: "Product and quantity are required" });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.EMAIL_USER, // literally "apikey"
        pass: process.env.EMAIL_PASS  // your SendGrid API key
      }
    });

    const mailOptions = {
      from: `"NL-Dashboard Orders" <niltiva@proton.me>`, 
      replyTo: 'aqua.star.d@gmail.com',                  
      to: supplier.email,
      subject: `Order Request from NL-Dashboard`,
      text: `
Hi ${supplier.name},

We would like to place an order:

Product: ${product}
Quantity: ${quantity}
Notes: ${notes || "None"}

Please reply to this email to confirm.

Thank you,
NL-Dashboard Team
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Error sending email:", error);
        return res.status(500).json({ message: "Failed to send order email" });
      }
      res.json({ message: "Order email sent successfully" });
    });

  } catch (error) {
    console.error("❌ Error sending order email:", error);
    res.status(500).json({ message: "Failed to send order email" });
  }
});

// ✅ GET all products linked to a supplier (for product dropdown)
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