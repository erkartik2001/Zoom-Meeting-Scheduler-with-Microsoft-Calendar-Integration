import {  getMicrosoftCalendarEvents } from '@/app/lib/calendarUtils';

export async function GET() {
  try {
    const events = await  getMicrosoftCalendarEvents();
    return new Response(JSON.stringify(events), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
