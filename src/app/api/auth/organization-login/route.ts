// app/api/auth/organization-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Organization from '@/models/Organization';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectToDatabase();

    const org = await Organization.findOne({
      email: email.toLowerCase(),
      status: 'active' // change if your status key differs
    });

    if (!org) {
      return NextResponse.json({ error: 'Invalid credentials or account not active' }, { status: 401 });
    }

    // Support plain tempPassword (if you used) or hashed password
    if (!org.password) {
      if (org.password && password === org.password) {
        return NextResponse.json({ requiresPasswordChange: true, message: 'Please change your temporary password' });
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, org.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { organizationId: org._id.toString(), email: org.email, name: org.name },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    const res = NextResponse.json({
      success: true,
      organization: { id: org._id, name: org.name, email: org.email }
    });

    res.cookies.set('org-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 
    });

    return res;
  } catch (err) {
    console.error('Organization login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}