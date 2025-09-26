import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Payment from '../../../models/Payment';
import xenditClient from '../../../lib/xendit';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await Order.findOne({ order_id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.payment_request_id) {
      try {
        const invoiceStatus = await xenditClient.getInvoice(order.payment_request_id);
        const statusMap = {
          'PENDING': 'pending',
          'PAID': 'paid',
          'EXPIRED': 'expired',
          'SETTLED': 'paid',
        };
        
        const newStatus = statusMap[invoiceStatus.status] || 'pending';
        
        if (newStatus !== order.status) {
          await Order.findByIdAndUpdate(order._id, { status: newStatus });
          await Payment.findOneAndUpdate(
            { order_id },
            { status: newStatus, xendit_response: invoiceStatus }
          );
          order.status = newStatus;
        }
      } catch (xenditError) {
        console.error('Xendit status check error:', xenditError);
      }
    }

    res.status(200).json({
      order_id: order.order_id,
      status: order.status,
      amount: order.total_amount,
      currency: order.currency,
      payment_request_id: order.payment_request_id,
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
}