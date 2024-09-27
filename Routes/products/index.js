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

// GET /clothings - Get all products
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

// GET /clothings/categories - Get all unique product categories
router.get('/clothings/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category'); // Fetch distinct categories
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/clothings/category/:catName', async (req, res) => {
  try {
    const { category } = req.params;
    console.log('Fetching products for category:', category); // Log the category

    const products = await Product.find({ category });
    console.log('Products found:', products); // Log the fetched products

    if (products.length > 0) {
      return res.status(200).json({ products });
    } else {
      return res.status(404).json({ error: 'No products found in this category' });
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

// PUT /clothings/:id - Update a product
router.put('/clothings/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedProductData = req.body;

    if (updatedProductData.description) {
      updatedProductData.description = sanitizeHtml(updatedProductData.description);
    }

    const product = await Product.findByIdAndUpdate(id, updatedProductData, { new: true });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /clothings/:id/variants/:variantId - Delete a variant
router.delete('/clothings/:id/variants/:variantId', async (req, res) => {
  const { id, variantId } = req.params;

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { $pull: { variants: { _id: variantId } } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /clothings/:id/variants - Add a new variant
router.post('/clothings/:id/variants', async (req, res) => {
  const { id } = req.params;
  const { size, color, stock } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newVariant = { size, color, stock };
    product.variants.push(newVariant);
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding variant:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /clothings/:id/variants/:variantId - Update a variant
router.put('/clothings/:id/variants/:variantId', async (req, res) => {
  const { id, variantId } = req.params;
  const updatedVariantData = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variantIndex = product.variants.findIndex(variant => variant._id.toString() === variantId);
    if (variantIndex === -1) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Update the variant
    Object.assign(product.variants[variantIndex], updatedVariantData);
    await product.save();

    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /clothings/:id/featured - Update the featured status of a product
router.put('/clothings/:id/featured', async (req, res) => {
  try {
    const id = req.params.id;
    const { isFeatured } = req.body;

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

// PUT /clothings/:id/trending - Update the trending status of a product
router.put('/clothings/:id/trending', async (req, res) => {
  try {
    const id = req.params.id;
    const { isTrending } = req.body;

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
