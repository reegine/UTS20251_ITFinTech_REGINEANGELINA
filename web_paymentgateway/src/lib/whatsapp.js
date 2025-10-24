export async function sendWhatsAppMessage(to, message) {
  try {
    const apiKey = process.env.FONNTE_API_KEY;
    const apiUrl = process.env.FONNTE_API_URL || 'https://api.fonnte.com/send';

    if (!apiKey) {
      console.error('❌ Fonnte API key not configured');
      return { success: false, error: 'Fonnte API key not configured' };
    }

    const formattedTo = to.replace('+', '').trim();

    console.log('📤 Sending WhatsApp via Fonnte:');
    console.log('- To:', formattedTo);
    console.log('- Message length:', message.length);
    console.log('- Token preview:', apiKey.substring(0, 10) + '...');

    const formData = new FormData();
    formData.append('target', formattedTo);
    formData.append('message', message);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
      },
      body: formData,
    });

    const data = await response.json();

    console.log('📬 Fonnte response:', {
      status: response.status,
      ok: response.ok,
      data,
    });

    if (!response.ok || data.status === false) {
      console.error('❌ Fonnte API error:', data.reason || `HTTP ${response.status}`);
      return {
        success: false,
        error: data.reason || `HTTP ${response.status}`,
        details: data,
      };
    }

    console.log('✅ WhatsApp message sent successfully');
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Fonnte sending error:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}

