import jwt from 'jsonwebtoken';

export function verifyToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error('No token provided'));
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
      if (err) {
        reject(new Error('Invalid token'));
      } else {
        resolve(decoded);
      }
    });
  });
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