import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    // Complete authentication check (JWT + database verification)
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const users = await User.find({}, { password: 0 }) // Exclude password field
      .sort({ createdAt: -1 });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // Complete authentication check (JWT + database verification)
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const body = await request.json();
    const { username, password, role = 'admin', isActive = true } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' }, 
        { status: 400 }
      );
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' }, 
        { status: 409 }  
      );
    }
    
    const user = new User({
      username: username.toLowerCase(),
      password, // Storing plaintext as per requirements
      role,
      isActive
    });
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
