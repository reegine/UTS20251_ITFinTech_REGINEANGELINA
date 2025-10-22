export default async function handler(req, res) {
  console.log('🔧 Debug routes endpoint called');
  
  const routes = [
    '/api/orders',
    '/api/payments/create',
    '/api/payments/status',
    '/api/products'
  ];
  
  res.status(200).json({
    success: true,
    message: 'Available API routes',
    routes: routes,
    timestamp: new Date().toISOString()
  });
}