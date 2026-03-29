import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId, Db } from 'mongodb';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // 1. Token check
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    // 2. JWT verify
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { merchantId: string };

    const merchantId = decoded.merchantId;

    // 3. Database connect with type safety
    const mongoose = await connectToDatabase();
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection failed');
    }
    // @ts-ignore
    // ✅ Type assertion for TypeScript
    const db = mongoose.connection.db as Db;

    // 4. Get Square credentials
    const credentials = await db.collection('squareCredentials').findOne({
      merchantId: new ObjectId(merchantId),
    });

    if (!credentials || !credentials.accessToken || !credentials.locationId) {
      return NextResponse.json(
        { error: 'Square credentials not found. Please setup Square first.' },
        { status: 400 }
      );
    }

    const accessToken = credentials.accessToken;
    const locationId = credentials.locationId;

    // 5. Environment setup
    const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';
    const SQUARE_API_BASE = SQUARE_ENVIRONMENT === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    // 6. Webhook URL - Use Environment Variable directly
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

    if (!baseUrl) {
      console.warn('⚠️ NEXT_PUBLIC_BASE_URL is not defined in .env. Webhook creation might fail.');
    }

    let WEBHOOK_URL = `${baseUrl}/api/cafes/square-webhook-callback`;
    // let WEBHOOK_URL = `https://measures-seeks-powder-resources.trycloudflare.com/api/cafes/square-webhook-callback`;

    if (SQUARE_ENVIRONMENT === 'production') {
      // Ensure HTTPS for production (Required by Square)
      WEBHOOK_URL = WEBHOOK_URL.replace('http://', 'https://');
    }


    console.log('🔗 Calculated Webhook URL:', WEBHOOK_URL);
    console.log('🎯 Creating webhook with token authority...');

    // 7. Generate idempotency key
    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() :
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 8. Determine Token and Handle Accordingly
    const appAccessToken = process.env.SQUARE_ACCESS_TOKEN;
    const isOAuthToken = accessToken.startsWith('EAAA');
    let responseData: any = {};

    // Use Application Token if available (required for OAuth webhooks API)
    // Webhooks are App-Level, so we MUST use the App Token to create them.
    const effectiveToken = isOAuthToken ? (appAccessToken || accessToken) : accessToken;

    if (isOAuthToken && !appAccessToken) {
      console.log('❌ OAuth Token detected but SQUARE_ACCESS_TOKEN is missing in .env');
      return NextResponse.json({
        success: false,
        error: "Automated Setup Failed",
        message: "Developer Action Required: Please add 'SQUARE_ACCESS_TOKEN' (Personal Access Token) to the .env file to enable automated webhook creation."
      }, { status: 400 });
    } else {
      console.log(`📤 Calling Square API using ${isOAuthToken ? 'APPLICATION' : 'MERCHANT'} token...`);

      // 9. Prepare webhook payload
      const webhookPayload = {
        idempotency_key: idempotencyKey,
        subscription: {
          enabled: true,
          notification_url: WEBHOOK_URL,
          name: `Brontie Cafe - ${locationId.substring(0, 8)}`,
          api_version: "2025-10-16",
          event_types: [
            'catalog.version.updated',
          ]
        }
      };

      // 10. Call Square API
      const response = await fetch(`${SQUARE_API_BASE}/v2/webhooks/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2025-10-16',
        },
        body: JSON.stringify(webhookPayload),
      });

      const responseText = await response.text();
      console.log('📦 Response Status:', response.status);
      console.log('📦 Response Body:', responseText);

      if (!response.ok) {
        let errorDetails = responseText;
        let informativeError = 'Failed to create webhook on Square';

        try {
          const errorJson = JSON.parse(responseText);
          errorDetails = JSON.stringify(errorJson, null, 2);

          if (errorJson.errors?.[0]?.code === 'INSUFFICIENT_SCOPES' && isOAuthToken) {
            informativeError = "Insufficient Scopes. Please ensure the SQUARE_ACCESS_TOKEN has Webhook permissions.";
          }
        } catch (e) { }

        return NextResponse.json({
          success: false,
          error: informativeError,
          message: errorDetails, // Return full error for debugging
          status: response.status,
          details: errorDetails.substring(0, 500)
        }, { status: 400 });
      }

      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        responseData = { raw: responseText };
      }
    }

    console.log('✅ Webhook created successfully! ID:', responseData.subscription?.id);

    // 11. Save to database
    const webhookInfo = {
      merchantId: new ObjectId(merchantId),
      subscriptionId: responseData.subscription?.id,
      subscriptionName: responseData.subscription?.name,
      webhookUrl: WEBHOOK_URL,
      notificationUrl: responseData.subscription?.notification_url,
      eventTypes: responseData.subscription?.event_types || [],
      locationId: locationId,
      environment: SQUARE_ENVIRONMENT,
      apiVersion: responseData.subscription?.api_version || '2025-10-16',
      signatureKey: responseData.subscription?.signature_key,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      lastReceived: null,
      squareData: responseData.subscription
    };

    await db.collection('squareWebhooks').updateOne(
      { merchantId: new ObjectId(merchantId) },
      { $set: webhookInfo },
      { upsert: true }
    );

    console.log('💾 Webhook saved to database');

    return NextResponse.json({
      success: true,
      message: 'Webhook created successfully! ✅',
      subscriptionId: responseData.subscription?.id,
      webhookUrl: WEBHOOK_URL,
      locationId: locationId,
      eventTypes: responseData.subscription?.event_types || [],
      signatureKey: responseData.subscription?.signature_key,
      environment: SQUARE_ENVIRONMENT,
      createdAt: responseData.subscription?.created_at,
      testInstructions: 'Update any item in Square to trigger webhook'
    });

  } catch (error: any) {
    console.error('❌ Webhook setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Webhook setup failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET method - Check webhook status
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { merchantId: string };

    const merchantId = decoded.merchantId;

    const mongoose = await connectToDatabase();
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection failed');
    }
    // @ts-ignore
    const db = mongoose.connection.db as Db;

    // Get webhook info
    const webhookInfo = await db.collection('squareWebhooks').findOne({
      merchantId: new ObjectId(merchantId),
    });

    // Get Square credentials
    const credentials = await db.collection('squareCredentials').findOne({
      merchantId: new ObjectId(merchantId),
    });

    // Try to get live status from Square
    let liveStatus = null;
    const appAccessToken = process.env.SQUARE_ACCESS_TOKEN;
    const isOAuthToken = credentials?.accessToken?.startsWith('EAAA');

    // Use Merchant Token consistently
    const effectiveToken = credentials?.accessToken;

    if (effectiveToken && webhookInfo?.subscriptionId) {
      // Check if we have a token
      if (isOAuthToken && !effectiveToken) {
        console.log('🔗 OAuth Token Missing: Skipping live status fetch');
        liveStatus = { subscription: { status: 'active', is_dashboard_managed: true } };
      } else {
        try {
          const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';
          const SQUARE_API_BASE = SQUARE_ENVIRONMENT === 'sandbox'
            ? 'https://connect.squareupsandbox.com'
            : 'https://connect.squareup.com';

          const url = `${SQUARE_API_BASE}/v2/webhooks/subscriptions/${webhookInfo.subscriptionId}`;

          const squareResponse = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${effectiveToken}`,
              'Content-Type': 'application/json',
              'Square-Version': '2025-10-16',
            },
          });

          if (squareResponse.ok) {
            liveStatus = await squareResponse.json();
          } else {
            console.log(`Live status fetch failed (${squareResponse.status}) using ${isOAuthToken ? 'APP' : 'MERCHANT'} token`);
          }
        } catch (squareError) {
          console.log('Could not fetch live Square status:', squareError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      hasWebhook: !!webhookInfo,
      webhookInfo: webhookInfo || null,
      liveSquareStatus: liveStatus,
      squareCredentials: credentials ? {
        hasCredentials: true,
        locationId: credentials.locationId,
        merchantId: credentials.merchantId,
        isActive: credentials.isActive !== false,
        environment: credentials.environment || 'production',
        tokenExists: !!credentials.accessToken
      } : { hasCredentials: false },
      setupStatus: webhookInfo?.status || 'not_configured'
    });

  } catch (error: any) {
    console.error('Error fetching webhook status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhook status',
      message: error.message
    }, { status: 500 });
  }
}

