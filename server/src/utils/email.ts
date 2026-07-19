import nodemailer from "nodemailer";
import config from "../config/config.js";

/**
 * Sends an invitation email to a user with their temporary login credentials.
 * Fails silently if SMTP is not fully configured.
 */
export const sendInviteEmail = async (
    to: string,
    orgName: string,
    inviteDetails: { name?: string; username?: string; password?: string }
) => {
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
        console.log(`[SMTP] Not fully configured. Skipping email invitation to ${to}`);
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_PORT === 465,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: config.SMTP_FROM,
            to,
            subject: `You've been invited to join ${orgName} on ManUp`,
            text: `Hi ${inviteDetails.name || 'there'},\n\nYou have been invited to join the organization "${orgName}" on ManUp Secure Vault.\n\nHere are your account credentials:\nUsername: ${inviteDetails.username}\nPassword: ${inviteDetails.password}\n\nPlease log in at the system address.\n\nBest regards,\nManUp Security Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                    <h2 style="color: #6366f1;">Welcome to ManUp Secure Vault</h2>
                    <p>Hi ${inviteDetails.name || 'there'},</p>
                    <p>You have been invited to join the organization <strong>${orgName}</strong> on ManUp.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h4 style="margin-top: 0;">Your Account Details:</h4>
                        <p style="margin: 5px 0;"><strong>Username:</strong> ${inviteDetails.username}</p>
                        <p style="margin: 5px 0;"><strong>Password:</strong> ${inviteDetails.password}</p>
                    </div>
                    <p>Please log in and update your password immediately upon access.</p>
                    <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">This is an automated security message. Please do not reply directly.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Successfully sent invitation email to ${to}`);
    } catch (error) {
        console.error(`[SMTP] Failed to send invitation email to ${to}:`, error);
    }
};
