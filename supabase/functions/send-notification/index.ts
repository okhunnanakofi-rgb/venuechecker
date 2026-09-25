import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "check_in" | "check_out";
  attendee_name: string;
  attendee_email: string;
  venue_name?: string;
  timestamp: string;
  duration_minutes?: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      attendee_name, 
      attendee_email, 
      venue_name = "VenueCheck", 
      timestamp,
      duration_minutes 
    }: NotificationRequest = await req.json();

    console.log(`Processing ${type} notification for ${attendee_name} (${attendee_email})`);

    const formattedTime = new Date(timestamp).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let subject: string;
    let html: string;

    if (type === "check_in") {
      subject = `Welcome to ${venue_name}! ✓`;
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1419; color: #e1e8ed; padding: 40px; }
              .container { max-width: 500px; margin: 0 auto; background: #1a2634; border-radius: 16px; padding: 32px; }
              .header { text-align: center; margin-bottom: 24px; }
              .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
              .logo svg { width: 30px; height: 30px; fill: #0f1419; }
              h1 { color: #10b981; margin: 0 0 8px; font-size: 24px; }
              .subtitle { color: #6b7280; font-size: 14px; }
              .info-card { background: #0f1419; border-radius: 12px; padding: 20px; margin: 24px 0; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
              .info-row:last-child { margin-bottom: 0; }
              .label { color: #6b7280; font-size: 13px; }
              .value { color: #e1e8ed; font-weight: 600; }
              .status { display: inline-block; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 24px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">
                  <svg viewBox="0 0 24 24"><path d="M15 3H9v2H7v2H5v4h2v2h2v2h2v6h2v-6h2v-2h2v-2h2V7h-2V5h-2V3z"/></svg>
                </div>
                <h1>Welcome, ${attendee_name}!</h1>
                <p class="subtitle">You've successfully checked in</p>
              </div>
              <div class="info-card">
                <div class="info-row">
                  <span class="label">Venue</span>
                  <span class="value">${venue_name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Check-in Time</span>
                  <span class="value">${formattedTime}</span>
                </div>
                <div class="info-row">
                  <span class="label">Status</span>
                  <span class="status">✓ Checked In</span>
                </div>
              </div>
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Enjoy your time! Scan your QR code again when leaving.
              </p>
              <div class="footer">
                Powered by VenueCheck Attendance System
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = `Thank you for visiting ${venue_name}!`;
      const durationText = duration_minutes 
        ? `${Math.floor(duration_minutes / 60)}h ${duration_minutes % 60}m` 
        : "N/A";
      
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1419; color: #e1e8ed; padding: 40px; }
              .container { max-width: 500px; margin: 0 auto; background: #1a2634; border-radius: 16px; padding: 32px; }
              .header { text-align: center; margin-bottom: 24px; }
              .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #f97316); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
              h1 { color: #f59e0b; margin: 0 0 8px; font-size: 24px; }
              .subtitle { color: #6b7280; font-size: 14px; }
              .info-card { background: #0f1419; border-radius: 12px; padding: 20px; margin: 24px 0; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
              .info-row:last-child { margin-bottom: 0; }
              .label { color: #6b7280; font-size: 13px; }
              .value { color: #e1e8ed; font-weight: 600; }
              .status { display: inline-block; background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
              .duration-highlight { text-align: center; background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.1)); border-radius: 12px; padding: 20px; margin: 20px 0; }
              .duration-value { font-size: 32px; font-weight: 700; color: #f59e0b; }
              .duration-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 24px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="#0f1419"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
                <h1>See you next time, ${attendee_name}!</h1>
                <p class="subtitle">Thanks for visiting</p>
              </div>
              <div class="duration-highlight">
                <div class="duration-label">Total Visit Duration</div>
                <div class="duration-value">${durationText}</div>
              </div>
              <div class="info-card">
                <div class="info-row">
                  <span class="label">Venue</span>
                  <span class="value">${venue_name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Check-out Time</span>
                  <span class="value">${formattedTime}</span>
                </div>
                <div class="info-row">
                  <span class="label">Status</span>
                  <span class="status">✓ Checked Out</span>
                </div>
              </div>
              <div class="footer">
                Powered by VenueCheck Attendance System
              </div>
            </div>
          </body>
        </html>
      `;
    }

    console.log(`Sending ${type} email to ${attendee_email}`);

    const emailResponse = await resend.emails.send({
      from: "VenueCheck <onboarding@resend.dev>",
      to: [attendee_email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
