const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({ 
    price: Number, 
    quantity: Number,
    items: Array, 
    status: { type: String, default: 'pending' },
    transactionId: String,
    phoneNumber: String,
    shippingAddress: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Reference to the User model
});

// Indexes for performance
orderSchema.index({ transactionId: 1 }); // Index for transaction ID

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
