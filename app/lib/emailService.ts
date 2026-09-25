import nodemailer from "nodemailer";

/**
 * Email Service using Nodemailer
 * Handles sending OTP verification emails
 */

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendOtpEmailParams {
  to: string;
  otp: string;
  name?: string;
}

export async function sendOtpEmail({ to, otp, name }: SendOtpEmailParams) {
  try {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || "AI Itinerary Planner"}" <${
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to,
      subject: "Verify Your Email - AI Itinerary Planner",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">AI Itinerary Planner</h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                          ${name ? `Hi ${name},` : "Hello!"}
                        </h2>
                        <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                          Thank you for registering with AI Itinerary Planner! To complete your registration, please verify your email address using the OTP code below:
                        </p>
                        
                        <!-- OTP Box -->
                        <table role="presentation" style="width: 100%; margin: 30px 0;">
                          <tr>
                            <td align="center" style="padding: 30px; background-color: #f8f9fa; border-radius: 8px; border: 2px dashed #667eea;">
                              <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                                ${otp}
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          This code will expire in <strong>10 minutes</strong>. If you didn't request this verification, please ignore this email.
                        </p>
                        
                        <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                          <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                            <strong>Security Tips:</strong><br>
                            • Never share your OTP with anyone<br>
                            • AI Itinerary Planner will never ask for your OTP via phone or email<br>
                            • If you suspect unauthorized access, please contact support immediately
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #999999; font-size: 12px;">
                          © ${new Date().getFullYear()} AI Itinerary Planner. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
Hi ${name || "there"},

Thank you for registering with AI Itinerary Planner!

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this verification, please ignore this email.

Best regards,
AI Itinerary Planner Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error };
  }
}

interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

export async function sendWelcomeEmail({ to, name }: SendWelcomeEmailParams) {
  try {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || "AI Itinerary Planner"}" <${
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to,
      subject: "Welcome to AI Itinerary Planner! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px;">🎉 Welcome Aboard!</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #333333;">Hi ${name}!</h2>
                        <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                          Your email has been successfully verified! You're all set to start planning amazing trips with AI Itinerary Planner.
                        </p>
                        <p style="margin: 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          <strong>What you can do:</strong>
                        </p>
                        <ul style="color: #666666; font-size: 16px; line-height: 1.8;">
                          <li>Create personalized travel itineraries</li>
                          <li>Track your budget in real-time</li>
                          <li>Discover amazing destinations</li>
                          <li>Save and share your favorite trips</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${
                            process.env.NEXTAUTH_URL || "http://localhost:3001"
                          }" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Start Planning
                          </a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #999999; font-size: 12px;">
                          © ${new Date().getFullYear()} AI Itinerary Planner. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}

// Verify transporter configuration
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log("Email server is ready to send messages");
    return true;
  } catch (error) {
    console.error("Email server verification failed:", error);
    return false;
  }
}

export interface SendTripInviteEmailParams {
  to: string;
  recipientName?: string;
  inviterName: string;
  inviterEmail?: string;
  tripId: string;
  tripTitle: string;
  destination: string;
  role?: "TRAVELER" | "EDITOR" | "VIEWER" | string;
  coverImage?: string;
  duration?: number | string;
  startDate?: string | Date;
  endDate?: string | Date;
}

/**
 * Send Trip Invitation Email via Nodemailer
 */
