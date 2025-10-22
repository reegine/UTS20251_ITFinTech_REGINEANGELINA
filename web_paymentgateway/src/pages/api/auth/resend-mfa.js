import connectDB from '../../../lib/mongodb';
import MFACode from '../../../models/MFACode';
import User from '../../../models/User';
import { sendMFACode } from '../../../lib/whatsapp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await MFACode.deleteMany({
      user: userId,
      used: false
    });

    const mfaCode = Math.random().toString().slice(2, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await MFACode.create({
      user: userId,
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

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to resend code: ' + error.message });
  }
}