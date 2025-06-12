import { getToken } from '@/app/utils/tokenStorage';

/**
 * Formats a Date object to pseudo-ISO string with offset (IST)
 */
function toLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00.000+05:30`;
}

/**
 * Fetch and format calendar events from Microsoft Graph
 * Applies +5.5 hour (IST) offset manually
 */
export async function getMicrosoftCalendarEvents() {
  const tokenData = await getToken('microsoft');
  if (!tokenData?.access_token) throw new Error('Microsoft access token not found');

  const res = await fetch('https://graph.microsoft.com/v1.0/me/events?$select=subject,start,end', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Microsoft Graph error:', data);
    throw new Error('Failed to fetch events');
  }

  const offsetMs = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes

  return data.value.map((event) => {
    const startRaw = new Date(event.start.dateTime);
    const endRaw   = new Date(event.end.dateTime);

    const start = new Date(startRaw.getTime() + offsetMs);
    const end   = new Date(endRaw.getTime() + offsetMs);

    // Inside map(event)
return {
    name: event.subject || 'No Title',
    date: start.toLocaleDateString('en-GB'), // For display
    day: start.toLocaleDateString('en-US', { weekday: 'long' }),
    startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    startISO: startRaw.toISOString(), // ← UTC again
    endISO: endRaw.toISOString()
  };
  
  });
}

