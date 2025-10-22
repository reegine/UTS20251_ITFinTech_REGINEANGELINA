export default async function handler(req, res) {
  console.log('=== WEBHOOK REQUEST ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Headers:', req.headers);

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Verification attempt:');
    console.log('Mode:', mode);
    console.log('Token received:', token);
    console.log('Challenge:', challenge);
    console.log('Expected token:', process.env.WHATSAPP_VERIFY_TOKEN);

    if (mode === 'subscribe') {
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

  if (req.method === 'POST') {
    console.log('📨 Received webhook payload:', JSON.stringify(req.body, null, 2));
    res.status(200).json({ success: true });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}