// DELETE method - Remove webhook
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { merchantId: string };

    const merchantId = decoded.merchantId;

    const mongoose = await connectToDatabase();
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection failed');
    }
    // @ts-ignore
    const db = mongoose.connection.db as Db;

    // Get webhook info
    const webhookInfo = await db.collection('squareWebhooks').findOne({
      merchantId: new ObjectId(merchantId),
    });

    if (!webhookInfo?.subscriptionId) {
      return NextResponse.json({
        success: false,
        error: 'No webhook found to delete'
      }, { status: 400 });
    }

    // Get credentials for token
    const credentials = await db.collection('squareCredentials').findOne({
      merchantId: new ObjectId(merchantId),
    });

    if (!credentials?.accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Square credentials not found'
      }, { status: 400 });
    }

    // Delete from Square
    const appAccessToken = process.env.SQUARE_ACCESS_TOKEN;
    const isOAuthToken = credentials?.accessToken?.startsWith('EAAA');
    // Use Merchant Token
    const effectiveToken = credentials?.accessToken;

    if (effectiveToken && webhookInfo?.subscriptionId) {
      // Only call delete API if we have a valid token
      if (isOAuthToken && !effectiveToken) {
        console.log('🔗 OAuth Token Missing: Skipping Square API delete');
      } else {
        const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';
        const SQUARE_API_BASE = SQUARE_ENVIRONMENT === 'sandbox'
          ? 'https://connect.squareupsandbox.com'
          : 'https://connect.squareup.com';

        const deleteUrl = `${SQUARE_API_BASE}/v2/webhooks/subscriptions/${webhookInfo.subscriptionId}`;

        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${effectiveToken}`,
            'Content-Type': 'application/json',
            'Square-Version': '2025-10-16',
          },
        });

        if (!deleteResponse.ok) {
          console.log(`Delete from Square failed (${deleteResponse.status}) using ${isOAuthToken ? 'APP' : 'MERCHANT'} token`);
        } else {
          console.log('✅ Webhook deleted from Square API');
        }
      }
    }

    // Remove from database
    await db.collection('squareWebhooks').deleteOne({
      merchantId: new ObjectId(merchantId),
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
      subscriptionId: webhookInfo.subscriptionId
    });

  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete webhook',
      message: error.message
    }, { status: 500 });
  }
}