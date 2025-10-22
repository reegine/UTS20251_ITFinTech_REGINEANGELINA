// src/pages/api/admin/products/index.js
import connectDB from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import adminAuth from '../../../../middleware/adminAuth';

async function handler(req, res) {
  await connectDB();

  try {
    switch (req.method) {
      case 'GET':
        // Get all products (including inactive ones for admin)
        const products = await Product.find().sort({ createdAt: -1 });
        return res.status(200).json({
          success: true,
          data: products
        });

      case 'POST':
        // Create new product
        const { name, description, price, image_url, stock, category, is_active } = req.body;

        const product = await Product.create({
          name,
          description,
          price: parseFloat(price),
          image_url,
          stock: parseInt(stock),
          category: category || 'dessert',
          is_active: is_active !== undefined ? is_active : true
        });

        return res.status(201).json({
          success: true,
          data: product,
          message: 'Product created successfully'
        });

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Admin products API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}

export default adminAuth(handler);