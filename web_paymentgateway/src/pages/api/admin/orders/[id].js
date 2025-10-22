// src/pages/api/admin/orders/[id].js
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

    const { id } = req.query;

    if (req.method === 'PUT') {
      const { status } = req.body;

      // Validate status
      const validStatuses = ['pending', 'paid', 'failed', 'expired', 'refunded', 'shipped', 'delivered'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        });
      }

      // Find and update the order
      const order = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.status(200).json({
        success: true,
        data: order,
        message: `Order status updated to ${status}`
      });

    } else if (req.method === 'GET') {
      // Get single order
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.status(200).json({
        success: true,
        data: order
      });

    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Order API error:', error);
    res.status(500).json({ error: 'Failed to process order: ' + error.message });
  }
}