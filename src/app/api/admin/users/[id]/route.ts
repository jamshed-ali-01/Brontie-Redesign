import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

// GET /api/admin/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated (middleware already verified JWT)
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { id } = await params;
    const user = await User.findById(id, { password: 0 });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated (middleware already verified JWT)
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    const { username, password, role, isActive } = body;
    
    // Check if username is being changed and already exists
    if (username) {
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' }, 
          { status: 409 }
        );
      }
    }
    
    const updateData: Partial<{
      username: string;
      password: string;
      role: string;
      isActive: boolean;
    }> = {};
    if (username) updateData.username = username.toLowerCase();
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Toggle user active status (disable/enable)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated (middleware already verified JWT)
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive field is required and must be boolean' }, 
        { status: 400 }
      );
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user (optional - could be used instead of disable)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated (middleware already verified JWT)
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    const { id } = await params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
