import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase, getMaintenanceStatus } from '@/lib/mongodb';
import Settings from '@/models/Settings';

// GET: Fetch current maintenance status
export async function GET(request: NextRequest) {
    try {
        // 1. Check authorization (simplistic check for admin-user-id cookie)
        const userId = request.cookies.get('admin-user-id')?.value;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { maintenanceMode, bypassPassword } = await getMaintenanceStatus();

        return NextResponse.json({
            maintenanceMode,
            bypassPassword: bypassPassword || ''
        });

    } catch (error) {
        console.error('Error fetching maintenance settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Update maintenance settings
export async function POST(request: NextRequest) {
    try {
        const userId = request.cookies.get('admin-user-id')?.value;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { maintenanceMode, bypassPassword } = await request.json();

        // Always connect to LIVE DB to update settings
        // We can do this by forcing Mongoose to connect to LIVE URI temporarily?
        // Or just use the model, but if maintenance is ON, 'connectToDatabase' will connect to LOCAL.
        // Logic Catch-22: If Maintenance is ON, connectToDatabase connects to LOCAL. 
        // We need to write to LIVE DB to turn it OFF.
        // SOLUTION: Use Mongoose normally, but if we need to write to Settings, we might need a direct connection or specific logic?
        // Wait, 'connectToDatabase' uses 'getMaintenanceStatus' which reads from LIVE.
        // But 'connectToDatabase' returns a connection to LIVE or LOCAL.
        // If Maintenance is ON, it returns LOCAL connection.
        // So 'Settings.findOne' would run against LOCAL DB.
        // We need to write Settings to LIVE DB always.

        // Force connection to Live DB for Settings update
        const LIVE_URI = process.env.MONGODB_URI;
        if (!LIVE_URI) throw new Error('MONGODB_URI not set');

        // Create a separate connection for Settings management to avoid interfering with global state
        const settingsConn = await mongoose.createConnection(LIVE_URI).asPromise();
        const SettingsModel = settingsConn.model('Settings', Settings.schema);

        let settings = await SettingsModel.findOne();
        if (!settings) {
            settings = new SettingsModel({});
        }

        settings.maintenanceMode = maintenanceMode;
        if (bypassPassword !== undefined) {
            settings.bypassPassword = bypassPassword;
        }

        await settings.save();
        await settingsConn.close();

        return NextResponse.json({ success: true, maintenanceMode });

    } catch (error) {
        console.error('Error updating maintenance settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
