import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in environment variables');
  throw new Error('JWT_SECRET is required');
}

export function verifyToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      console.error('❌ No token provided for verification');
      reject(new Error('No token provided'));
      return;
    }

    console.log('🔐 Verifying token with secret length:', JWT_SECRET ? JWT_SECRET.length : 'undefined');
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('❌ JWT verification failed:', err.message);
        console.error('❌ Token that failed:', token.substring(0, 20) + '...');
        reject(new Error('Invalid token: ' + err.message));
      } else {
        console.log('✅ Token verified successfully for user:', decoded.email);
        resolve(decoded);
      }
    });
  });
}

export function generateToken(payload, expiresIn = '7d') {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  console.log('🔐 Generating token with payload:', { ...payload, password: undefined });
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function requireAuth(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      await verifyToken(token);
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Authentication required' });
    }
  };
}

export function requireAdmin(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const decoded = await verifyToken(token);
      
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Authentication required' });
    }
  };
}   