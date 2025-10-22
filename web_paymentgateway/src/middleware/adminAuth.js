import jwt from 'jsonwebtoken';

export default function adminAuth(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      req.user = decoded;
      
      return handler(req, res);
    } catch (error) {
      console.error('Admin auth error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  };
}