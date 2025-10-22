// src/pages/api/products/index.js
import connectDB from '../../../lib/mongodb';
import Product from '../../../models/Product';

export default async function handler(req, res) {
  console.log('Products API called:', req.method, req.query);
  
  try {
    await connectDB();
    console.log('Database connected');

    switch (req.method) {
      case 'GET':
        try {
          const { currency, search, category, page = 1, limit = 12, minPrice, maxPrice, inStock } = req.query;
          
          console.log('📋 Query parameters:', { currency, search, category, page, limit, minPrice, maxPrice, inStock });
          
          // Always filter for active products
          let filter = { is_active: true };
          
          if (currency && currency !== 'all') {
            filter.currency = currency;
          }

          if (category && category !== 'all') {
            filter.category = category;
          }
          
          if (search) {
            filter.$or = [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ];
          }

          // Add price range filter
          if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
          }

          // Add stock filter
          if (inStock === 'true') {
            filter.stock = { $gt: 0 };
          }

          const skip = (parseInt(page) - 1) * parseInt(limit);
          
          console.log('Finding products with filter:', JSON.stringify(filter, null, 2));
          
          const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
          
          const total = await Product.countDocuments(filter);

          console.log(`✅ Found ${products.length} active products out of ${total} total active products`);
          
          // Double-check that all returned products are active
          const activeProducts = products.filter(product => product.is_active === true);
          
          if (activeProducts.length !== products.length) {
            console.warn(`⚠️ Found ${products.length - activeProducts.length} inactive products in results`);
          }

          res.status(200).json({
            success: true,
            count: total,
            results: activeProducts,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: total,
              pages: Math.ceil(total / limit)
            }
          });
        } catch (error) {
          console.error('❌ Error fetching products:', error);
          res.status(500).json({ 
            success: false,
            error: 'Failed to fetch products: ' + error.message 
          });
        }
        break;

      case 'POST':
        try {
          const product = await Product.create(req.body);
          res.status(201).json({
            success: true,
            data: product
          });
        } catch (error) {
          res.status(400).json({ 
            success: false,
            error: error.message 
          });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed: ' + error.message
    });
  }
}