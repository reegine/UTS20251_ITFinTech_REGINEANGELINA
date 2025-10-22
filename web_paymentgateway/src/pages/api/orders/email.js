import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    console.log('🔍 Searching orders for email:', email);

    await connectDB();

    const orders = await Order.find({ customer_email: email })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(`✅ Found ${orders.length} orders for ${email}`);

    return res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('❌ Error fetching orders by email:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders: ' + error.message 
    });
  }
}