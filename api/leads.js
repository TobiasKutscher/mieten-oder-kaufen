import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple password protection
  const password = req.query.password || req.headers['x-admin-password'];
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // List all blobs in the leads/ folder
    const { blobs } = await list({ prefix: 'leads/' });

    if (!blobs || blobs.length === 0) {
      return res.status(200).json({ leads: [], count: 0 });
    }

    // Fetch all lead data
    const leads = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const response = await fetch(blob.url);
          const data = await response.json();
          return data;
        } catch {
          return null;
        }
      })
    );

    // Filter and sort by timestamp (newest first)
    const validLeads = leads
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({
      leads: validLeads,
      count: validLeads.length
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
