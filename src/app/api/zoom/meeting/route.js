import axios from 'axios';
import { getToken } from '@/app/utils/tokenStorage';

/**
 * Create a Zoom meeting at specified time and duration
 * @param {string} zoomAccessToken - Zoom OAuth Access Token
 * @param {string} topic - Zoom meeting topic/title
 * @param {string} startTime - ISO string start time (UTC)
 * @param {number} duration - Duration in minutes
 * @returns {Promise<Object>} Zoom meeting details
 */
async function createZoomMeeting(zoomAccessToken, topic, startTime, duration) {
  try {
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 2, // scheduled meeting
        start_time: startTime,
        duration,
        timezone: 'UTC',
      },
      {
        headers: { Authorization: `Bearer ${zoomAccessToken}` },
      }
    );
    return response.data;
  } catch (err) {
    console.error('Error creating Zoom meeting:', err.response?.data || err.message);
    throw new Error('Failed to create Zoom meeting');
  }
}

/**
 * Helper: check if a time slot overlaps any existing events
 * @param {Array} events - Array of events with startTime, endTime (strings like "12:00 PM")
 * @param {string} date - Date string like "5/28/2025"
 * @param {Date} slotStart - JS Date object start of requested slot
 * @param {Date} slotEnd - JS Date object end of requested slot
 * @returns {boolean} true if overlaps any event, else false
 */
function isSlotBusy(events, date, slotStart, slotEnd) {
  // Parse each event's start and end time on the same date as slot
  return events.some((event) => {
    if (event.date !== date) return false;

    // Convert event start/end times (e.g. "12:00 PM") to Date objects on given date
    const [startHour, startMinute] = parseTime(event.startTime);
    const [endHour, endMinute] = parseTime(event.endTime);

    const eventStart = new Date(date);
    eventStart.setHours(startHour, startMinute, 0, 0);

    const eventEnd = new Date(date);
    eventEnd.setHours(endHour, endMinute, 0, 0);

    // Check overlap: (slotStart < eventEnd) && (slotEnd > eventStart)
    return slotStart < eventEnd && slotEnd > eventStart;
  });
}

/**
 * Parse time string like "12:30 PM" into [hours24, minutes]
 */
function parseTime(timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return [hours, minutes];
}

export async function GET(req) {
  try {
    // Get Microsoft token from tokenStorage
    const msTokenData = await getToken('microsoft');
    if (!msTokenData?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Microsoft access token not found' }),
        { status: 401 }
      );
    }

    // Default 7 days window for events
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Call internal calendar API to get formatted events
    const calendarRes = await fetch(
      `${process.env.BASE_URL || ''}/api/calendar`, // Adjust BASE_URL as needed
      {
        headers: {
          // Pass no token here, your calendar API uses tokenStorage internally
        },
      }
    );

    if (!calendarRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch calendar events' }),
        { status: 500 }
      );
    }

    const events = await calendarRes.json();

    return new Response(JSON.stringify({ events }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /meeting error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { topic, startTime, duration } = await req.json();

    if (!topic || !startTime || !duration) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: topic, startTime, duration' }),
        { status: 400 }
      );
    }

    // Get tokens from storage
    const msTokenData = await getToken('microsoft');
    const zoomTokenData = await getToken('zoom');

    if (!msTokenData?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Microsoft access token not found' }),
        { status: 401 }
      );
    }
    if (!zoomTokenData?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Zoom access token not found' }),
        { status: 401 }
      );
    }

    // Calculate slot end time as Date objects
    const slotStart = new Date(startTime);
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

    // Call internal calendar API to get events (reuse your /api/calendar)
    const calendarRes = await fetch(
      `${process.env.BASE_URL || ''}/api/calendar`,
      { headers: {} }
    );

    if (!calendarRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch calendar events' }),
        { status: 500 }
      );
    }

    const events = await calendarRes.json();

    // Check if slot is busy (date string format must match event.date)
    const dateStr = slotStart.toLocaleDateString(); // e.g. "5/28/2025"

    if (isSlotBusy(events, dateStr, slotStart, slotEnd)) {
      return new Response(
        JSON.stringify({ error: 'Requested time slot is busy in Microsoft Calendar' }),
        { status: 409 }
      );
    }

    // Slot free: create Zoom meeting
    const zoomMeeting = await createZoomMeeting(
      zoomTokenData.access_token,
      topic,
      startTime,
      duration
    );

    return new Response(
      JSON.stringify({ message: 'Zoom meeting created successfully', zoomMeeting }),
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /meeting error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}
