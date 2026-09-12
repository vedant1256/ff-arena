import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. Get Current Time in IST
    const now = new Date();
    // Convert UTC to IST by adding 5 hours and 30 minutes
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const currentHourIST = istTime.getUTCHours(); // getUTCHours on the adjusted date acts as local hour

    // 2. Define Active Window (14:00 PM to 05:59 AM IST)
    // This means we ping if hour is >= 14 OR if hour < 6
    const isActiveWindow = currentHourIST >= 14 || currentHourIST < 6;

    if (!isActiveWindow) {
      console.log(`[CRON] Sleeping. Current IST Hour: ${currentHourIST}`);
      return NextResponse.json({ 
        pinged: false, 
        reason: "off-peak sleep window",
        istHour: currentHourIST 
      });
    }

    // 3. Fire the Ping (Active Window)
    console.log(`[CRON] Waking up backend. Current IST Hour: ${currentHourIST}`);
    
    // Fallback URL for local testing, uses NEXT_PUBLIC_API_URL in production
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({ 
      pinged: true, 
      istHour: currentHourIST,
      backendStatus: data 
    });

  } catch (error: any) {
    console.error('[CRON ERROR]', error);
    return NextResponse.json({ 
      pinged: false, 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}
