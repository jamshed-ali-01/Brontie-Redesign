// src/app/api/cafes/square-credentials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

// Get environment from .env file
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';

// Function to get correct Square API base URL from environment
function getSquareApiBaseUrl(): string {
  return SQUARE_ENVIRONMENT === 'sandbox'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';
}

export async function GET(request: NextRequest) {
  try {
    // 1. Token سے merchant ID निकालें
    const token = request.cookies.get('cafe-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Login required' },
        { status: 401 }
      );
    }

    // 2. JWT verify करें
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { merchantId: string };

    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // 3. Database connect करें
    const mongoose = await connectToDatabase();

    // 4. Safe check for connection
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection failed');
    }

    const db = mongoose.connection.db;

    // 5. Direct collection use करें
    const credentials = await db
      .collection('squareCredentials')
      .findOne({
        merchantId: new ObjectId(merchantId),
      });

    if (!credentials) {
      return NextResponse.json({
        isConfigured: false,
        merchantId: merchantId,
        environment: SQUARE_ENVIRONMENT, // Add environment info
      });
    }

    // 6. Response भेजें
    return NextResponse.json({
      isConfigured: true,
      merchantId: merchantId,
      locationId: credentials.locationId,
      environment: credentials.environment || SQUARE_ENVIRONMENT,
      createdAt: credentials.createdAt,
      updatedAt: credentials.updatedAt,
      lastSyncAt: credentials.lastSyncAt,
      lastSyncStatus: credentials.lastSyncStatus || 'pending',
      isActive: credentials.isActive !== false,
      systemEnvironment: SQUARE_ENVIRONMENT, // Show system environment
    });

  } catch (error: any) {
    console.error('Error fetching square credentials:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch credentials',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Token से merchant ID निकालें
    const token = request.cookies.get('cafe-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Login required' },
        { status: 401 }
      );
    }

    // 2. JWT verify करें
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { merchantId: string };

    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // 3. Request data पढ़ें
    const { accessToken, locationId } = await request.json();

    // 4. Validation करें
    if (!accessToken || !locationId) {
      return NextResponse.json(
        { error: 'Access Token and Location ID are required' },
        { status: 400 }
      );
    }

    // 5. Use environment from .env file
    const squareApiBaseUrl = getSquareApiBaseUrl();
    const testApiUrl = `${squareApiBaseUrl}/v2/locations`;

    console.log(`Square Configuration Details:`, {
      environment: SQUARE_ENVIRONMENT,
      apiBaseUrl: squareApiBaseUrl,
      testUrl: testApiUrl,
      tokenPreview: `${accessToken.substring(0, 15)}...`
    });

    // 6. Square token test and fetch Merchant ID
    let squareMerchantId = '';
    try {
      console.log(`Testing Square connection and fetching Merchant ID at: ${squareApiBaseUrl}/v2/merchants/me`);

      const merchantResponse = await fetch(`${squareApiBaseUrl}/v2/merchants/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18',
        },
      });

      if (!merchantResponse.ok) {
        const errorText = await merchantResponse.text();
        console.error('Square merchant fetch failed:', errorText);
        return NextResponse.json(
          {
            error: 'Square validation failed',
            message: `Could not verify merchant profile.`,
            environment: SQUARE_ENVIRONMENT
          },
          { status: 400 }
        );
      }

      const merchantData = await merchantResponse.json();
      squareMerchantId = merchantData.merchant?.id;
      console.log(`Square validation successful. Merchant ID: ${squareMerchantId}`);

    } catch (testError) {
      console.error('Square connection failed:', testError);
      return NextResponse.json(
        {
          error: 'Cannot connect to Square',
          message: testError instanceof Error ? testError.message : 'Network error',
          environment: SQUARE_ENVIRONMENT
        },
        { status: 400 }
      );
    }

    // 7. Database connect करें
    const mongoose = await connectToDatabase();

    // 8. Safe check for connection
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection failed');
    }

    const db = mongoose.connection.db;

    // 9. Credentials save/update करें
    await db
      .collection('squareCredentials')
      .updateOne(
        { merchantId: new ObjectId(merchantId) },
        {
          $set: {
            accessToken,
            locationId,
            squareMerchantId, // Store for webhook matching
            environment: SQUARE_ENVIRONMENT,
            merchantId: new ObjectId(merchantId),
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

    return NextResponse.json({
      success: true,
      message: `Square credentials saved successfully for ${SQUARE_ENVIRONMENT} environment`,
      merchantId: merchantId,
      locationId,
      environment: SQUARE_ENVIRONMENT,
      apiBaseUrl: squareApiBaseUrl,
      note: 'Environment is controlled by .env file',
    });

  } catch (error: any) {
    console.error('Error saving square credentials:', error);
    return NextResponse.json(
      {
        error: 'Failed to save credentials',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Token से merchant ID निकालें
    const token = request.cookies.get('cafe-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Login required' },
        { status: 401 }
      );
    }

    // 2. JWT verify करें
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { merchantId: string };

    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // 3. Database connect करें
    const mongoose = await connectToDatabase();

    // 4. Safe check for connection
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection failed');
    }

    const db = mongoose.connection.db;

    // 5. Credentials delete करें
    const result = await db
      .collection('squareCredentials')
      .deleteOne({
        merchantId: new ObjectId(merchantId),
      });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          error: 'No credentials found',
          message: 'Square credentials were not configured'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Square credentials deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting square credentials:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete credentials',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Login required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { merchantId: string };

    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { accessToken, locationId, isActive } = await request.json();

    const mongoose = await connectToDatabase();

    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Database connection failed');
    }

    const db = mongoose.connection.db;

    // Get existing credentials first
    const existingCredentials = await db
      .collection('squareCredentials')
      .findOne({
        merchantId: new ObjectId(merchantId),
      });

    if (!existingCredentials) {
      return NextResponse.json(
        { error: 'No Square credentials found' },
        { status: 404 }
      );
    }

    // Get API URL from .env environment
    const squareApiBaseUrl = getSquareApiBaseUrl();
    const testApiUrl = `${squareApiBaseUrl}/v2/locations`;

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
      lastTestAt: new Date(),
      environment: SQUARE_ENVIRONMENT, // Always use environment from .env
    };

    // If updating accessToken or locationId, validate them
    if (accessToken || locationId) {
      const tokenToTest = accessToken || existingCredentials.accessToken;
      const locationToTest = locationId || existingCredentials.locationId;

      if (tokenToTest && locationToTest) {
        try {
          console.log(`Testing updated Square connection...`);

          // 1. Verify token and get Merchant ID
          const merchantResponse = await fetch(`${squareApiBaseUrl}/v2/merchants/me`, {
            headers: {
              Authorization: `Bearer ${tokenToTest}`,
              'Content-Type': 'application/json',
              'Square-Version': '2024-01-18',
            },
          });

          if (!merchantResponse.ok) {
            throw new Error('Could not verify merchant profile');
          }

          const merchantData = await merchantResponse.json();
          const squareMerchantId = merchantData.merchant?.id;
          console.log(`Square Merchant ID: ${squareMerchantId}`);

          // 2. Add to update data
          if (squareMerchantId) {
            updateData.squareMerchantId = squareMerchantId;
          }

          console.log(`Square update test successful for ${SQUARE_ENVIRONMENT} environment`);

        } catch (testError) {
          console.error('Square test failed:', testError);
          return NextResponse.json(
            {
              error: 'Cannot connect to Square',
              message: 'Check network or credentials',
              environment: SQUARE_ENVIRONMENT
            },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data (continued)
    if (accessToken) updateData.accessToken = accessToken;
    if (locationId) updateData.locationId = locationId;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update credentials
    await db
      .collection('squareCredentials')
      .updateOne(
        { merchantId: new ObjectId(merchantId) },
        {
          $set: updateData,
        }
      );

    return NextResponse.json({
      success: true,
      message: `Square credentials updated successfully for ${SQUARE_ENVIRONMENT} environment`,
      merchantId: merchantId,
      ...updateData,
      apiBaseUrl: squareApiBaseUrl,
      note: 'Environment is controlled by .env file',
    });

  } catch (error: any) {
    console.error('Error updating square credentials:', error);
    return NextResponse.json(
      {
        error: 'Failed to update credentials',
        message: error.message
      },
      { status: 500 }
    );
  }
}