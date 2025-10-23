// src/pages/api/admin/analytics.js
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      console.error('❌ No token provided');
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      const { period = 'month', startDate, endDate } = req.query;

      const matchFilter = { status: 'paid' };
      if (startDate || endDate) {
        matchFilter.createdAt = {};
        if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
        if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
      } else {
        matchFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      }

      let groupFormat;
      switch (period) {
        case 'day':
          groupFormat = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
          break;
        case 'week':
          groupFormat = {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          };
          break;
        case 'year':
          groupFormat = { year: { $year: '$createdAt' } };
          break;
        default:
          groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
      }

      const revenueData = await Order.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: groupFormat,
            totalRevenue: { $sum: '$total_amount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } }
      ]);

      const statusStats = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$total_amount' }
          }
        }
      ]);

      const topProducts = await Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product_name',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.unit_price', '$items.quantity'] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
      ]);

      res.status(200).json({
        success: true,
        data: {
          revenueData,
          statusStats,
          topProducts,
          summary: {
            totalOrders: await Order.countDocuments(),
            totalRevenue: await Order.aggregate([
              { $match: { status: 'paid' } },
              { $group: { _id: null, total: { $sum: '$total_amount' } } }
            ]).then(result => result[0]?.total || 0),
            pendingOrders: await Order.countDocuments({ status: 'pending' })
          }
        }
      });
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('analytics error', error);
    
    if (error.message.includes('jwt') || error.message.includes('token')) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    res.status(500).json({ error: 'Failed to fetch analytics: ' + (error.message || error) });
  }
}