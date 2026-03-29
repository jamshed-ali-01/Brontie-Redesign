import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' }, 
        { status: 400 }
      );
    }
    
    // Find user by username
    const user = await User.findOne({ 
      username: username.toLowerCase(),
      isActive: true 
    });
    
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' }, 
        { status: 401 }
      );
    }
    
    // Create response and set simple cookie with userId
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
    
    response.cookies.set('admin-user-id', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
