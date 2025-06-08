// src/app/api/auth/login/route.js

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.MS_REDIRECT_URI,
    response_mode: 'query',
    scope: [
      'offline_access',
      'user.read',
      'calendars.readwrite',
    ].join(' '),
  });

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

  return Response.redirect(authUrl, 302);
}
