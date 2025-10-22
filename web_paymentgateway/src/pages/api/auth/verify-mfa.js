import connectDB from '../../../lib/mongodb';
import MFACode from '../../../models/MFACode';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { userId, code } = req.body;

    const mfaRecord = await MFACode.findOne({
      user: userId,
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!mfaRecord) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    await MFACode.findByIdAndUpdate(mfaRecord._id, { used: true });

    const user = await User.findById(userId);
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'MFA verification successful'
    });

  } catch (error) {
    res.status(500).json({ error: 'MFA verification failed: ' + error.message });
  }
}