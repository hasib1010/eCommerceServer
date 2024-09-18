const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  sizes: [String],
  colors: [String],
  material: { type: String },
  brand: { type: String },
  tags: { type: String },
  discountAmount: { type: Number },
  discountValidUntil: { type: Date },
  thumbnailImage: { type: String },
  hoverImageUrl: { type: String },
  catalogImages: [String],
  isFeatured: { type: Boolean, default: false } // Add this line
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema, 'ProductCollection');

module.exports = Product;
