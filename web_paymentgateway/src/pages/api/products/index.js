import connectDB from '../../../lib/mongodb';
import Product from '../../../models/Product';

export default async function handler(req, res) {
  console.log('Products API called:', req.method, req.query);
  
  try {
    await connectDB();
    console.log('Database connected');

    switch (req.method) {
      case 'GET':
        try {
          const { currency, search, page = 1, limit = 12 } = req.query;
          
          console.log('📋 Query parameters:', { currency, search, page, limit });
          
          let filter = { is_active: true };
          
          if (currency && currency !== 'all') {
            filter.currency = currency;
          }
          
          if (search) {
            filter.$or = [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ];
          }

          const skip = (parseInt(page) - 1) * parseInt(limit);
          
          console.log('Finding products with filter:', filter);
          
          const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
          
          const total = await Product.countDocuments(filter);

          console.log('Found products:', products.length);
          
          res.status(200).json({
            count: total,
            results: products,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: total,
              pages: Math.ceil(total / limit)
            }
          });
        } catch (error) {
          console.error('Error fetching products:', error);
          res.status(500).json({ 
            error: 'Failed to fetch products: ' + error.message 
          });
        }
        break;

      case 'POST':
        try {
          const product = await Product.create(req.body);
          res.status(201).json(product);
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      error: 'Database connection failed: ' + error.message
    });
  }
}