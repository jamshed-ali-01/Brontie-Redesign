import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import MessageTemplate from '@/models/MessageTemplate';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {

    //just change for auto redploy 
    // DB connect
    await connectToDatabase();

    // Sare templates fetch
    const templates = await MessageTemplate.find({})
      .sort({ displayOrder: 1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error('Error fetching message templates:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch message templates',
      },
      { status: 500 }
    );
  }
}
