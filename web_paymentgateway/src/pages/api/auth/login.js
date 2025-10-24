import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

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

    // Instead of logging in directly, return that MFA is required
    // MFA is now always enabled by default
    return res.status(200).json({
      success: true,
      requiresMFA: true,
      userId: user._id,
      message: 'Credentials verified. MFA required.'
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
}