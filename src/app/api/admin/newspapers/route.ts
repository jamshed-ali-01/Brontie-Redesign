import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Newspaper from '@/models/Newspaper';

export async function GET() {
    try {
        await connectToDatabase();

        const newspapers = await Newspaper.find({})
            .sort({ displayOrder: 1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            newspapers
        });
    } catch (error) {
        console.error('Error fetching newspapers for admin:', error);
        return NextResponse.json(
            { error: 'Failed to fetch newspapers' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();

        const body = await request.json();
        const { title, content, imageUrl, imageWidth, imageHeight, displayOrder, isActive } = body;

        if (!title || !content || !imageUrl) {
            return NextResponse.json(
                { error: 'Title, content, and image URL are required' },
                { status: 400 }
            );
        }

        const newspaper = new Newspaper({
            title,
            content,
            imageUrl,
            imageWidth: imageWidth || 661,
            imageHeight: imageHeight || 441,
            displayOrder: displayOrder || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        await newspaper.save();

        return NextResponse.json({
            success: true,
            newspaper
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating newspaper:', error);
        return NextResponse.json(
            { error: 'Failed to create newspaper' },
            { status: 500 }
        );
    }
}
