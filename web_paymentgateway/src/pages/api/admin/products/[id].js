import connectDB from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import adminAuth from '../../../../middleware/adminAuth';

async function handler(req, res) {
  console.log('🔄 Admin Products [id] API called:', {
    method: req.method,
    id: req.query.id,
    url: req.url
  });

  await connectDB();

  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        console.log('📥 GET product:', id);
        const product = await Product.findById(id);
        if (!product) {
          console.log('❌ Product not found:', id);
          return res.status(404).json({
            success: false,
            error: 'Product not found'
          });
        }
        console.log('✅ Product found:', product.name);
        return res.status(200).json({
          success: true,
          data: product
        });

      case 'PUT':
        console.log('📝 UPDATE product:', id, 'with data:', req.body);
        const { name, description, price, image_url, stock, category, is_active } = req.body;

        if (!name || !description || !price || !image_url || stock === undefined) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields'
          });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
          id,
          {
            name,
            description,
            price: parseFloat(price),
            image_url,
            stock: parseInt(stock),
            category: category || 'dessert',
            is_active: is_active !== undefined ? is_active : true
          },
          { new: true, runValidators: true }
        );

        if (!updatedProduct) {
          console.log('❌ Product not found for update:', id);
          return res.status(404).json({
            success: false,
            error: 'Product not found'
          });
        }

        console.log('✅ Product updated:', updatedProduct.name);
        return res.status(200).json({
          success: true,
          data: updatedProduct,
          message: 'Product updated successfully'
        });

      case 'DELETE':
        console.log('🗑️ DELETE product:', id);
        
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
          console.log('❌ Product not found for deletion:', id);
          return res.status(404).json({
            success: false,
            error: 'Product not found'
          });
        }

        console.log('✅ Product permanently deleted:', deletedProduct.name);
        return res.status(200).json({
          success: true,
          message: 'Product permanently deleted successfully',
          data: deletedProduct
        });

      default:
        console.log('❌ Method not allowed:', req.method);
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('❌ Admin product API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}

export default adminAuth(handler);