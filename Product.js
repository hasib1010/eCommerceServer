const mongoose = require('mongoose');

// Define a variant schema
const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 } // Stock should not be negative
});

// Define the main product schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String }, // This will store the category of the product
  price: { type: Number, required: true }, 
  material: { type: String },
  brand: { type: String },
  tags: { type: String },
  discountAmount: { type: Number },
  discountValidUntil: { type: Date },
  thumbnailImage: { type: String },
  hoverImageUrl: { type: String },
  catalogImages: [String],
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  variants: [variantSchema]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema, 'ProductCollection');

module.exports = Product;
