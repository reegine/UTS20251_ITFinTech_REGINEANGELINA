import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    // Verify admin access
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = await verifyToken(token);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      const { period = 'month' } = req.query; // day, week, month, year
      
      let groupFormat;
      switch (period) {
        case 'day':
          groupFormat = { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
          break;
        case 'week':
          groupFormat = { week: { $week: '$createdAt' }, year: { $year: '$createdAt' } };
          break;
        case 'year':
          groupFormat = { year: { $year: '$createdAt' } };
          break;
        default: // month
          groupFormat = { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
      }

      const revenueData = await Order.aggregate([
        {
          $match: {
            status: 'paid',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          }
        },
        {
          $group: {
            _id: groupFormat,
            totalRevenue: { $sum: '$total_amount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
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
    res.status(500).json({ error: 'Failed to fetch analytics: ' + error.message });
  }
}