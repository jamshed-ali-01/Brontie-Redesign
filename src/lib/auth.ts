import { NextRequest } from 'next/server';
import { connectToDatabase } from './mongodb';
import User from '@/models/User';

export interface AuthUser {
  userId: string;
  username: string;
  role: string;
}

// Simple authentication check using cookie with userId
// Only use in API routes, NOT in middleware
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const userId = request.cookies.get('admin-user-id')?.value;
    
    if (!userId) {
      return null;
    }
    
    // Check if user is still active in database
    await connectToDatabase();
    const user = await User.findById(userId);
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return {
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}
