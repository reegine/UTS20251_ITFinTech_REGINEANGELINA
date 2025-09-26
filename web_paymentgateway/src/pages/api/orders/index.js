import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Product from '../../../models/Product';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const { email, page = 1, limit = 10 } = req.query;
      
      let query = {};
      if (email) {
        query.customer_email = email.toLowerCase();
      }

      const skip = (page - 1) * limit;
      
      const orders = await Order.find(query)
        .populate('items.product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Order.countDocuments(query);

      res.status(200).json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders'
      });
    }
  } else if (req.method === 'POST') {
    try {
        const {
        customer_email,
        customer_name,
        customer_phone,
        items,
        shipping_address,
        subtotal,
        tax_amount,
        delivery_fee,
        admin_fee,
        total_amount
        } = req.body;

        if (!customer_email || !customer_name || !items || !Array.isArray(items)) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: customer_email, customer_name, items'
        });
        }

        let calculatedSubtotal = 0;
        const orderItems = [];
        for (const item of items) {
        const product = await Product.findById(item.product_id);
        if (!product) {
            return res.status(400).json({
            success: false,
            error: `Product not found: ${item.product_id}`
            });
        }
        if (product.stock < item.quantity) {
            return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${product.name}`
            });
        }
        const itemTotal = product.price * item.quantity;
        calculatedSubtotal += itemTotal;
        orderItems.push({
            product: product._id,
            product_name: product.name,
            product_image: product.image_url,
            quantity: item.quantity,
            unit_price: product.price,
            total_price: itemTotal
        });
        }

        const order = await Order.create({
        order_id: `order-${uuidv4().slice(0, 12)}`,
        customer_email: customer_email.toLowerCase(),
        customer_name,
        customer_phone,
        shipping_address,
        items: orderItems,
        subtotal: subtotal || calculatedSubtotal,
        tax_amount: tax_amount || 0,
        delivery_fee: delivery_fee || 0,
        admin_fee: admin_fee || 0,
        total_amount: total_amount,
        currency: 'IDR',
        status: 'pending'
        });

        for (const item of items) {
        await Product.findByIdAndUpdate(
            item.product_id,
            { $inc: { stock: -item.quantity } }
        );
        }

        const populatedOrder = await Order.findById(order._id)
        .populate('items.product')
        .lean();

        res.status(201).json({
        success: true,
        data: populatedOrder
        });
    } catch (_) {
        res.status(500).json({
        success: false,
        error: 'Failed to create order: ' + error.message
        });
    }
    } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}