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

export const sendResetPasswordEmail = async (to: string, resetUrl: string) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials missing. Skipping reset password email.");
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Hey-Pixi Security" <${process.env.SMTP_USER}>`,
        to,
        subject: "🔒 Reset your Hey-Pixi password",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset your Hey-Pixi password</title>
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
                                        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Password Reset Request</p>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #111827; font-weight: 700;">Hello,</h2>
                                        <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563;">We received a request to reset the password for your Hey-Pixi account. Click the button below to choose a new password:</p>
                                        
                                        <!-- Call to Action -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="${resetUrl}" 
                                                       style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: background-color 0.3s;">
                                                        Reset Password
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">
                                            <strong>Note:</strong> This link is only valid for the next <strong>15 minutes</strong>. If you did not request this change, you can safely ignore this email; your password will remain secure and unchanged.
                                        </p>
                                        <p style="margin: 0; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                                            If the button above does not work, copy and paste this URL into your browser:<br>
                                            <a href="${resetUrl}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${resetUrl}</a>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; font-size: 13px; color: #64748b;">
                                            This is an automated security notification from <a href="https://hey-pixi.com" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Hey-Pixi</a>.
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
        console.log(`Reset password email sent to ${to}`);
    } catch (error) {
        console.error("Failed to send reset password email:", error);
        throw new Error("Failed to send email");
    }
};

export const sendUsageWarningEmail = async (to: string, usage: number, limit: number, dashboardUrl: string) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials missing. Skipping usage warning email.");
        return;
    }

    const percentage = Math.round((usage / limit) * 100);
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Hey-Pixi Usage Alerts" <${process.env.SMTP_USER}>`,
        to,
        subject: `⚠️ Action Required: Hey-Pixi Usage Limit at ${percentage}%!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Action Required: Usage Alert</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; line-height: 1.6;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Hey-Pixi</h1>
                                        <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Usage Warning Alert</p>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #111827; font-weight: 700;">Usage Limit Warning</h2>
                                        <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">You have consumed <strong>${percentage}%</strong> of your active plan's message tokens. Details:</p>
                                        
                                        <!-- Usage Status Card -->
                                        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td>
                                                        <span style="display: block; font-size: 12px; font-weight: 600; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Tokens Consumed</span>
                                                        <span style="display: block; font-size: 24px; font-weight: 800; color: #78350f;">${usage} / ${limit}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563;">To ensure your AI agents remain active, respond to customer queries, and capture leads without interruption, please subscribe to the Pro plan now.</p>
                                        
                                        <!-- Call to Action -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="${dashboardUrl}" 
                                                       style="display: inline-block; background-color: #d97706; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: background-color 0.3s;">
                                                        Upgrade Plan
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                                            If the button above does not work, copy and paste this URL into your browser:<br>
                                            <a href="${dashboardUrl}" style="color: #d97706; text-decoration: none; word-break: break-all;">${dashboardUrl}</a>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; font-size: 13px; color: #64748b;">
                                            This is an automated usage alert from <a href="https://hey-pixi.com" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Hey-Pixi</a>.
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
        console.log(`Usage warning email sent to ${to} (${percentage}%)`);
    } catch (error) {
        console.error("Failed to send usage warning email:", error);
    }
};

export const sendProjectInviteEmail = async (to: string, inviterName: string, role: string, signupUrl: string) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials missing. Skipping project invite email.");
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Hey-Pixi Team" <${process.env.SMTP_USER}>`,
        to,
        subject: `✉️ Invitation to join ${inviterName}'s team on Hey-Pixi`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Join the Team</title>
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
                                        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Workspace Invitation</p>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #111827; font-weight: 700;">Workspace Invite</h2>
                                        <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">
                                            <strong>${inviterName}</strong> has invited you to join their shared project workspace on Hey-Pixi with the role of <strong style="text-transform: capitalize;">${role}</strong>.
                                        </p>
                                        <p style="margin: 0 0 30px 0; font-size: 15px; color: #4b5563;">
                                            As a team member, you will share access to their AI agents, chat leads CRM, and active subscription plan.
                                        </p>
                                        
                                        <!-- Call to Action -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="${signupUrl}" 
                                                       style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: background-color 0.3s; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06);">
                                                        Accept Invitation & Sign Up
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 0; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                                            If the button above does not work, copy and paste this URL into your browser:<br>
                                            <a href="${signupUrl}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${signupUrl}</a>
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; font-size: 13px; color: #64748b;">
                                            This is an invitation from <a href="https://hey-pixi.com" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Hey-Pixi</a>. If you were not expecting this invite, you can safely ignore this email.
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
        console.log(`Project invitation email sent to ${to}`);
    } catch (error) {
        console.error("Failed to send project invitation email:", error);
        throw new Error("Failed to send invitation email");
    }
};