export async function sendTripInviteEmail({
  to,
  recipientName,
  inviterName,
  tripId,
  tripTitle,
  destination,
  role = "TRAVELER",
  coverImage,
  duration,
}: SendTripInviteEmailParams) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/itinerary/${tripId}`;

    const roleLabels: Record<string, { title: string; desc: string; color: string; bg: string }> = {
      TRAVELER: {
        title: "Traveler",
        desc: "Full edit rights on itinerary stops, schedule, budget, and bookings",
        color: "#d97706",
        bg: "#fef3c7",
      },
      EDITOR: {
        title: "Editor",
        desc: "Add & edit itinerary items, cast votes, and participate in discussions",
        color: "#2563eb",
        bg: "#dbeafe",
      },
      VIEWER: {
        title: "Viewer",
        desc: "Read-only access to view the itinerary, comment, and react",
        color: "#059669",
        bg: "#d1fae5",
      },
    };

    const roleInfo = roleLabels[role.toUpperCase()] || roleLabels.TRAVELER;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || "Wander.AI"}" <${
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to,
      subject: `✈️ ${inviterName} invited you to plan a trip to ${destination}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Trip Invitation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbf9f6; color: #1c1917;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 16px;">
                  <table role="presentation" style="max-width: 580px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #f2ede4;">
                    
                    <!-- Header Banner -->
                    <tr>
                      <td style="padding: 36px 36px 28px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);">
                        <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); padding: 8px 18px; border-radius: 9999px; margin-bottom: 14px; border: 1px solid rgba(255, 255, 255, 0.3);">
                          <span style="color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Wander.AI Multiplayer</span>
                        </div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.25;">
                          You're Invited on a Trip!
                        </h1>
                      </td>
                    </tr>

                    <!-- Trip Cover Card (if exists) -->
                    ${
                      coverImage
                        ? `<tr>
                            <td style="padding: 0; max-height: 200px; overflow: hidden;">
                              <img src="${coverImage}" alt="${destination}" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
                            </td>
                          </tr>`
                        : ""
                    }

                    <!-- Body Content -->
                    <tr>
                      <td style="padding: 36px;">
                        <p style="margin: 0 0 16px; font-size: 17px; font-weight: 600; color: #292524;">
                          ${recipientName ? `Hi ${recipientName},` : "Hello there,"}
                        </p>
                        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #57534e;">
                          <strong style="color: #1c1917;">${inviterName}</strong> has invited you to collaborate in real-time on an upcoming trip itinerary to <strong style="color: #f59e0b;">${destination}</strong>.
                        </p>

                        <!-- Trip Summary Box -->
                        <div style="background-color: #faf8f5; border: 1px solid #ebd9c3; border-radius: 18px; padding: 22px; margin-bottom: 26px;">
                          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #b45309; margin-bottom: 6px;">
                            Destination
                          </div>
                          <div style="font-size: 20px; font-weight: 800; color: #1c1917; margin-bottom: 6px;">
                            ${tripTitle || `${destination} Itinerary`}
                          </div>
                          <div style="font-size: 13px; color: #78716c; margin-bottom: 16px;">
                            📍 ${destination} ${duration ? `• ${duration} Days` : ""}
                          </div>

                          <!-- Assigned Role Badge -->
                          <div style="background-color: ${roleInfo.bg}; border-radius: 12px; padding: 12px 14px; border: 1px solid ${roleInfo.color}30;">
                            <div>
                              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${roleInfo.color}; background-color: #ffffff; padding: 3px 8px; border-radius: 6px; display: inline-block;">
                                Your Role: ${roleInfo.title}
                              </span>
                            </div>
                            <div style="font-size: 12px; color: #44403c; margin-top: 6px; line-height: 1.4;">
                              ${roleInfo.desc}
                            </div>
                          </div>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0 20px;">
                          <a href="${inviteUrl}" style="display: inline-block; padding: 15px 36px; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4); text-align: center;">
                            Accept Invitation &amp; Join Trip →
                          </a>
                        </div>

                        <p style="margin: 24px 0 0; text-align: center; font-size: 12px; color: #a8a29e; line-height: 1.5;">
                          Or copy and paste this link into your browser:<br>
                          <a href="${inviteUrl}" style="color: #f59e0b; word-break: break-all;">${inviteUrl}</a>
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 36px; text-align: center; background-color: #faf8f5; border-top: 1px solid #f2ede4;">
                        <p style="margin: 0; font-size: 12px; color: #a8a29e;">
                          © ${new Date().getFullYear()} Wander.AI • Collaborative Travel Planning &amp; Memory Journals
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
Hi ${recipientName || "there"},

${inviterName} has invited you to collaborate on a trip to ${destination}!

Trip: ${tripTitle || `${destination} Itinerary`}
Your Role: ${roleInfo.title} (${roleInfo.desc})

Join the trip and start planning together:
${inviteUrl}

Best regards,
The Wander.AI Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[sendTripInviteEmail] Invitation email sent to", to, "messageId:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[sendTripInviteEmail] Error sending invitation email:", error);
    return { success: false, error };
  }
}

