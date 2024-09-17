const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    age: { type: Number, min: 0 },
    createdAt: { type: Date, default: Date.now },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }] // Reference to Order model
});

// Indexes for performance
userSchema.index({ uid: 1 }); // Index for user UID

const User = mongoose.model('User', userSchema);

module.exports = User;
