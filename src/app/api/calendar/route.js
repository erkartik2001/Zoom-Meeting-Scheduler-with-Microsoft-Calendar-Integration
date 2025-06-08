import { getToken } from '@/app/utils/tokenStorage';

export async function GET() {
  try {
    // Get the Microsoft token
    const tokenData = await getToken('microsoft');
    if (!tokenData?.access_token) {
      return new Response(JSON.stringify({ error: 'Access token not found' }), {
        status: 401,
      });
    }

    // Fetch calendar events from Microsoft Graph
    const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events', details: data }),
        { status: 500 }
      );
    }

    // Format events: name, time, date, day
    const formatted = data.value.map((event) => {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);

      return {
        name: event.subject || 'No Title',
        startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: start.toLocaleDateString(),
        day: start.toLocaleDateString('en-US', { weekday: 'long' }),
      };
    });

    return new Response(JSON.stringify(formatted), { status: 200 });
  } catch (err) {
    console.error('Calendar fetch error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
