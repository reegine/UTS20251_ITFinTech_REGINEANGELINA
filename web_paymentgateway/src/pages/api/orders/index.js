// src/pages/api/orders/index.js
import connectDB from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Product from '../../../models/Product';

export default async function handler(req, res) {
  console.log('📦 Orders API called:', req.method, req.url);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Only POST requests are accepted.' 
    });
  }

  try {
    await connectDB();
    console.log('✅ Database connected for orders');

    const orderData = req.body;
    console.log('📝 Order data received');

    // Generate a truly unique order ID with better randomness
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15); // More characters for better uniqueness
    const order_id = `order-${timestamp}-${random}`;
    
    console.log('🆕 Generated order ID:', order_id);

    // Validate that items exist
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order must contain at least one item'
      });
    }

    // Fetch product details for the items
    const productIds = orderData.items.map(item => item.product_id);
    const products = await Product.find({ 
      _id: { $in: productIds },
      is_active: true 
    });

    if (products.length !== orderData.items.length) {
      return res.status(400).json({
        success: false,
        error: 'Some products are not available or not found'
      });
    }

    // Create items with product details
    const orderItems = orderData.items.map(item => {
      const product = products.find(p => p._id.toString() === item.product_id);
      return {
        product: item.product_id,
        product_name: product.name,
        product_image: product.image_url,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: product.price * item.quantity
      };
    });

    // Calculate totals if not provided
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax_amount = orderData.tax_amount || Math.round(subtotal * 0.11);
    const delivery_fee = orderData.delivery_fee || 15000;
    const admin_fee = orderData.admin_fee || 5000;
    const total_amount = subtotal + tax_amount + delivery_fee + admin_fee;

    // Check if order with this ID already exists (just in case)
    const existingOrder = await Order.findOne({ order_id });
    if (existingOrder) {
      console.warn('⚠️ Order ID collision detected:', order_id);
      // Regenerate order ID
      const newRandom = Math.random().toString(36).substring(2, 15);
      order_id = `order-${timestamp}-${newRandom}`;
      console.log('🔄 Regenerated order ID:', order_id);
    }

    // Create order
    const order = await Order.create({
      order_id,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone,
      shipping_address: orderData.shipping_address,
      items: orderItems,
      subtotal,
      tax_amount,
      delivery_fee,
      admin_fee,
      total_amount,
      currency: 'IDR',
      status: 'pending'
    });

    console.log('✅ Order created successfully:', order.order_id);

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('❌ Order creation error:', error);
    
    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Order ID collision occurred. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create order: ' + error.message
    });
  }
}