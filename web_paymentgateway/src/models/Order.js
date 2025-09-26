import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product_name: String,
  product_image: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  customer_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  customer_phone: {
    type: String,
    trim: true
  },
  shipping_address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zip_code: String
  },
  items: [orderItemSchema],
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
    enum: ['pending', 'paid', 'failed', 'expired', 'refunded', 'shipped', 'delivered'],
    default: 'pending'
  },
  payment_request_id: String,
  payment_id: String,
  xendit_response: mongoose.Schema.Types.Mixed,
  notes: String
}, {
  timestamps: true
});

orderSchema.pre('save', function(next) {
  this.total_amount = this.items.reduce((total, item) => total + item.total_price, 0);
  next();
});

orderSchema.index({ order_id: 1 });
orderSchema.index({ customer_email: 1, created_at: -1 });
orderSchema.index({ status: 1, created_at: -1 });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);