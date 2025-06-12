import { getToken } from '@/app/utils/tokenStorage';
import axios from 'axios';
import { getMicrosoftCalendarEvents } from '@/app/lib/calendarUtils'; // adjust path as needed

function parseTime(timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return [hours, minutes];
}

function isSlotBusy(events, date, slotStart, slotEnd) {
  return events.some(event => {
      if(event.date!=date.toLocaleDateString('en-GB')){
        console.log("date strings --- ",event.date, date)
        return false;
      }
      console.log("Event timing ------ ", event.date);

    const [startHour, startMinute] = parseTime(event.startTime);
    const [endHour, endMinute] = parseTime(event.endTime);

    console.log("event details --- ", startHour,startMinute,endHour,endMinute);

    const eventStart = new Date(date);
    console.log("event start ",eventStart)
    eventStart.setHours(startHour+5, startMinute+30, 0, 0);

    const eventEnd = new Date(date);
    console.log("eventEnd",eventEnd);
    eventEnd.setHours(endHour+5, endMinute+30, 0, 0);

    console.log("Event timing ------ ",eventStart,eventEnd,event.startTime,slotStart);

    return slotStart < eventEnd && slotEnd > eventStart;
  });
}

async function createZoomMeeting(zoomAccessToken, topic, startTime, duration) {
  try {
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 2,
        start_time: startTime,
        duration,
        timezone: 'UTC',
      },
      { headers: { Authorization: `Bearer ${zoomAccessToken}` } }
    );
    return response.data;
  } catch (err) {
    console.error('Error creating Zoom meeting:', err.response?.data || err.message);
    throw new Error('Failed to create Zoom meeting');
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

    const msTokenData = await getToken('microsoft');
    const zoomTokenData = await getToken('zoom');

    if (!msTokenData?.access_token)
      return new Response(JSON.stringify({ error: 'Microsoft token not found' }), { status: 401 });
    if (!zoomTokenData?.access_token)
      return new Response(JSON.stringify({ error: 'Zoom token not found' }), { status: 401 });

    // Get events by internal call - no fetch, direct function call
    const events = await getMicrosoftCalendarEvents();
    const slotStart = new Date(startTime);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);
    let dateStr = slotStart;

    console.log("slot timing ----- out ",slotStart,slotEnd, dateStr,slotStart.toISOString());

    if (isSlotBusy(events, dateStr, slotStart, slotEnd)) {
      return new Response(
        JSON.stringify({ error: 'Requested time slot is busy in Microsoft Calendar' }),
        { status: 409 }
      );
    }

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
    console.error('POST /api/zoom/meeting error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
}
