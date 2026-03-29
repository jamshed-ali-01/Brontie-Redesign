import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message } = body;

        if (!message || message.trim() === "") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error("Missing SMTP credentials");
            return NextResponse.json(
                { error: "Email configuration missing on server" },
                { status: 500 }
            );
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const adminEmail = "farhanalisamo1234@gmail.com"; // Defaulting to support, but can be configured
        const userEmail = "hello@brontie.com";    // Let's send it to whoever manages Brontie
        // const adminEmail = "support@brontie.com"; // Defaulting to support, but can be configured
        // const userEmail = "hello@brontie.com";    // Let's send it to whoever manages Brontie

        const mailOptions = {
            from: `"Brontie Gifts" <${process.env.SMTP_USER}>`,
            to: adminEmail, // Send to themselves/admin
            subject: "New Organisation Request - Brontie Bulk Gifting",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6ca3a4; border-bottom: 2px solid #6ca3a4; padding-bottom: 10px;">New Organisation Request</h2>
          <p style="font-size: 16px; color: #333;">Someone submitted a request from the <b>Bulk Gifting</b> page ("Don't see your organisation?"):</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="font-size: 15px; color: #555; white-space: pre-wrap; font-style: italic;">"${message}"</p>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">This email was automatically generated from the Brontie platform.</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "Contact request sent" });
    } catch (error: any) {
        console.error("Error sending contact notification:", error);
        return NextResponse.json(
            { error: "Failed to send contact notification" },
            { status: 500 }
        );
    }
}
