import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceStatus } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { maintenanceMode, bypassPassword } = await getMaintenanceStatus();

        let isBypassed = false;

        if (maintenanceMode) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Basic ')) {
                const base64Credentials = authHeader.substring(6);
                const decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
                const [username, password] = decoded.split(':');

                if (bypassPassword && (password === bypassPassword || username === bypassPassword)) {
                    isBypassed = true;
                }
            }
        }

        return NextResponse.json({
            maintenanceMode,
            isBypassed
        });
    } catch (e) {
        console.error('Error in /api/maintenance/status:', e);
        return NextResponse.json({ maintenanceMode: false, isBypassed: false });
    }
}
