// src/app/api/zoom/login/route.js

export async function GET(request) {
  const zoomAuthUrl = new URL('https://zoom.us/oauth/authorize');
  zoomAuthUrl.searchParams.set('response_type', 'code');
  zoomAuthUrl.searchParams.set('client_id', process.env.ZOOM_CLIENT_ID);
  zoomAuthUrl.searchParams.set('redirect_uri', process.env.ZOOM_REDIRECT_URI);

  return Response.redirect(zoomAuthUrl.toString(), 302);
}
