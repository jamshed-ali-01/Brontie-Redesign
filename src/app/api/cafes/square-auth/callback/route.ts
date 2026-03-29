import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';

function getSquareBaseUrl(): string {
    return SQUARE_ENVIRONMENT === 'sandbox'
        ? 'https://connect.squareupsandbox.com'
        : 'https://connect.squareup.com';
}

export async function GET(request: NextRequest) {
    try {
        // 1. Verify User Login
        const token = request.cookies.get('cafe-token')?.value;
        console.log("Square OAuth Callback Invoked");
        console.log("Received Request URL:", token);
        if (!token) {
            return NextResponse.redirect(new URL('/cafes/login?error=session_expired', request.url));
        }

        let merchantId: string;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
            merchantId = decoded.merchantId;
        } catch (e) {
            return NextResponse.redirect(new URL('/cafes/login?error=invalid_token', request.url));
        }

        // 2. Validate State (CSRF Protection)
        const url = new URL(request.url);
        const state = url.searchParams.get('state');
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
            return NextResponse.redirect(new URL(`/cafes/sync?error=${error}`, request.url));
        }

        const savedState = request.cookies.get('oauth_state')?.value;

        if (!state || !savedState || state !== savedState) {
            return NextResponse.redirect(new URL('/cafes/sync?error=invalid_state', request.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL('/cafes/sync?error=no_code', request.url));
        }

        // 3. Exchange Code for Access Token
        const appId = process.env.SQUARE_APP_ID;
        const appSecret = process.env.SQUARE_APP_SECRET;

        if (!appId || !appSecret) {
            return NextResponse.redirect(new URL('/cafes/sync?error=config_missing', request.url));
        }

        const tokenResponse = await fetch(`${getSquareBaseUrl()}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: appId,
                client_secret: appSecret,
                code: code,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.json();
            console.error('Square Token Exchange Error:', err);
            return NextResponse.redirect(new URL('/cafes/sync?error=token_exchange_failed', request.url));
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        const squareMerchantId = tokenData.merchant_id; // Capture the Square Merchant ID
        // refreshToken = tokenData.refresh_token; 

        // 4. Fetch Locations...
        const locationsResponse = await fetch(`${getSquareBaseUrl()}/v2/locations`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!locationsResponse.ok) {
            return NextResponse.redirect(new URL('/cafes/sync?error=locations_fetch_failed', request.url));
        }

        const locationsData = await locationsResponse.json();
        const locations = locationsData.locations || [];

        // Find first active location
        const activeLocation = locations.find((l: any) => l.status === 'ACTIVE');

        if (!activeLocation) {
            return NextResponse.redirect(new URL('/cafes/sync?error=no_active_location', request.url));
        }

        const locationId = activeLocation.id;

        // 5. Save Credentials to Database
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) throw new Error('Database connection failed');

        await db.collection('squareCredentials').updateOne(
            { merchantId: new ObjectId(merchantId) },
            {
                $set: {
                    accessToken: accessToken,
                    locationId: locationId,
                    merchantId: new ObjectId(merchantId),
                    squareMerchantId: squareMerchantId, // Store for webhook matching
                    environment: SQUARE_ENVIRONMENT,
                    updatedAt: new Date(),
                    lastSyncStatus: 'pending',
                    isActive: true,
                    lastTestAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        );

        // 6. Redirect to Success Page
        const response = NextResponse.redirect(new URL('/cafes/sync?status=connected', request.url));

        // Clear state cookie
        response.cookies.delete('oauth_state');

        return response;

    } catch (error) {
        console.error('OAuth Callback Error:', error);
        return NextResponse.redirect(new URL('/cafes/sync?error=internal_error', request.url));
    }
}
