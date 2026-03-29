import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create response and clear the cafe token cookie
    const response = NextResponse.json({ message: 'Logout successful' });
    
    response.cookies.set('cafe-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Expire immediately
    });
    
    return response;
  } catch (error) {
    console.error('Café logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
