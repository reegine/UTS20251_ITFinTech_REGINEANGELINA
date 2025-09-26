import connectDB from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import Payment from '../../../../models/Payment';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { order_id } = req.query;
    
    if (!order_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Order ID is required' 
      });
    }

    const order = await Order.findOne({ order_id });
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    const payment = await Payment.findOne({ order: order._id });
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order_id: order.order_id,
        status: payment.status,
        payment_id: payment.xendit_invoice_id,
        paid_at: payment.paid_at,
        amount: payment.amount,
        currency: payment.currency
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}