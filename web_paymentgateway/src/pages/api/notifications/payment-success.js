import connectDB from '../../../lib/mongodb';
import { sendOrderNotification } from '../../../lib/whatsapp';

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

    // Get order details from database
    const db = await connectDB();
    
    // Add debug logging to check the database connection
    console.log('🔍 Database connection:', typeof db);
    console.log('🔍 Database collections:', db?.collection ? 'Available' : 'Not available');
    
    if (!db || !db.collection) {
      console.error('❌ Database connection failed');
      return res.status(500).json({ 
        success: false, 
        error: 'Database connection failed' 
      });
    }

    const order = await db.collection('orders').findOne({ order_id });

    if (!order) {
      console.warn('⚠️ Order not found:', order_id);
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    console.log('✅ Order found:', order.order_id);

    // Send WhatsApp notification with type 'payment'
    const notificationResult = await sendOrderNotification(order, 'payment');

    if (notificationResult.success) {
      console.log('✅ Payment success notification sent to admin');
      return res.status(200).json({ 
        success: true, 
        message: 'Payment notification sent successfully' 
      });
    } else {
      console.warn('⚠️ Failed to send payment notification:', notificationResult.error);
      return res.status(200).json({ 
        success: false, 
        error: notificationResult.error,
        message: 'Payment notification failed but order is still valid'
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