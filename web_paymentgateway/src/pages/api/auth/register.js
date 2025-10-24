import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { name, email, password, phone, role = 'user' } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // MFA is always enabled by default
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      mfaEnabled: true // Always true
    });

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: 'User registered successfully'
    });

  } catch (error) {
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
}