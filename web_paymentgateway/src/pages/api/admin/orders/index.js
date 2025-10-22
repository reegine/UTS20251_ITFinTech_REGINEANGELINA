// src/pages/api/admin/orders/index.js
import connectDB from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    // Verify admin access
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;
      
      let filter = {};
      if (status && status !== 'all') filter.status = status;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      
      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(); // Use lean() for better performance

      const total = await Order.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Orders API error:', error);
    res.status(500).json({ error: 'Failed to fetch orders: ' + error.message });
  }
}