import { put } from '@vercel/blob';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Always send email notification
    try {
      await resend.emails.send({
        from: 'Mieten oder Kaufen <onboarding@resend.dev>',
        to: 'hallo@tobiaskutscher.com',
        subject: `Neue Vormerkung: ${email}`,
        html: `
          <h2>Neue Vormerkung auf mieten-oder-kaufen.de</h2>
          <table style="border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px 16px 8px 0; font-weight: bold;">E-Mail:</td>
              <td style="padding: 8px 0;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 16px 8px 0; font-weight: bold;">Region:</td>
              <td style="padding: 8px 0;">${region || '– nicht angegeben –'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 16px 8px 0; font-weight: bold;">Newsletter:</td>
              <td style="padding: 8px 0;">${newsletter ? 'Ja' : 'Nein'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 16px 8px 0; font-weight: bold;">Zeitpunkt:</td>
              <td style="padding: 8px 0;">${new Date(lead.timestamp).toLocaleString('de-DE')}</td>
            </tr>
          </table>
        `
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue even if email fails - we'll try blob storage
    }

    // Try to save to blob storage (may fail if limit reached)
    try {
      const filename = `leads/${Date.now()}_${email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      await put(filename, JSON.stringify(lead), {
        access: 'public',
        contentType: 'application/json'
      });
    } catch (blobError) {
      console.error('Blob storage error (limit may be reached):', blobError);
      // Don't fail the request - email was sent
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing lead:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
