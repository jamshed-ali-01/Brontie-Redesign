import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';

/**
 * Handle Google OAuth2 Callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/cafes/login?error=unauthorized', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/cafes/login?error=invalid_token', request.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from ID Token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Google payload missing email');
    }

    const googleEmail = payload.email.toLowerCase();

    // Connect to database
    await connectToDatabase();

    // Find existing merchant
    let merchant = await Merchant.findOne({ 
      contactEmail: googleEmail
    });

    if (!merchant) {
      // Create a nwe approved merchant for signup
      merchant = await Merchant.create({
        name: payload.name || googleEmail.split('@')[0],
        contactEmail: googleEmail,
        status: 'approved',
        signupStep: 1,
        isActive: true
      });
    }

    if (merchant.status !== 'approved') {
      // If still pending, redirect to a success/pending page
      return NextResponse.redirect(new URL('/cafes/login?error=pending_approval', request.url));
    }

    // Generate JWT token for Brontie session
    const jwtToken = jwt.sign(
      { 
        merchantId: merchant._id,
        email: merchant.contactEmail,
        name: merchant.name
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Redirect based on setup progress (Legacy check included)
    const cutoffDate = new Date('2026-03-29');
    const isLegacy = new Date(merchant.createdAt) < cutoffDate;
    const redirectUrl = (merchant.signupStep < 8 && !isLegacy) ? '/cafes/onboarding' : '/cafes/dashboard';

    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    // Set Secure HTTP-only Cookie
    response.cookies.set('cafe-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/cafes/login?error=server_error', request.url));
  }
}
