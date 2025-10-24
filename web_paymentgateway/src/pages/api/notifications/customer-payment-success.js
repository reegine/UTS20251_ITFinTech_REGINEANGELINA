import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import { sendCustomerPaymentConfirmation } from '../../../lib/whatsapp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order ID is required' 
      });
    }

    console.log('📤 Sending direct customer payment confirmation for order:', order_id);

    await connectDB();

    const order = await Order.findOne({ order_id });

    if (!order) {
      console.warn('⚠️ Order not found:', order_id);
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    console.log('✅ Order found for customer notification:', {
      orderId: order.order_id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone
    });

    // Send payment confirmation to customer
    console.log('📤 Sending customer payment confirmation...');
    const customerNotificationResult = await sendCustomerPaymentConfirmation(order);

    if (customerNotificationResult.success) {
      console.log('✅ Customer payment confirmation sent successfully');
      return res.status(200).json({ 
        success: true, 
        message: 'Customer payment confirmation sent successfully' 
      });
    } else {
      console.warn('⚠️ Failed to send customer payment confirmation:', customerNotificationResult.error);
      return res.status(200).json({ 
        success: false, 
        error: customerNotificationResult.error,
        message: 'Customer payment confirmation failed'
      });
    }

  } catch (error) {
    console.error('❌ Customer payment notification error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}