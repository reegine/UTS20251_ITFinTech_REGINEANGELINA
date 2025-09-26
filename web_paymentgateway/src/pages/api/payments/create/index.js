import connectDB from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import Payment from '../../../../models/Payment';

export default async function handler(req, res) {
  console.log('💳 Payment create API called');
  
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    await connectDB();
    console.log('Database connected for payment');

    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const order = await Order.findOne({ order_id }).populate('items.product');
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Order is already ${order.status}`
      });
    }

    const xenditItems = [
      ...order.items.map(item => ({
        name: item.product_name,
        quantity: item.quantity,
        price: parseFloat(item.unit_price)
      })),
      ...(order.tax_amount > 0 ? [{ name: 'Tax (11%)', quantity: 1, price: parseFloat(order.tax_amount) }] : []),
      ...(order.delivery_fee > 0 ? [{ name: 'Delivery Fee', quantity: 1, price: parseFloat(order.delivery_fee) }] : []),
      ...(order.admin_fee > 0 ? [{ name: 'Admin Fee', quantity: 1, price: parseFloat(order.admin_fee) }] : [])
    ];

    // 🔧 FIX 1: Clean up webhook URL (remove trailing space)
    const webhookUrl = 'https://uts-20251-it-fin-tech-regineangelin.vercel.app/api/webhooks/xendit'; // ← no space!

    // 🔧 FIX 2: Clean up redirect URLs — trim whitespace and ensure no extra spaces
    const baseUrl = (process.env.NEXTAUTH_URL || 'https://uts-20251-it-fin-tech-regineangelin.vercel.app').trim();
    const successUrl = `${baseUrl}/orders?success=true`;
    const failureUrl = `${baseUrl}/orders?success=false`;

    const xenditPayload = {
      external_id: order.order_id,
      amount: parseFloat(order.total_amount),
      currency: order.currency,
      description: `Payment for order ${order.order_id}`,
      invoice_duration: 86400, // 24 hours
      customer: {
        given_names: order.customer_name.split(' ')[0] || 'Customer',
        surname: order.customer_name.split(' ').slice(1).join(' ') || 'Customer',
        email: order.customer_email,
        mobile_number: order.customer_phone || '+6281234567890'
      },
      success_redirect_url: successUrl,   // ← CLEAN
      failure_redirect_url: failureUrl,   // ← CLEAN
      items: xenditItems,
      should_send_email: false,
      // 🔧 Optional: explicitly set webhook URL if needed (though Xendit uses dashboard setting)
      // callback_url: webhookUrl 
    };

    console.log('📤 Sending to Xendit:', JSON.stringify(xenditPayload, null, 2));

    // 🔧 FIX 3: Remove trailing space in API URL
    const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify(xenditPayload),
    });

    if (!xenditResponse.ok) {
      const errorText = await xenditResponse.text();
      console.error('❌ Xendit API error:', errorText);
      
      let errorMessage = 'Xendit invoice creation failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        errorMessage = errorText;
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorText : undefined
      });
    }

    const xenditData = await xenditResponse.json();
    console.log('✅ Xendit invoice created:', xenditData.id);
    console.log('Invoice URL:', xenditData.invoice_url);

    // 🔸 You're already saving xendit_invoice_id correctly — great!
    const payment = await Payment.create({
      order: order._id,
      payment_id: xenditData.id,           // same as invoice ID
      xendit_invoice_id: xenditData.id,    // ✅ critical for webhook matching
      amount: order.total_amount,
      currency: order.currency,
      payment_method: 'invoice',
      xendit_response: xenditData,
      payment_url: xenditData.invoice_url,
      expiry_date: new Date(xenditData.expiry_date),
      status: 'pending'
    });

    await Order.findByIdAndUpdate(order._id, {
      payment_request_id: xenditData.id,
      xendit_response: xenditData
    });

    res.status(200).json({
      success: true,
      data: {
        payment_url: xenditData.invoice_url,
        invoice_id: xenditData.id,
        status: xenditData.status,
        order_id: order.order_id,
        expiry_date: xenditData.expiry_date,
        payment_id: payment._id
      }
    });

  } catch (error) {
    console.error('❌ Payment creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}