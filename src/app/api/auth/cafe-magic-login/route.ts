import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import Merchant from '@/models/Merchant';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/cafes/login?error=invalid_token', request.url));
    }

    await connectToDatabase();

    // Find merchant by magic link token
    const merchant = await Merchant.findOne({ 
      magicLinkToken: token,
      status: 'approved'
    });

    if (!merchant) {
      return NextResponse.redirect(new URL('/cafes/login?error=invalid_token', request.url));
    }

    // Invalidate token after first use (One-time login)
    merchant.magicLinkToken = "";
    await merchant.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        merchantId: merchant._id,
        email: merchant.contactEmail,
        name: merchant.name
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Legacy Cutoff: March 29, 2026
    const cutoffDate = new Date('2026-03-29');
    const isLegacy = new Date(merchant.createdAt) < cutoffDate;

    // Set HTTP-only cookie and redirect based on setup progress (Legacy users skip onboarding)
    const redirectUrl = (merchant.signupStep < 8 && !isLegacy) ? '/cafes/onboarding' : '/cafes/dashboard';
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    
    response.cookies.set('cafe-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Magic login error:', error);
    return NextResponse.redirect(new URL('/cafes/login?error=server_error', request.url));
  }
}
