# Zoom Meeting Scheduler with Microsoft Calendar Integration

This project allows users to schedule Zoom meetings only during available time slots by checking the user's Microsoft Outlook Calendar. It ensures that no meetings are booked during conflicting calendar events.

## Features

- Fetch events from Microsoft Calendar using Microsoft Graph API
- Check for time slot availability using conflict detection
- Schedule Zoom meetings in free time slots only
- Internal token management for Zoom and Microsoft
- Internal function call for calendar access (no HTTP fetch)

## Project Structure

/src
/app
/api
/calendar
route.js // Microsoft calendar event handler
/zoom
/meeting
route.js // Zoom meeting booking logic
/utils
tokenStorage.js // Helper to fetch stored tokens


## Tech Stack

- Next.js (App Router)
- Node.js
- Axios
- Zoom API (OAuth2)
- Microsoft Graph API (OAuth2)
- Environment variables for config

## Flow

1. User sends a POST request to `/api/zoom/meeting` with:
   - topic
   - startTime (ISO string)
   - duration (in minutes)

2. The API:
   - Retrieves Zoom and Microsoft tokens via internal utility
   - Calls `getCalendarEvents()` to get Outlook events
   - Checks if requested slot overlaps existing events
   - If available, creates Zoom meeting
   - Returns meeting data or conflict response

## How to Run

### 1. Install dependencies

npm install

### 2. Configure environment

Create a `.env.local` file in project root with:

ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
REDIRECT_URI=http://localhost:3000/api/auth/callback
BASE_URL=http://localhost:3000


Ensure that token storage is already populated with Zoom and Microsoft access tokens via `getToken('zoom')` and `getToken('microsoft')`.

### 3. Start the development server

npm run dev

The server will run at:  
http://localhost:3000

## API Endpoints

### GET /api/calendar

Returns formatted calendar events from Microsoft account.

Example:
curl http://localhost:3000/api/calendar

### POST /api/zoom/meeting

Schedules a Zoom meeting if the requested time slot is free.

Payload:
POST http://localhost:3000/api/zoom/meeting
Content-Type: application/json

{
"topic": "Client Call",
"startTime": "2025-06-10T10:00:00Z",
"duration": 45
}


If successful, returns Zoom meeting details.  
If slot is busy, returns HTTP 409 with message:
{
"error": "Requested time slot is busy in Microsoft Calendar"
}


## To Do

- Add frontend form to interact with meeting scheduler
- Add UI for token authentication flow
- Improve error reporting and logging
- Add database-backed token storage