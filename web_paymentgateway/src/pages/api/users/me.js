import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // For now, let's return a simple response
    // You can implement proper authentication later
    console.log('⚠️ User API called but NextAuth not configured');
    
    res.status(200).json({
      success: true,
      data: null,
      message: 'Authentication not configured'
    });

  } catch (error) {
    console.error('Error in users/me API:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}