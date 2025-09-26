import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Payment from '../../../models/Payment';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const callbackToken = req.headers['x-callback-token'];
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;
    
    if (callbackToken !== expectedToken) {
      console.error('Invalid webhook token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body;
    const eventType = payload.event || payload.status;
    
    console.log('Webhook received:', eventType, payload);

    switch (eventType) {
      case 'invoice.paid':
      case 'PAID':
        await handlePaymentSuccess(payload);
        break;
      
      case 'invoice.expired':
      case 'EXPIRED':
        await handlePaymentExpired(payload);
        break;
      
      case 'invoice.failed':
      case 'FAILED':
        await handlePaymentFailed(payload);
        break;
      
      default:
        console.log('Unhandled webhook event:', eventType);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handlePaymentSuccess(payload) {
  try {
    const externalId = payload.external_id;
    
    await Order.findOneAndUpdate(
      { order_id: externalId },
      { 
        status: 'paid',
        payment_id: payload.id,
        xendit_response: payload,
      }
    );

    await Payment.findOneAndUpdate(
      { order_id: externalId },
      { 
        status: 'paid',
        xendit_response: payload,
      }
    );

    console.log(`Order ${externalId} marked as paid`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentExpired(payload) {
  try {
    const externalId = payload.external_id;
    
    await Order.findOneAndUpdate(
      { order_id: externalId },
      { 
        status: 'expired',
        xendit_response: payload,
      }
    );

    await Payment.findOneAndUpdate(
      { order_id: externalId },
      { 
        status: 'expired',
        xendit_response: payload,
      }
    );

    console.log(`Order ${externalId} marked as expired`);
  } catch (error) {
    console.error('Error handling payment expiry:', error);
  }
}

async function handlePaymentFailed(payload) {
  try {
    const externalId = payload.external_id;
    
    await Order.findOneAndUpdate(
      { order_id: externalId },
      { 
        status: 'failed',
        xendit_response: payload,
      }
    );

    await Payment.findOneAndUpdate(
      { order_id: externalId },
      { 
        status: 'failed',
        xendit_response: payload,
      }
    );

    console.log(`Order ${externalId} marked as failed`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}