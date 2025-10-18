import connectDB from '../../../lib/mongodb';
import Product from '../../../models/Product';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await connectDB();

    // Verify admin access
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = await verifyToken(token);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.query;

    switch (req.method) {
      case 'PUT':
        const updatedProduct = await Product.findByIdAndUpdate(
          id,
          req.body,
          { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
          return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({
          success: true,
          data: updatedProduct,
          message: 'Product updated successfully'
        });
        break;

      case 'DELETE':
        const deletedProduct = await Product.findByIdAndUpdate(
          id,
          { is_active: false },
          { new: true }
        );
        
        if (!deletedProduct) {
          return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({
          success: true,
          message: 'Product deleted successfully'
        });
        break;

      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Operation failed: ' + error.message });
  }
}  