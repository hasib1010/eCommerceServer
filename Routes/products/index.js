const express = require('express');
const sanitizeHtml = require('sanitize-html');
const Product = require("../../Product");
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

    if (newProduct.isFeatured === undefined) {
      newProduct.isFeatured = false;
    }

    const product = new Product(newProduct);
    const result = await product.save();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error inserting document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/clothings', async (req, res) => {
  try {
    const { category } = req.query;

    let filter = {};
    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter);
    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /clothings/categories - Get unique categories
router.get('/clothings/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Dynamic route to get products by category
router.get("/clothings/categories/:categoryName", async (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    const products = await Product.find({ category: categoryName });
    if (products.length > 0) {
      res.status(200).json({ products })
    } else {
      res.status(404).json({ error: "No Products Found" })
    }
  } catch (error) {
    console.error('Error fetching products by category:', error);
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

// PUT /clothings/:id/featured - Update the featured status of a product
router.put('/clothings/:id/featured', async (req, res) => {
  try {
    const id = req.params.id;
    const { isFeatured } = req.body;

    // Validate isFeatured is a boolean
    if (typeof isFeatured !== 'boolean') {
      return res.status(400).json({ error: 'isFeatured must be a boolean' });
    }

    const product = await Product.findById(id);
    if (product) {
      product.isFeatured = isFeatured;
      await product.save();
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.put('/clothings/:id/trending', async (req, res) => {
  try {
    const id = req.params.id;
    const { isTrending } = req.body;

    // Validate isTrending is a boolean
    if (typeof isTrending !== 'boolean') {
      return res.status(400).json({ error: 'isTrending must be a boolean' });
    }

    const product = await Product.findById(id);
    if (product) {
      product.isTrending = isTrending;
      await product.save();
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
