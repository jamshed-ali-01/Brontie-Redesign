import { NextResponse } from "next/server";
import Organization from "@/models/Organization";
import { connectToDatabase } from "@/lib/mongodb";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import QRCode from "qrcode";
import nodemailer from "nodemailer";

// Email setup
const createTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  throw new Error("No email service configured. Set SMTP_USER and SMTP_PASS.");
};
const slugify = (text: string) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

const sendEmail = async ({ to, subject, html }: any) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all organizations
    const organizations = await Organization.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ data: organizations });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const form = await req.formData();

    const name = form.get("name")?.toString();
    const email = form.get("email")?.toString();
    const description = form.get("description")?.toString();
    const phone = form.get("phone")?.toString();
    const website = form.get("website")?.toString();
    const address = form.get("address")?.toString();
    const status = form.get("status")?.toString() || "active";
    const image = form.get("logo") as File | null;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and Email are required" },
        { status: 400 }
      );
    }

    let logoUrl = "";
    if (image) {
      const blob = await put(`org-logos/${image.name}`, image, {
        access: "public",
      });
      logoUrl = blob.url;
    }


    // Generate slug from organization name
    let baseSlug = slugify(name);
    let slug = baseSlug;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
      const existing = await Organization.findOne({ slug });
      if (!existing) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // link behind QR
    const qrTargetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/org/${slug}`;
    // generate QR PNG
    const qrBuffer = await QRCode.toBuffer(qrTargetLink, {
      width: 1000,
      margin: 4,
    });

    // upload QR image
    const qrBlob = await put(`org-qr/qr-${slug}.png`, qrBuffer, {
      access: "public",
    });


    // Generate & hash password
    const generatedPassword = crypto.randomBytes(5).toString("hex");
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const org = new Organization({
      name,
      email,
      description,
      phone,
      website,
      address,
      logoUrl,
      status,
      password: hashedPassword,
      slug,
      qrImageUrl: qrBlob.url,
    });

    await org.save();

    // Send email
    await sendEmail({
      to: email,
      subject: "🎉 Welcome to Your Organization Dashboard",
      html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header with Gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    Welcome to Your Organization!
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">
                    Your account has been successfully created
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hello,
                  </p>
                  
                  <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Great news! Your organization account is now active and ready to use. We've generated a temporary password to get you started.
                  </p>

                  <!-- Password Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); border: 2px solid #14b8a6; border-radius: 12px; padding: 20px; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #0f766e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Temporary Password
                        </p>
                        <p style="margin: 0; color: #0f766e; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                          ${generatedPassword}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                    <tr>
                      <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                          <strong>🔒 Security Tip:</strong> Please change this password after your first login to keep your account secure.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 10px 0;">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/organizations/login" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 10px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);">
                          Access Your Dashboard →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    If you have any questions or need assistance, feel free to reach out to our support team.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} Your Company Name. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    This email was sent to ${email}
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
    });

    return NextResponse.json(org);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
