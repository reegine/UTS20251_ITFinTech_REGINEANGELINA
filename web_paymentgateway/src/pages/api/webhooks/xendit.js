import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Payment from '../../../models/Payment';
import { sendOrderNotification } from '../../../../lib/whatsapp';


export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CALLBACK-TOKEN');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    console.log('Webhook headers:', {
      'x-callback-token': req.headers['x-callback-token'],
      'webhook-id': req.headers['webhook-id'],
      'content-type': req.headers['content-type']
    });

    const webhookData = req.body;
    console.log('📨 Webhook body received:', JSON.stringify(webhookData, null, 2));

    let status, paidAt, externalId;

    if (webhookData.event === 'payment.capture') {
      status = 'PAID';
      paidAt = webhookData.created;
      externalId = webhookData.data.reference_id;
    } else if (webhookData.id && webhookData.external_id) {
      status = webhookData.status;
      paidAt = webhookData.paid_at;
      externalId = webhookData.external_id;
    } else {
      return res.status(400).json({ error: 'Unknown webhook format' });
    }

    console.log(`🔍 Looking up payment via external_id (order_id): ${externalId}`);

    const order = await Order.findOne({ order_id: externalId });
    if (!order) {
      return res.status(200).json({ received: true, warning: 'Order not found' });
    }

    const payment = await Payment.findOne({ order: order._id }).populate('order');
    if (!payment) {
      return res.status(200).json({ received: true, warning: 'Payment not found' });
    }

    let paymentStatus;
    switch (status) {
      case 'PAID':
        paymentStatus = 'paid';
        break;
      case 'EXPIRED':
        paymentStatus = 'expired';
        break;
      case 'FAILED':
        paymentStatus = 'failed';
        break;
      default:
        paymentStatus = 'pending';
    }

    payment.status = paymentStatus;
    payment.xendit_response = webhookData;
    
    if (paidAt) {
      payment.paid_at = new Date(paidAt);
    }

    await payment.save();
    console.log(`Updated payment for order ${externalId} to status: ${paymentStatus}`);

    let orderStatus = 'pending';
    if (status === 'PAID') {
      orderStatus = 'paid';
    } else if (status === 'EXPIRED') {
      orderStatus = 'expired';
    } else if (status === 'FAILED') {
      orderStatus = 'failed';
    }

    await Order.findByIdAndUpdate(order._id, {
      status: orderStatus,
      updated_at: new Date()
    });
    
    console.log(`Updated order ${externalId} to status: ${orderStatus}`);

    // Send WhatsApp notification for payment completion
    if (orderStatus === 'paid') {
      await sendOrderNotification(order, 'payment');
    }
    
    res.status(200).json({ 
      received: true,
      message: 'Webhook processed successfully',
      payment_status: paymentStatus,
      order_status: orderStatus
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    
    res.status(200).json({ 
      received: true,
      error: 'Processing failed but acknowledged',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}