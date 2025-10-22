// src/lib/whatsapp.js - Using Fonnte API
export async function sendWhatsAppMessage(to, message) {
  try {
    const apiKey = process.env.FONNTE_API_KEY;
    const apiUrl = process.env.FONNTE_API_URL || 'https://api.fonnte.com/send';

    if (!apiKey) {
      console.error('❌ Fonnte API key not configured');
      return { success: false, error: 'Fonnte API key not configured' };
    }

    // ✅ Format phone number correctly (no +)
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

export async function sendOrderNotification(order, type = 'checkout') {
  try {
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;

    if (!adminNumber) {
      console.warn('⚠️ Admin WhatsApp number not configured');
      return { success: false, error: 'Admin number not configured' };
    }

    let message = '';

    if (type === 'checkout') {
      message =
        `🛒 *NEW ORDER CREATED*\n\n` +
        `*Order ID:* ${order.order_id}\n` +
        `*Customer:* ${order.customer_name}\n` +
        `*Email:* ${order.customer_email}\n` +
        `*Phone:* ${order.customer_phone || 'N/A'}\n` +
        `*Total:* ${order.currency} ${order.total_amount?.toLocaleString() || '0'}\n\n` +
        `*Items:*\n${order.items
          .map((item, index) => `${index + 1}. ${item.product_name} x${item.quantity} - ${order.currency} ${(item.unit_price * item.quantity).toLocaleString()}`)
          .join('\n')}\n\n` +
        `_Check the admin dashboard for details._`;
    } else if (type === 'payment') {
      message =
        `✅ *PAYMENT COMPLETED*\n\n` +
        `*Order ID:* ${order.order_id}\n` +
        `*Customer:* ${order.customer_name}\n` +
        `*Amount:* ${order.currency} ${order.total_amount?.toLocaleString() || '0'}\n` +
        `*Status:* Paid ✅\n\n` +
        `Thank you for your purchase! 🎉\n` +
        `_Order has been confirmed and will be processed soon._`;
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