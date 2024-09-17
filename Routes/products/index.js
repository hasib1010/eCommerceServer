const express = require('express');
const sanitizeHtml = require('sanitize-html');
const Product = require("../../Product")
const router = express.Router();

router.use(express.json());

// Route to test if the route is working
router.get('/', (req, res) => {
  res.send('Hello Products');
});

// POST /clothings - Add a new product
router.post('/clothings', async (req, res) => {
  try {
    const newProduct = req.body;

    if (newProduct.description) {
      newProduct.description = sanitizeHtml(newProduct.description);
    }

    const product = new Product(newProduct);
    const result = await product.save();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error inserting document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /clothings - Get all products
router.get('/clothings', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /clothings/:id - Get a single product by ID
router.get('/clothings/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);

    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
