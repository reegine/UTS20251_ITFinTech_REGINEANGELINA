export default async function handler(req, res) {
  console.log('✅ PAYMENT TEST ENDPOINT HIT:', req.method, req.url);
  
  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'Payment test endpoint is working!',
      timestamp: new Date().toISOString(),
      data: req.body
    });
  }
  
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} Not Allowed`
  });
}