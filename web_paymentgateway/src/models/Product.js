import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true
  },
  price: {
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
  image_url: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    default: 'general'
  },
  tags: [String]
}, {
  timestamps: true
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ is_active: 1, category: 1 });

export default mongoose.models.Product || mongoose.model('Product', productSchema);