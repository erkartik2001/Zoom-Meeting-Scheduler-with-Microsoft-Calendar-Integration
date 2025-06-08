
import { saveToken } from '@/app/utils/tokenStorage';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response(JSON.stringify({ error: 'No code in request' }), {
      status: 400,
    });
  }

  const params = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID,
    scope: 'offline_access user.read calendars.readwrite',
    code,
    redirect_uri: process.env.MS_REDIRECT_URI,
    grant_type: 'authorization_code',
    client_secret: process.env.MS_CLIENT_SECRET,
  });

  try {
    const tokenRes = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = await tokenRes.json();

    if (tokenRes.ok) {
      await saveToken('microsoft', data); // Save under 'microsoft' key
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tokens', details: data }),
        { status: 400 }
      );
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Token exchange error', err }), {
      status: 500,
    });
  }
}
