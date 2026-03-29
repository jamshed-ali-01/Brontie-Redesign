import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';

/*************  ✨ Windsurf Command ⭐  *************/
/*******  b355698e-e36e-44e9-84d7-78a13b1d9345  *******/
function getSquareOAuthUrl(): string {
    return SQUARE_ENVIRONMENT === 'sandbox'
        ? 'https://connect.squareupsandbox.com/oauth2/authorize'
        : 'https://connect.squareup.com/oauth2/authorize';
}

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('cafe-token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/cafes/login', request.url));
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        } catch (e) {
            return NextResponse.redirect(new URL('/cafes/login', request.url));
        }

        const appId = process.env.SQUARE_APP_ID;
        if (!appId) {
            return NextResponse.json({ error: 'Square App ID not configured' }, { status: 500 });
        }

        const state = nanoid();

        const scopes = [
            'ITEMS_READ',
            'INVENTORY_READ',
            'MERCHANT_PROFILE_READ',
            'ORDERS_WRITE',
            'ORDERS_READ',
            'PAYMENTS_READ',
            'PAYMENTS_WRITE'
        ];

        const url = new URL(getSquareOAuthUrl());
        url.searchParams.append('client_id', appId);
        url.searchParams.append('scope', scopes.join(' '));
        url.searchParams.append('state', state);
        url.searchParams.append('session', 'false');

        const response = NextResponse.redirect(url);

        // Store state in cookie to verify in callback
        response.cookies.set('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 300, // 5 minutes
            path: '/api/cafes/square-auth' // limit scope
        });

        return response;

    } catch (error) {
        console.error('OAuth Init Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
