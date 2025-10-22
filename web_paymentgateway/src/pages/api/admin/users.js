import { verifyToken } from '../../../lib/auth';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
  console.log('🔧 Admin Users API called:', req.method, req.query);

  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No Bearer token provided');
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token received (first 20 chars):', token.substring(0, 20) + '...');
    
    try {
      const decoded = await verifyToken(token);
      console.log('✅ Token decoded successfully:', { email: decoded.email, role: decoded.role });
      
      // Check if user is admin
      if (decoded.role !== 'admin') {
        console.error('❌ User is not admin:', decoded.role);
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      // Connect to database using Mongoose
      await connectDB();
      console.log('✅ Database connected');

      // GET - Fetch users
      if (req.method === 'GET') {
        const { search } = req.query;
        let query = {};
        
        if (search) {
          query = {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
            ]
          };
        }

        console.log('🔍 Fetching users with query:', query);
        const users = await User.find(query)
          .select('-password') // Exclude password
          .sort({ createdAt: -1 })
          .lean();

        console.log(`✅ Found ${users.length} users`);
        return res.status(200).json({ success: true, data: users });
      }

      // POST - Create user
      if (req.method === 'POST') {
        const { name, email, password, phone, role, mfaEnabled } = req.body;
        console.log('📝 Creating user:', { name, email, role, mfaEnabled });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          console.error('❌ User already exists:', email);
          return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // Create new user
        const newUser = new User({
          name,
          email,
          password, // Remember to hash this in production!
          phone,
          role: role || 'user',
          mfaEnabled: mfaEnabled || false,
          isActive: true,
        });

        await newUser.save();
        console.log('✅ User created with ID:', newUser._id);
        
        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;
        
        return res.status(201).json({ 
          success: true, 
          message: 'User created successfully',
          data: userResponse
        });
      }

      // PUT - Update user
      if (req.method === 'PUT') {
        const { id, isActive, mfaEnabled } = req.body;
        console.log('✏️ Updating user:', { id, isActive, mfaEnabled });

        if (!id) {
          return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        const updateData = {};
        if (typeof isActive !== 'undefined') updateData.isActive = isActive;
        if (typeof mfaEnabled !== 'undefined') updateData.mfaEnabled = mfaEnabled;

        const updatedUser = await User.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true }
        ).select('-password');

        if (!updatedUser) {
          console.error('❌ User not found for update:', id);
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        console.log('✅ User updated successfully');
        return res.status(200).json({
          success: true,
          message: 'User updated successfully',
          data: updatedUser
        });
      }

      // DELETE - Delete user
      if (req.method === 'DELETE') {
        const { id } = req.query;
        console.log('🗑️ Deleting user:', id);

        if (!id) {
          return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
          console.error('❌ User not found for deletion:', id);
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        console.log('✅ User deleted successfully');
        return res.status(200).json({
          success: true,
          message: 'User deleted successfully'
        });
      }

    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError.message);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token: ' + tokenError.message 
      });
    }

  } catch (error) {
    console.error('❌ Admin users API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    });
  }
}