import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Newspaper from '@/models/Newspaper';

export async function GET() {
    try {
        await connectToDatabase();

        const newspapers = await Newspaper.find({ isActive: true })
            .sort({ displayOrder: 1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            newspapers
        });
    } catch (error) {
        console.error('Error fetching newspapers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch newspapers' },
            { status: 500 }
        );
    }
}
