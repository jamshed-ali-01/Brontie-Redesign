import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Newspaper from '@/models/Newspaper';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        await connectToDatabase();

        const body = await request.json();

        const updatedNewspaper = await Newspaper.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedNewspaper) {
            return NextResponse.json(
                { error: 'Newspaper not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            newspaper: updatedNewspaper
        });
    } catch (error) {
        console.error('Error updating newspaper:', error);
        return NextResponse.json(
            { error: 'Failed to update newspaper' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        await connectToDatabase();

        const deletedNewspaper = await Newspaper.findByIdAndDelete(id);

        if (!deletedNewspaper) {
            return NextResponse.json(
                { error: 'Newspaper not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Newspaper deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting newspaper:', error);
        return NextResponse.json(
            { error: 'Failed to delete newspaper' },
            { status: 500 }
        );
    }
}
