import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Payment from '../../../models/Payment';

export default async function handler(req, res) {
  console.log('🔔 Xendit Webhook received');
  
  // Set CORS headers for webhook
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CALLBACK-TOKEN');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    console.error('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Log the headers for debugging
    console.log('Webhook headers:', {
      'x-callback-token': req.headers['x-callback-token'],
      'webhook-id': req.headers['webhook-id'],
      'content-type': req.headers['content-type']
    });

    const webhookData = req.body;
    console.log('📨 Webhook body received:', JSON.stringify(webhookData, null, 2));

    let paymentId, status, paidAt, externalId;

    // Handle different webhook formats
    if (webhookData.event === 'payment.capture') {
      // Payment capture webhook (new format)
      paymentId = webhookData.data.payment_id;
      status = 'PAID'; // payment.capture means it's paid
      paidAt = webhookData.created;
      externalId = webhookData.data.reference_id;
      console.log('💰 Payment capture webhook detected');
    } else if (webhookData.id && webhookData.external_id) {
      // Invoice webhook (traditional format)
      paymentId = webhookData.id;
      status = webhookData.status;
      paidAt = webhookData.paid_at;
      externalId = webhookData.external_id;
      console.log('📄 Invoice webhook detected');
    } else {
      console.error('❌ Unknown webhook format');
      return res.status(400).json({ error: 'Unknown webhook format' });
    }

    console.log(`🔍 Looking up payment via external_id (order_id): ${externalId}`);

    // ✅ Always use external_id → order_id → payment
    const order = await Order.findOne({ order_id: externalId });
    if (!order) {
    console.error('❌ Order not found for external_id:', externalId);
    return res.status(200).json({ received: true, warning: 'Order not found' });
    }

    const payment = await Payment.findOne({ order: order._id }).populate('order');
    if (!payment) {
    console.error('❌ Payment not found for order:', externalId);
    return res.status(200).json({ received: true, warning: 'Payment not found' });
    }

    if (!payment) {
      console.error('❌ Payment not found for webhook:', { paymentId, externalId });
      // Still return 200 to prevent Xendit from retrying
      return res.status(200).json({ received: true, warning: 'Payment not found' });
    }

    // Update payment status
    payment.status = status.toLowerCase();
    payment.xendit_response = webhookData;
    
    if (paidAt) {
      payment.paid_at = new Date(paidAt);
    }

    await payment.save();
    console.log(`✅ Updated payment ${paymentId} to status: ${status}`);

    // Update associated order status
    if (payment.order) {
      let orderStatus = 'pending';
      
      if (status === 'PAID') {
        orderStatus = 'paid';
      } else if (status === 'EXPIRED') {
        orderStatus = 'expired';
      } else if (status === 'FAILED') {
        orderStatus = 'failed';
      }

      await Order.findByIdAndUpdate(payment.order._id, {
        status: orderStatus,
        updated_at: new Date()
      });
      
      console.log(`✅ Updated order ${payment.order.order_id} to status: ${orderStatus}`);
    }

    res.status(200).json({ 
      received: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Still return 200 to prevent Xendit from retrying excessively
    res.status(200).json({ 
      received: true,
      error: 'Processing failed but acknowledged'
    });
  }
}