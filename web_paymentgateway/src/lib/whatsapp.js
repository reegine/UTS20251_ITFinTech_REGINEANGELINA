// lib/whatsapp.js
export async function sendWhatsAppMessage(to, message) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    // WhatsApp requires E.164 format WITH + prefix
    const formattedTo = to.startsWith('+') ? to : `+${to}`;

    console.log('Sending WhatsApp message to:', formattedTo);
    console.log('Using Phone Number ID:', phoneNumberId);

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedTo,
          type: 'text',
          text: { 
            preview_url: false,
            body: message 
          },
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp API error response:', data);
      return { 
        success: false, 
        error: data.error?.message || `HTTP ${response.status}`,
        details: data.error
      };
    }

    console.log('WhatsApp message sent successfully:', data);
    return { 
      success: true, 
      messageId: data.messages?.[0]?.id,
      data: data
    };
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendMFACode(phoneNumber, code) {
  try {
    // Ensure phone number has country code
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    const message = `🔐 *Verification Code*\n\n` +
                   `Your verification code is: *${code}*\n\n` +
                   `This code will expire in 10 minutes.\n` +
                   `If you didn't request this, please ignore this message.`;

    console.log(`Attempting to send MFA code to: ${formattedPhone}`);
    const result = await sendWhatsAppMessage(formattedPhone, message);
    
    if (!result.success) {
      console.error('Failed to send MFA code:', result);
    }
    
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
      console.warn('Admin WhatsApp number not configured');
      return { success: false, error: 'Admin number not configured' };
    }

    let message = '';
    
    if (type === 'checkout') {
      message = `🛒 *NEW ORDER CREATED*\n\n` +
                `*Order ID:* ${order.order_id}\n` +
                `*Customer:* ${order.customer_name}\n` +
                `*Email:* ${order.customer_email}\n` +
                `*Phone:* ${order.customer_phone || 'N/A'}\n` +
                `*Total:* ${order.currency} ${order.total_amount.toLocaleString()}\n\n` +
                `*Items:*\n${order.items.map(item => `• ${item.product_name} x${item.quantity}`).join('\n')}\n\n` +
                `_Check the admin dashboard for details_`;
    } else if (type === 'payment') {
      message = `✅ *PAYMENT COMPLETED*\n\n` +
                `*Order ID:* ${order.order_id}\n` +
                `*Customer:* ${order.customer_name}\n` +
                `*Amount:* ${order.currency} ${order.total_amount.toLocaleString()}\n` +
                `*Status:* Paid ✅\n\n` +
                `Thank you for your purchase! 🎉\n` +
                `_Order has been confirmed and will be processed soon_`;
    } else if (type === 'mfa') {
      // For MFA codes
      message = `🔐 *Verification Code*\n\n` +
                `Your verification code is: *${order.code}*\n\n` +
                `This code will expire in 10 minutes.\n` +
                `If you didn't request this, please ignore this message.`;
    }

    const result = await sendWhatsAppMessage(adminNumber, message);
    
    if (!result.success) {
      console.error('Failed to send order notification:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Order notification error:', error);
    return { success: false, error: error.message };
  }
}

// Add this function to your whatsapp.js
export async function sendMFACodeTemplate(phoneNumber, code) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    // Ensure phone number has country code
    const formattedTo = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    console.log('Sending MFA template to:', formattedTo);

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedTo,
          type: 'template',
          template: {
            name: 'mfa_verification', // You need to create this template
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: code }
                ]
              }
            ]
          }
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp Template API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `HTTP ${response.status}`,
        details: data.error
      };
    }

    console.log('WhatsApp template sent successfully:', data);
    return { 
      success: true, 
      messageId: data.messages?.[0]?.id,
      data: data
    };
  } catch (error) {
    console.error('WhatsApp template sending error:', error);
    return { success: false, error: error.message };
  }
}

export async function testWhatsAppConnection() {
  // Test with a known good number (your own)
  const testNumber = '62811678977'; // Your number
  const testCode = '123456';
  
  console.log('=== WHATSAPP CONNECTION TEST ===');
  console.log('Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
  console.log('Testing with number:', testNumber);
  
  const result = await sendMFACode(testNumber, testCode);
  
  console.log('=== TEST RESULTS ===');
  console.log('Success:', result.success);
  console.log('Error:', result.error);
  console.log('Message ID:', result.messageId);
  
  return result;
}