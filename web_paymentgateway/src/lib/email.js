import nodemailer from 'nodemailer';

// Create transporter (using Gmail as example - configure based on your email provider)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
  },
});

export const sendThankYouEmail = async (order, payment) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Your Store" <noreply@yourstore.com>',
      to: order.customer_email,
      subject: `Thank You for Your Order #${order.order_id}`,
      html: generateThankYouEmailHTML(order, payment),
      text: generateThankYouEmailText(order, payment),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Thank you email sent to ${order.customer_email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send thank you email:', error);
    return { success: false, error: error.message };
  }
};

const generateThankYouEmailHTML = (order, payment) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899, #db2777); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .thank-you { font-size: 24px; font-weight: bold; color: #059669; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Your Purchase!</h1>
          <p>Your payment has been confirmed</p>
        </div>
        <div class="content">
          <div class="thank-you">🎉 Payment Successful!</div>
          
          <p>Dear ${order.customer_name},</p>
          
          <p>Thank you for shopping with us! Your order has been confirmed and is being processed.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${order.order_id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment Date:</strong> ${new Date(payment.paid_at).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ${formatPrice(order.total_amount)}</p>
            <p><strong>Payment Method:</strong> ${payment.payment_method || 'Online Payment'}</p>
          </div>

          <div class="order-details">
            <h3>Shipping Information</h3>
            <p><strong>Recipient:</strong> ${order.customer_name}</p>
            <p><strong>Phone:</strong> ${order.customer_phone}</p>
            <p><strong>Address:</strong> ${order.shipping_address.street}, ${order.shipping_address.city}, ${order.shipping_address.state}, ${order.shipping_address.country} ${order.shipping_address.zip_code}</p>
          </div>

          <p>We'll notify you when your order ships. You can track your order status anytime in your account.</p>
          
          <p>If you have any questions, please contact our customer support.</p>
          
          <p>Best regards,<br>Your Store Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateThankYouEmailText = (order, payment) => {
  return `
Thank You for Your Purchase!

Dear ${order.customer_name},

Thank you for shopping with us! Your order has been confirmed and is being processed.

Order Details:
- Order ID: ${order.order_id}
- Order Date: ${new Date(order.createdAt).toLocaleDateString()}
- Payment Date: ${new Date(payment.paid_at).toLocaleDateString()}
- Total Amount: ${new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}
- Payment Method: ${payment.payment_method || 'Online Payment'}

Shipping Information:
- Recipient: ${order.customer_name}
- Phone: ${order.customer_phone}
- Address: ${order.shipping_address.street}, ${order.shipping_address.city}, ${order.shipping_address.state}, ${order.shipping_address.country} ${order.shipping_address.zip_code}

We'll notify you when your order ships. You can track your order status anytime in your account.

If you have any questions, please contact our customer support.

Best regards,
Your Store Team
  `;
};