import connectDB from '../../lib/mongodb';
import Product from '../../models/Product';

export default async function handler(req, res) {
  try {
    console.log('🔍 Starting debug...');
    
    console.log('📡 Testing MongoDB connection...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    console.log('🔧 Testing Product model...');
    const productModel = Product;
    console.log('✅ Product model loaded:', productModel ? 'Yes' : 'No');
    
    console.log('📊 Counting products...');
    const productCount = await Product.countDocuments();
    console.log('✅ Product count:', productCount);
    
    console.log('🔎 Finding one product...');
    const sampleProduct = await Product.findOne();
    console.log('✅ Sample product:', sampleProduct);
    
    console.log('📋 Listing all products...');
    const allProducts = await Product.find({}).limit(5);
    console.log('✅ First 5 products:', allProducts);
    
    res.status(200).json({
      success: true,
      debugInfo: {
        mongoConnected: true,
        productModelExists: true,
        productCount: productCount,
        sampleProduct: sampleProduct,
        firstFiveProducts: allProducts,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}