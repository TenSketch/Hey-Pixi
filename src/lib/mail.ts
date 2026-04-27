import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendLeadNotification = async (to: string, lead: { name: string; email?: string; phone?: string; botName: string }) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials missing. Skipping email notification.");
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Hey-Pixi Alerts" <${process.env.SMTP_USER}>`,
        to,
        subject: `🚀 New Lead Captured for ${lead.botName}!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Lead Captured</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; line-height: 1.6;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Hey-Pixi</h1>
                                        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">New Lead Notification</p>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #111827; font-weight: 700;">Great news! 🎉</h2>
                                        <p style="margin: 0 0 30px 0; font-size: 16px; color: #4b5563;">Your AI Agent <strong>${lead.botName}</strong> has just captured a new high-intent lead. Here are the details:</p>
                                        
                                        <!-- Lead Details Card -->
                                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 35px;">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td style="padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
                                                        <span style="display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Full Name</span>
                                                        <span style="display: block; font-size: 18px; font-weight: 600; color: #0f172a;">${lead.name}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 15px 0; border-bottom: 1px solid #e2e8f0;">
                                                        <span style="display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Email Address</span>
                                                        <span style="display: block; font-size: 16px; font-weight: 500; color: #3b82f6;"><a href="mailto:${lead.email}" style="color: #3b82f6; text-decoration: none;">${lead.email || "Not provided"}</a></span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-top: 15px;">
                                                        <span style="display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Phone Number</span>
                                                        <span style="display: block; font-size: 16px; font-weight: 500; color: #0f172a;">${lead.phone || "Not provided"}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <!-- Call to Action -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center">
                                                    <a href="${process.env.NEXTAUTH_URL || 'https://hey-pixi.com'}/dashboard/leads" 
                                                       style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: background-color 0.3s;">
                                                        View Lead in Dashboard
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; font-size: 13px; color: #64748b;">
                                            This is an automated notification from <a href="https://hey-pixi.com" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Hey-Pixi</a>.<br>
                                            You can disable these alerts anytime in your agent settings.
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

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Notification email sent to ${to}`);
    } catch (error) {
        console.error("Failed to send notification email:", error);
    }
};
