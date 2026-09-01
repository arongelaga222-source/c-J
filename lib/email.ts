import QRCode from 'qrcode';
import { Resend } from 'resend';

export interface BookingEmailDetails {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  courtName: string;
  dateStr: string;
  timeRange: string;
  durationHours: number;
  totalPrice: number;
  paymentMethod: string;
  checkInUrl?: string;
}

export async function generateBookingQRCodeDataUrl(bookingId: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(
      JSON.stringify({
        bookingId,
        system: 'C&J Court',
        timestamp: new Date().toISOString(),
      }),
      {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }
    );
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

export function generateBookingEmailHtml(details: BookingEmailDetails, qrDataUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>C&J Court Reservation Confirmation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f1117;
      color: #f1f5f9;
      margin: 0;
      padding: 24px 12px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #181b22;
      border: 1px solid #2d3342;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 14px;
      font-weight: 600;
      opacity: 0.95;
    }
    .content {
      padding: 28px 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #f59e0b;
      font-size: 12px;
      font-weight: 800;
      border-radius: 999px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .card {
      background: #101217;
      border: 1px solid #232733;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #1e2330;
      font-size: 14px;
    }
    .row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .label {
      color: #94a3b8;
      font-weight: 500;
    }
    .value {
      color: #ffffff;
      font-weight: 700;
      text-align: right;
    }
    .highlight-price {
      color: #fbbf24;
      font-size: 18px;
      font-weight: 900;
    }
    .qr-section {
      text-align: center;
      background: #101217;
      border: 1px solid #232733;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .qr-img {
      border-radius: 12px;
      border: 4px solid #ffffff;
      margin: 12px 0;
      max-width: 180px;
    }
    .footer {
      text-align: center;
      padding: 20px 24px;
      border-top: 1px solid #232733;
      font-size: 12px;
      color: #64748b;
    }
    .policy {
      background: rgba(220, 38, 38, 0.1);
      border-left: 3px solid #ef4444;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      color: #fca5a5;
      margin-bottom: 24px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>C&J Court</h1>
      <p>Premier Pickleball Booking & Facility</p>
    </div>
    
    <div class="content">
      <div class="badge">Booking Confirmed • Paid</div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #ffffff;">See you on the court, ${details.customerName}!</h2>
      <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Your tournament-grade court reservation at C&J Court has been locked and confirmed. Present your ticket QR code at the counter check-in desk upon arrival.
      </p>

      <div class="card">
        <div class="row">
          <span class="label">Reference Number</span>
          <span class="value" style="font-family: monospace; color: #fbbf24;">#${details.bookingId.slice(0, 8).toUpperCase()}</span>
        </div>
        <div class="row">
          <span class="label">Reserved Court</span>
          <span class="value">${details.courtName}</span>
        </div>
        <div class="row">
          <span class="label">Playing Date</span>
          <span class="value">${details.dateStr}</span>
        </div>
        <div class="row">
          <span class="label">Time Interval</span>
          <span class="value">${details.timeRange}</span>
        </div>
        <div class="row">
          <span class="label">Duration</span>
          <span class="value">${details.durationHours} Hour${details.durationHours > 1 ? 's' : ''}</span>
        </div>
        <div class="row">
          <span class="label">Total Paid</span>
          <span class="value highlight-price">₱${details.totalPrice.toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Payment Channel</span>
          <span class="value" style="text-transform: capitalize;">${details.paymentMethod}</span>
        </div>
      </div>

      ${
        qrDataUrl
          ? `
      <div class="qr-section">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #f59e0b; text-transform: uppercase;">Fast Check-in Ticket</p>
        <img src="${qrDataUrl}" alt="Check-in QR Code" class="qr-img" />
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Show this QR code at C&J Court reception desk</p>
      </div>`
          : ''
      }

      <div class="policy">
        <strong>Strict 24-Hour Cancellation Policy:</strong> Cancellations must be requested at least 24 hours prior to session start time to be eligible for a refund.
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0;">C&J Court • Tomas Morato, Quezon City</p>
      <p style="margin: 4px 0 0 0;">Operating Daily: 6:00 AM – 10:00 PM • Inquiries: +63 (917) 555-CJCOURT</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendBookingConfirmationEmail(
  details: BookingEmailDetails
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  const qrDataUrl = await generateBookingQRCodeDataUrl(details.bookingId);
  const emailHtml = generateBookingEmailHtml(details, qrDataUrl);

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_resend_api_key')) {
    console.log(
      `[Email Service (Mock Sandbox)] Booking confirmation for ${details.customerEmail} (#${details.bookingId.slice(0, 8)}) logged successfully.`
    );
    return { success: true, messageId: `mock_email_${Date.now()}` };
  }

  try {
    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'C&J Court <bookings@cjcourt.com>';

    const response = await resend.emails.send({
      from: fromEmail,
      to: [details.customerEmail],
      subject: `Court Reservation Confirmed (#${details.bookingId.slice(0, 8).toUpperCase()}) - C&J Court`,
      html: emailHtml,
    });

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[Resend Email Error]:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
