import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (req.method === 'GET') {
      const { page = 1, limit = 20, role, search } = req.query;
      const filter = {};
      if (role) filter.role = role;
      if (search) filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
      const skip = (page - 1) * limit;
      const total = await User.countDocuments(filter);
      const users = await User.find(filter).sort({ createdAt: -1 }).skip(parseInt(skip)).limit(parseInt(limit)).select('-password -mfaSecret');
      res.status(200).json({ success: true, data: users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
      return;
    }

    if (req.method === 'POST') {
      const { name, email, password, phone, role = 'admin' } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const hashed = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashed, phone, role, isActive: true });
      const safe = newUser.toObject();
      delete safe.password;
      res.status(201).json({ success: true, data: safe });
      return;
    }

    if (req.method === 'PUT') {
      const { id, name, phone, role, isActive } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing user id' });
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (name !== undefined) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (role !== undefined) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();
      const safe = user.toObject();
      delete safe.password;
      res.status(200).json({ success: true, data: safe });
      return;
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing user id' });
      await User.findByIdAndDelete(id);
      res.status(200).json({ success: true });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('users admin error', error);
    res.status(500).json({ error: 'User admin error: ' + (error.message || error) });
  }
}
