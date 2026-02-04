import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, region, newsletter, timestamp } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const lead = {
      email,
      region: region || '',
      newsletter: !!newsletter,
      timestamp: timestamp || new Date().toISOString()
    };

    // Create unique filename with timestamp
    const filename = `leads/${Date.now()}_${email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;

    await put(filename, JSON.stringify(lead), {
      access: 'public',
      contentType: 'application/json'
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving lead:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
