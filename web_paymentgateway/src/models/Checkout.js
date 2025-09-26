import mongoose from 'mongoose';

const checkoutSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true
  },
  customer_info: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zip_code: String
    }
  },
  cart_items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    price: Number,
    quantity: Number,
    image_url: String
  }],
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['IDR', 'PHP', 'USD'],
    default: 'IDR'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'abandoned'],
    default: 'active'
  },
  order_created: {
    type: Boolean,
    default: false
  },
  expires_at: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 3600 }
  }
}, {
  timestamps: true
});

checkoutSchema.index({ session_id: 1 });
checkoutSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Checkout || mongoose.model('Checkout', checkoutSchema);