export async function sendMFACode(phoneNumber, code) {
  try {
    const message = `🔐 *Verification Code*\n\nYour code is: *${code}*\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this message.`;

    console.log(`📩 Sending MFA code to: ${phoneNumber}`);
    const result = await sendWhatsAppMessage(phoneNumber, message);

    console.log('MFA send result:', result);
    return result;
  } catch (error) {
    console.error('MFA code sending error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendOrderNotification(order, type = 'checkout', paymentUrl = null) {
  try {
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;

    if (!adminNumber) {
      console.warn('⚠️ Admin WhatsApp number not configured');
      return { success: false, error: 'Admin number not configured' };
    }

    let message = '';

    if (type === 'checkout') {
      message =
        `🔔 *NEW ORDER RECEIVED*\n\n` +
        `*Order ID:* ${order.order_id}\n` +
        `*Customer:* ${order.customer_name}\n` +
        `*Email:* ${order.customer_email}\n` +
        `*Phone:* ${order.customer_phone || '—'}\n` +
        `*Total Amount:* ${order.currency} ${order.total_amount?.toLocaleString() || '0'}\n\n` +
        `📦 *Order Items:*\n${order.items
          .map((item, index) => `${index + 1}. ${item.product_name} × ${item.quantity} — ${order.currency} ${(item.unit_price * item.quantity).toLocaleString()}`)
          .join('\n')}\n\n`;
      
      // Add payment link if provided
      if (paymentUrl) {
        message += `🔗 *Payment Link:* ${paymentUrl}\n\n`;
      }
      
      message += `📍 *Action Required:* Please review and process this order in the admin dashboard.`;
      
    } else if (type === 'payment') {
      message =
        `✅ *PAYMENT RECEIVED – ORDER CONFIRMED*\n\n` +
        `*Order ID:* ${order.order_id}\n` +
        `*Customer:* ${order.customer_name}\n` +
        `*Amount:* ${order.currency} ${order.total_amount?.toLocaleString() || '0'}\n` +
        `*Status:* ✅ Paid\n\n` +
        `🟢 The customer has completed payment. Please proceed with order fulfillment.`;
    }

    console.log(`📩 Sending ${type} notification to admin: ${adminNumber}`);
    console.log('Message:', message);
    
    const result = await sendWhatsAppMessage(adminNumber, message);

    if (!result.success) {
      console.error(`❌ Failed to send ${type} notification:`, result.error);
    } else {
      console.log(`✅ ${type} notification sent successfully`);
    }

    return result;
  } catch (error) {
    console.error(`❌ ${type} notification error:`, error);
    return { success: false, error: error.message };
  }
}

export async function sendCustomerOrderNotification(order, paymentUrl) {
  try {
    const customerNumber = order.customer_phone;

    if (!customerNumber) {
      console.warn('⚠️ Customer WhatsApp number not available');
      return { success: false, error: 'Customer number not available' };
    }

    const message =
      `🛒 *YOUR ORDER CONFIRMATION*\n\n` +
      `Thank you for your order, ${order.customer_name}!\n\n` +
      `*Order ID:* ${order.order_id}\n` +
      `*Total Amount:* ${order.currency} ${order.total_amount?.toLocaleString() || '0'}\n\n` +
      `📦 *Your Items:*\n${order.items
        .map((item, index) => `${index + 1}. ${item.product_name} × ${item.quantity} — ${order.currency} ${(item.unit_price * item.quantity).toLocaleString()}`)
        .join('\n')}\n\n` +
      `💳 *Payment Instructions:*\n` +
      `Please complete your payment using the link below:\n` +
      `${paymentUrl}\n\n` +
      `⏰ *Important:* This payment link will expire in 24 hours.\n\n` +
      `If you have any questions, please contact our support.`;

    console.log(`📩 Sending order confirmation to customer: ${customerNumber}`);
    console.log('Customer Message:', message);
    
    const result = await sendWhatsAppMessage(customerNumber, message);

    if (!result.success) {
      console.error('❌ Failed to send customer notification:', result.error);
    } else {
      console.log('✅ Customer notification sent successfully');
    }

    return result;
  } catch (error) {
    console.error('❌ Customer notification error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendCustomerPaymentConfirmation(order) {
  try {
    const customerNumber = order.customer_phone;

    console.log('🔍 Debug customer payment confirmation:', {
      customerNumber,
      orderId: order.order_id,
      customerName: order.customer_name
    });

    if (!customerNumber) {
      console.warn('⚠️ Customer WhatsApp number not available for payment confirmation');
      return { success: false, error: 'Customer number not available' };
    }

    // Format phone number properly
    const formattedNumber = customerNumber.replace('+', '').trim();
    console.log('📞 Formatted customer number:', formattedNumber);

    const message =
      `✅ *PAYMENT CONFIRMED – ORDER PROCESSING*\n\n` +
      `Dear ${order.customer_name},\n\n` +
      `We're excited to let you know that your payment has been successfully received!\n\n` +
      `*Order Details:*\n` +
      `📦 Order ID: ${order.order_id}\n` +
      `💰 Amount Paid: ${order.currency} ${order.total_amount?.toLocaleString() || '0'}\n` +
      `📅 Payment Date: ${new Date().toLocaleDateString('en-ID')}\n\n` +
      `📦 *Your Items:*\n${order.items
        .map((item, index) => `${index + 1}. ${item.product_name} × ${item.quantity}`)
        .join('\n')}\n\n` +
      `🔄 *What's Next?*\n` +
      `We are now preparing your order for shipment. You will receive another update when your order is on its way.\n\n` +
      `📞 *Need Help?*\n` +
      `If you have any questions, please contact our customer support.\n\n` +
      `Thank you for shopping with us! 🎉`;

    console.log(`📩 Sending payment confirmation to customer: ${formattedNumber}`);
    console.log('Customer Payment Message:', message);
    
    const result = await sendWhatsAppMessage(formattedNumber, message);

    if (!result.success) {
      console.error('❌ Failed to send customer payment confirmation:', result.error);
      console.error('❌ Full error details:', result);
    } else {
      console.log('✅ Customer payment confirmation sent successfully');
      console.log('✅ Full success details:', result);
    }

    return result;
  } catch (error) {
    console.error('❌ Customer payment confirmation error:', error);
    console.error('❌ Error stack:', error.stack);
    return { success: false, error: error.message };
  }
}