import axios from 'axios';
import { saveToken } from '@/app/utils/tokenStorage';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return Response.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', process.env.ZOOM_REDIRECT_URI);

    const basicAuth = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await axios.post('https://zoom.us/oauth/token', params, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = tokenRes.data;

    // Save Zoom tokens
    await saveToken('zoom', data);

    return Response.json({
      message: 'Zoom Auth Success',
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error('Zoom OAuth Error:', error.response?.data || error.message);
    return Response.json(
      {
        error: 'Zoom token exchange failed',
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}

