// src/pages/api/webhooks/whatsapp.js
export default async function handler(req, res) {
  console.log('=== WEBHOOK REQUEST ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Headers:', req.headers);

  // Handle GET request for webhook verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Verification attempt:');
    console.log('Mode:', mode);
    console.log('Token received:', token);
    console.log('Challenge:', challenge);
    console.log('Expected token:', process.env.WHATSAPP_VERIFY_TOKEN);

    // Check if this is a webhook verification request
    if (mode === 'subscribe') {
      // Check the verify token
      if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ WEBHOOK VERIFIED SUCCESSFULLY');
        res.status(200).send(challenge);
      } else {
        console.log('❌ VERIFICATION FAILED - Token mismatch');
        res.status(403).json({ 
          error: 'Verification token mismatch',
          received: token,
          expected: process.env.WHATSAPP_VERIFY_TOKEN
        });
      }
    } else {
      console.log('❌ VERIFICATION FAILED - Invalid mode');
      res.status(400).json({ error: 'Invalid mode' });
    }
    return;
  }

  // Handle POST requests (incoming messages)
  if (req.method === 'POST') {
    console.log('📨 Received webhook payload:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ success: true });
    return;
  }

  // Handle other methods
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}