import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { phoneNumber, otp, verificationCode, invitationId } = await req.json();

    if (!phoneNumber || !otp || !verificationCode) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return jsonResponse({ error: 'Twilio credentials are not configured' }, 500);
    }

    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const appLink = `https://your-app-link.com/invite/${verificationCode}`;
    const messageBody = `Your Splitwise verification code is ${otp}.\n\nOpen the app and use code ${verificationCode} to join.\n\nIf your app supports deep links, open: ${appLink}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`;
    const payload = new URLSearchParams({
      To: formattedPhone,
      From: TWILIO_PHONE_NUMBER,
      Body: messageBody,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    const twilioBody = await twilioResponse.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(twilioBody);
    } catch {
      parsedBody = { message: twilioBody };
    }

    if (!twilioResponse.ok) {
      console.error('Twilio error response', twilioResponse.status, parsedBody);
      return jsonResponse({ error: parsedBody?.message || 'Twilio SMS send failed' }, 500);
    }

    return jsonResponse({
      success: true,
      messageId: parsedBody?.sid,
      invitationId,
      twilio: parsedBody,
    });
  } catch (error) {
    console.error('send-sms error', error);
    return jsonResponse({ error: error?.message || 'Failed to send SMS' }, 500);
  }
});
