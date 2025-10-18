import connectDB from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    // Verify admin access
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = await verifyToken(token);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    switch (req.method) {
      case 'GET':
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        
        const products = await Product.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));
        
        const total = await Product.countDocuments();

        res.status(200).json({
          success: true,
          data: products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
        break;

      case 'POST':
        const product = await Product.create(req.body);
        res.status(201).json({
          success: true,
          data: product,
          message: 'Product created successfully'
        });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Operation failed: ' + error.message });
  }
}