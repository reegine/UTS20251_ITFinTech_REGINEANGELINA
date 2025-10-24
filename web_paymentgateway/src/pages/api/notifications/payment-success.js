import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import { sendOrderNotification, sendCustomerPaymentConfirmation } from '../../../lib/whatsapp';

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

    console.log('📤 Sending payment success notification for order:', order_id);

    await connectDB();
    
    console.log('🔍 Database connection established for notification');

    // Use Mongoose model instead of native MongoDB driver
    const order = await Order.findOne({ order_id });

    if (!order) {
      console.warn('⚠️ Order not found:', order_id);
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    console.log('✅ Order found for notification:', {
      orderId: order.order_id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone
    });

    // Send notification to admin
    // console.log('📤 Sending admin notification...');
    // const adminNotificationResult = await sendOrderNotification(order, 'payment');

    // Send payment confirmation to customer
    // console.log('📤 Sending customer notification...');
    // const customerNotificationResult = await sendCustomerPaymentConfirmation(order);

    console.log('📊 Notification results:', {
      admin: adminNotificationResult.success,
      customer: customerNotificationResult.success,
      adminError: adminNotificationResult.error,
      customerError: customerNotificationResult.error
    });

    if (adminNotificationResult.success && customerNotificationResult.success) {
      console.log('✅ Payment success notifications sent to both admin and customer');
      return res.status(200).json({ 
        success: true, 
        message: 'Payment notifications sent successfully to both admin and customer' 
      });
    } else {
      console.warn('⚠️ Partial notification failure:', {
        admin: adminNotificationResult.error,
        customer: customerNotificationResult.error
      });
      return res.status(200).json({ 
        success: false, 
        error: 'Some notifications failed',
        details: {
          admin: adminNotificationResult.error,
          customer: customerNotificationResult.error
        },
        message: 'Payment processed but some notifications failed'
      });
    }

  } catch (error) {
    console.error('❌ Payment notification error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}