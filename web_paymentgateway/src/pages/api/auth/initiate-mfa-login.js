import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import MFACode from '../../../models/MFACode';
import { sendMFACode } from '../../../lib/whatsapp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, userId } = req.body;

    let user;
    
    if (userId) {
      // If userId is provided, use it directly
      user = await User.findById(userId);
    } else if (email) {
      // If email is provided, find user by email
      user = await User.findOne({ email, isActive: true });
    } else {
      return res.status(400).json({ error: 'Email or User ID is required' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // MFA is always enabled now, so no need to check mfaEnabled

    const mfaCode = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    await MFACode.deleteMany({
      user: user._id,
      used: false
    });

    await MFACode.create({
      user: user._id,
      code: mfaCode,
      type: 'whatsapp',
      expiresAt
    });

    const whatsappResult = await sendMFACode(user.phone, mfaCode);
    
    if (!whatsappResult.success) {
      console.error('Failed to send WhatsApp MFA code:', whatsappResult.error);
      return res.status(500).json({ 
        error: 'Failed to send verification code. Please try again.' 
      });
    }

    return res.status(200).json({
      success: true,
      requiresMFA: true,
      message: 'Verification code sent to your WhatsApp',
      userId: user._id,
      phone: user.phone
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate MFA login: ' + error.message });
  }
}