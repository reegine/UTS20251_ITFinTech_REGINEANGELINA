// src/pages/api/webhooks/xendit.js
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Payment from '../../../models/Payment';
import { sendOrderNotification } from '../../../lib/whatsapp';

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

    console.log('📨 Webhook received from Xendit');
    console.log('Headers:', {
      'x-callback-token': req.headers['x-callback-token'],
      'webhook-id': req.headers['webhook-id'],
      'content-type': req.headers['content-type']
    });

    const webhookData = req.body;
    console.log('📦 Webhook body:', JSON.stringify(webhookData, null, 2));

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
      console.warn('⚠️ Unknown webhook format');
      return res.status(400).json({ error: 'Unknown webhook format' });
    }

    console.log(`🔍 Processing webhook for order: ${externalId}, status: ${status}`);

    const order = await Order.findOne({ order_id: externalId });
    if (!order) {
      console.error(`❌ Order not found: ${externalId}`);
      return res.status(200).json({ received: true, warning: 'Order not found' });
    }

    const payment = await Payment.findOne({ order: order._id }).populate('order');
    if (!payment) {
      console.error(`❌ Payment not found for order: ${externalId}`);
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
    console.log(`✅ Updated payment for order ${externalId} to status: ${paymentStatus}`);

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
      updatedAt: new Date()
    });
    
    console.log(`✅ Updated order ${externalId} to status: ${orderStatus}`);

    // Send WhatsApp notification for payment completion
    if (orderStatus === 'paid') {
      console.log(`💰 Sending payment completion notification for order: ${externalId}`);
      try {
        await sendOrderNotification(order, 'payment');
        console.log(`✅ Payment notification sent successfully for order: ${externalId}`);
      } catch (whatsappError) {
        console.warn(`⚠️ Payment WhatsApp notification failed: ${whatsappError.message}`);
        // Don't fail the webhook if WhatsApp fails
      }
    }

    res.status(200).json({ 
      received: true,
      message: 'Webhook processed successfully',
      payment_status: paymentStatus,
      order_status: orderStatus
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
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