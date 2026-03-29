import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'



export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, cafe, description } = body

  if (!name || !email || !cafe || !description) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})
  try {
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: 'hello@brontie.ie',
      subject: `New Contact Form Submission from ${cafe}`,
      html: `
        <h3>Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Cafe Name:</strong> ${cafe}</p>
        <p><strong>Description:</strong><br/>${description}</p>
      `,
    })

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Failed to send email' }, { status: 500 })
  }
}
