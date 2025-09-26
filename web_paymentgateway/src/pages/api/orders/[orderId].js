import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';

export default async function handler(req, res) {
  await dbConnect();
  
  const { orderId } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const order = await Order.findOne({ order_id: orderId })
          .populate('items.product');
        
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(order);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}