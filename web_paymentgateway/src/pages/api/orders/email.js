import connectDB from '../../../lib/mongodb';

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

    const db = await connectDB();
    
    // Add debug logging and connection check
    console.log('🔍 Database connection state:', db ? 'Connected' : 'Not connected');
    
    if (!db || !db.collection) {
      console.error('❌ Database connection failed in orders/email');
      return res.status(500).json({ 
        success: false, 
        error: 'Database connection failed' 
      });
    }

    // Find orders by customer_email
    const orders = await db.collection('orders')
      .find({ customer_email: email })
      .sort({ createdAt: -1 }) // Most recent first
      .toArray();

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