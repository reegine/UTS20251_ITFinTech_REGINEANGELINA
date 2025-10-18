import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import MFACode from '../../../models/MFACode';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendMFACode } from '../../../lib/whatsapp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If MFA is enabled, send code via WhatsApp
    if (user.mfaEnabled) {
      const mfaCode = Math.random().toString().slice(2, 8); // 6-digit code
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await MFACode.create({
        user: user._id,
        code: mfaCode,
        type: 'whatsapp',
        expiresAt
      });

      // Send WhatsApp message to user's phone
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
        userId: user._id
      });
    }

    // If no MFA, generate token directly
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
      message: 'Login successful'
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
}