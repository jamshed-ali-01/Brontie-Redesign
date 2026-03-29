import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceStatus } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            );
        }

        // Check configured password from DB
        const status = await getMaintenanceStatus();

        // Check if password matches
        if (status.bypassPassword && password === status.bypassPassword) {
            // Set bypass cookie
            const response = NextResponse.json({ success: true });

            response.cookies.set('maintenance_bypass', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
            });

            return response;
        }

        return NextResponse.json(
            { error: 'Invalid password' },
            { status: 401 }
        );

    } catch (error) {
        console.error('Error verifying bypass password:', error);
        return NextResponse.json(
            { error: 'Failed to verify password' },
            { status: 500 }
        );
    }
}
