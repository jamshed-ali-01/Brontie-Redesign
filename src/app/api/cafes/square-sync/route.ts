import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Get environment from .env file
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';

// Function to get correct Square API base URL
function getSquareApiBaseUrl(): string {
  return SQUARE_ENVIRONMENT === 'sandbox'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';
}

async function fetchAllSquareItems(accessToken: string, locationId: string) {
  const squareApiBaseUrl = getSquareApiBaseUrl();
  let allItems: any[] = [];
  let cursor: string | null = null;
  let hasMore = true;
  let pageNumber = 1;

  console.log('Starting to fetch all items from Square with pagination...');
  console.log(`Environment: ${SQUARE_ENVIRONMENT}`);
  console.log(`API Base URL: ${squareApiBaseUrl}`);

  while (hasMore) {
    let apiUrl = `${squareApiBaseUrl}/v2/catalog/list?types=ITEM`;

    // Add cursor only if it exists
    if (cursor) {
      apiUrl += `&cursor=${cursor}`;
    }

    try {
      console.log(`\n=== Fetching Page ${pageNumber} ===`);
      console.log(`API URL: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Square API Error: ${response.status} - ${response.statusText}`);
        console.error(`Error Details: ${errorText.substring(0, 500)}`);
        throw new Error(`Square API error: ${response.status} - ${response.statusText}: ${errorText.substring(0, 500)}`);
      }

      const data = await response.json();

      console.log(`\nPage ${pageNumber} Response Summary:`);
      console.log(`Total objects in response: ${data.objects?.length || 0}`);
      console.log(`Has cursor: ${!!data.cursor}`);

      if (data.objects && data.objects.length > 0) {
        console.log(`\nItems in Page ${pageNumber}:`);

        data.objects.forEach((item: any, index: number) => {
          if (item.type === 'ITEM') {
            console.log(`${index + 1}. ITEM ID: ${item.id}`);
            console.log(`   Name: ${item.item_data?.name || 'No Name'}`);
            console.log(`   Description: ${item.item_data?.description?.substring(0, 100) || 'No Description'}`);
            console.log(`   Variations: ${item.item_data?.variations?.length || 0} variations`);

            // Log each variation
            if (item.item_data?.variations) {
              item.item_data.variations.forEach((variation: any, varIndex: number) => {
                console.log(`   Variation ${varIndex + 1}: ${variation.item_variation_data?.name || 'Unnamed'}`);
                console.log(`     Price: $${(variation.item_variation_data?.price_money?.amount || 0) / 100}`);
                console.log(`     ID: ${variation.id}`);
              });
            }
            console.log(`---`);
          } else {
            console.log(`${index + 1}. Type: ${item.type} (not an ITEM)`);
          }
        });

        allItems = [...allItems, ...data.objects];
      } else {
        console.log(`No items found in Page ${pageNumber}`);
      }

      // Check for next cursor
      cursor = data.cursor || null;
      hasMore = !!cursor && data.objects && data.objects.length > 0;

      if (hasMore) {
        console.log(`\nMore items available. Next cursor: ${cursor!.substring(0, 30)}...`);
      } else {
        console.log(`\nNo more items. Pagination complete.`);
      }

      pageNumber++;

    } catch (error: any) {
      console.error('\n=== ERROR fetching Square items ===');
      console.error(`Error Message: ${error.message}`);
      console.error(`Stack Trace: ${error.stack}`);
      throw error;
    }
  }

  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`Total Square items fetched: ${allItems.length}`);

  // Count ITEM type objects
  const itemObjects = allItems.filter(item => item.type === 'ITEM');
  console.log(`Total ITEM objects: ${itemObjects.length}`);

  // Count total variations
  let totalVariations = 0;
  itemObjects.forEach((item: any) => {
    totalVariations += item.item_data?.variations?.length || 0;
  });
  console.log(`Total variations: ${totalVariations}`);

  return allItems;
}



export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please login first'
        },
        { status: 401 }
      );
    }

    let merchantId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { merchantId: string };
      merchantId = decoded.merchantId;
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid session',
          message: 'Please login again'
        },
        { status: 401 }
      );
    }

    if (!merchantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token',
          message: 'Merchant ID not found in token'
        },
        { status: 401 }
      );
    }

    const mongoose = await connectToDatabase();

    if (!mongoose?.connection?.db) {
      throw new Error('Database connection failed');
    }

    const db = mongoose.connection.db;

    const credentials = await db
      .collection('squareCredentials')
      .findOne({
        merchantId: new ObjectId(merchantId),
      });

    if (!credentials) {
      return NextResponse.json(
        {
          success: false,
          error: 'Square not configured',
          message: 'Please setup Square integration from dashboard',
          action: 'setup_required'
        },
        { status: 400 }
      );
    }

    if (credentials.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          error: 'Square sync is inactive',
          message: 'Please activate Square sync from the dashboard',
          action: 'activate_required'
        },
        { status: 400 }
      );
    }

    const { accessToken, locationId } = credentials;

    if (!accessToken || !locationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Square credentials are incomplete'
        },
        { status: 400 }
      );
    }

    let squareItems: any[] = [];
    try {
      console.log('Fetching all items from Square with pagination...');

      // Use the new pagination function
      const allSquareObjects = await fetchAllSquareItems(accessToken, locationId);

      // Process the items
      if (allSquareObjects && allSquareObjects.length > 0) {
        allSquareObjects.forEach((item: any) => {
          if (item.type === 'ITEM' && item.item_data?.name && item.item_data?.variations) {
            item.item_data.variations.forEach((variation: any) => {
              if (variation.type === 'ITEM_VARIATION' && variation.item_variation_data) {
                squareItems.push({
                  id: item.id,
                  name: item.item_data.name.trim().toLowerCase(),
                  originalName: item.item_data.name,
                  variationId: variation.id,
                  variationName: variation.item_variation_data.name || item.item_data.name,
                  price: variation.item_variation_data?.price_money?.amount
                    ? (variation.item_variation_data.price_money.amount / 100)
                    : 0,
                  currency: variation.item_variation_data?.price_money?.currency || 'EUR',
                  environment: SQUARE_ENVIRONMENT
                });
              }
            });
          }
        });
      }

      console.log(`Processed ${squareItems.length} items from Square (${SQUARE_ENVIRONMENT})`);

      await db.collection('squareCredentials').updateOne(
        { merchantId: new ObjectId(merchantId) },
        {
          $set: {
            lastApiCallAt: new Date(),
            lastApiCallStatus: 'success',
            totalItemsFetched: squareItems.length,
            lastSyncEnvironment: SQUARE_ENVIRONMENT
          }
        }
      );

    } catch (squareError: any) {
      console.error('Square API call failed:', squareError);

      await db.collection('squareCredentials').updateOne(
        { merchantId: new ObjectId(merchantId) },
        {
          $set: {
            lastSyncAt: new Date(),
            lastSyncStatus: 'error',
            lastSyncError: squareError.message,
            lastSyncEnvironment: SQUARE_ENVIRONMENT
          }
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Square API failed',
          message: squareError.message || 'Cannot connect to Square',
          environment: SQUARE_ENVIRONMENT,
          action: 'api_error'
        },
        { status: 500 }
      );
    }

    const giftItems = await db
      .collection('giftitems')
      .find({
        merchantId: new ObjectId(merchantId),
      })
      .toArray();

    console.log(`Found ${giftItems.length} products in database`);

    // Arrays without separate price mismatch array
    const matched: any[] = []; // All matched items
    const notMatched: any[] = []; // Not found in Square
    let priceMismatchCount = 0;

    const redemptionNote = {
      title: 'Important: Redemption Price Policy',
      message: 'Even if prices differ between Brontie and Square, ALL redemptions will use Brontie prices only.',
      rules: [
        '1. Redemption price = Brontie database price',
        '2. Square price is for reference only',
        '3. Customers redeem at Brontie price',
        '4. Price mismatches are logged but do not affect redemption'
      ]
    };

    for (const item of giftItems) {
      try {
        const itemName = item.name || '';
        const dbName = itemName.trim().toLowerCase();
        const dbPrice = item.price || 0;

        // Find matching item in Square
        const squareMatch = squareItems.find(squareItem =>
          squareItem.name === dbName
        );

        if (squareMatch) {
          const squarePrice = squareMatch.price || 0;
          const squareVariationId = squareMatch.variationId;

          const priceDifference = Math.abs(dbPrice - squarePrice);
          const hasPriceMismatch = priceDifference > 0.01;

          if (hasPriceMismatch) {
            priceMismatchCount++;
          }

          // Update the gift item with Square information
          await db.collection('giftitems').updateOne(
            { _id: item._id },
            {
              $set: {
                square_id: squareVariationId,
                square_price: squarePrice,
                square_name: squareMatch.originalName,
                square_variation_name: squareMatch.variationName,
                syncedAt: new Date(),
                lastSyncStatus: 'synced',
                lastSyncDate: new Date(),
                lastSyncEnvironment: SQUARE_ENVIRONMENT,
                price_mismatch_info: hasPriceMismatch ? {
                  square_price: squarePrice,
                  brontie_price: dbPrice,
                  difference: (squarePrice - dbPrice).toFixed(2),
                  note: 'Redemption uses Brontie price',
                  environment: SQUARE_ENVIRONMENT
                } : null
              }
            }
          );

          const itemData = {
            name: itemName,
            brontie_price: dbPrice,
            square_price: squarePrice,
            square_id: squareVariationId,
            square_name: squareMatch.originalName,
            square_variation_name: squareMatch.variationName,
            has_price_mismatch: hasPriceMismatch,
            price_difference: hasPriceMismatch ? (squarePrice - dbPrice).toFixed(2) : '0.00',
            redemption_price: dbPrice,
            redemption_note: 'Redemption uses Brontie price',
            status: 'synced',
            environment: SQUARE_ENVIRONMENT
          };

          matched.push(itemData);
        } else {
          notMatched.push({
            name: itemName,
            price: dbPrice,
            db_name_lowercase: dbName,
            status: 'not_found',
            action_required: 'Add this product to Square catalog',
            environment: SQUARE_ENVIRONMENT
          });

          await db.collection('giftitems').updateOne(
            { _id: item._id },
            {
              $set: {
                lastSyncStatus: 'not_found',
                lastSyncDate: new Date(),
                syncedAt: new Date(),
                lastSyncEnvironment: SQUARE_ENVIRONMENT
              }
            }
          );
        }
      } catch (itemError) {
        console.error(`Error processing item ${item._id}:`, itemError);
      }
    }

    const syncResult = {
      matchedCount: matched.length,
      notMatchedCount: notMatched.length,
      priceMismatchCount: priceMismatchCount,
      totalItems: giftItems.length,
      squareItemsTotal: squareItems.length,
      syncDate: new Date(),
      environment: SQUARE_ENVIRONMENT
    };

    await db.collection('squareCredentials').updateOne(
      { merchantId: new ObjectId(merchantId) },
      {
        $set: {
          lastSyncAt: new Date(),
          lastSyncStatus: notMatched.length > 0 ? 'partial' : 'complete',
          lastSyncResult: syncResult,
          lastSyncError: null,
          lastSyncEnvironment: SQUARE_ENVIRONMENT
        }
      }
    );

    await db.collection('squareSyncLogs').insertOne({
      merchantId: new ObjectId(merchantId),
      timestamp: new Date(),
      result: syncResult,
      matchedItems: matched.map(m => ({
        name: m.name,
        square_id: m.square_id,
        price_mismatch: m.has_price_mismatch
      })),
      notMatchedItems: notMatched.map(nm => nm.name),
      square_items_count: squareItems.length,
      redemption_note: redemptionNote,
      environment: SQUARE_ENVIRONMENT,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Sync completed successfully for ${SQUARE_ENVIRONMENT} environment`,
      timestamp: new Date().toISOString(),
      environment: SQUARE_ENVIRONMENT,
      summary: {
        total_giftitems: giftItems.length,
        square_items_found: squareItems.length,
        exact_matches: matched.length,
        not_matched: notMatched.length,
        price_mismatches: priceMismatchCount,
        sync_percentage: giftItems.length > 0 ?
          Math.round((matched.length / giftItems.length) * 100) : 0,
        environment: SQUARE_ENVIRONMENT
      },
      matched: matched,
      notMatched: notMatched,
      redemption_info: redemptionNote,
      actions_required: {
        setup_missing_products: notMatched.length > 0,
        review_price_changes: priceMismatchCount > 0,
        note: 'Price mismatches do NOT affect redemption - Brontie prices will be used'
      },
      next_steps: [
        notMatched.length > 0 ? `Add missing products to Square (${SQUARE_ENVIRONMENT})` : null,
        priceMismatchCount > 0 ? 'Review price differences (optional)' : null,
        'All redemptions will use Brontie prices automatically'
      ].filter(Boolean)
    });

  } catch (error: any) {
    console.error('Square sync error:', error);

    try {
      const mongoose = await connectToDatabase();
      if (mongoose?.connection?.db) {
        const db = mongoose.connection.db;

        const token = request.cookies.get('cafe-token')?.value;
        if (token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { merchantId: string };

            if (decoded.merchantId) {
              await db.collection('squareSyncLogs').insertOne({
                merchantId: new ObjectId(decoded.merchantId),
                timestamp: new Date(),
                error: error.message,
                stack: error.stack,
                status: 'failed',
                environment: SQUARE_ENVIRONMENT,
                createdAt: new Date()
              });
            }
          } catch {
            // Ignore token errors
          }
        }
      }
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: error.message || 'Unknown error occurred',
        environment: SQUARE_ENVIRONMENT,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { merchantId: string };
    const merchantId = decoded.merchantId;

    const mongoose = await connectToDatabase();
    if (!mongoose?.connection?.db) {
      throw new Error('Database connection failed');
    }

    const db = mongoose.connection.db;

    const credentials = await db
      .collection('squareCredentials')
      .findOne({
        merchantId: new ObjectId(merchantId),
      });

    const syncLogs = await db
      .collection('squareSyncLogs')
      .find({
        merchantId: new ObjectId(merchantId),
      })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      is_configured: !!credentials,
      last_sync: credentials?.lastSyncAt,
      last_status: credentials?.lastSyncStatus || 'never_synced',
      last_environment: credentials?.lastSyncEnvironment || SQUARE_ENVIRONMENT,
      system_environment: SQUARE_ENVIRONMENT,
      sync_logs: syncLogs,
      total_syncs: syncLogs.length
    });

  } catch (error: any) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync status'
      },
      { status: 500 }
    );
  }
}

// Test endpoint
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { merchantId: string };
    const merchantId = decoded.merchantId;

    const mongoose = await connectToDatabase();
    if (!mongoose?.connection?.db) {
      throw new Error('Database connection failed');
    }

    const db = mongoose.connection.db;

    const credentials = await db
      .collection('squareCredentials')
      .findOne({
        merchantId: new ObjectId(merchantId),
      });

    if (!credentials?.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Square not configured'
        },
        { status: 400 }
      );
    }

    // Use environment from .env
    const squareApiBaseUrl = getSquareApiBaseUrl();
    const testUrl = `${squareApiBaseUrl}/v2/locations`;

    const testResponse = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Square-Version': '2024-01-18'
      }
    });

    const testData = await testResponse.json();

    return NextResponse.json({
      success: testResponse.ok,
      environment: SQUARE_ENVIRONMENT,
      api_url: testUrl,
      status: testResponse.status,
      locations_count: testData.locations?.length || 0,
      message: testResponse.ok
        ? `Connected successfully to Square ${SQUARE_ENVIRONMENT} environment`
        : `Failed to connect to Square ${SQUARE_ENVIRONMENT}`
    });

  } catch (error: any) {
    console.error('Square test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        environment: SQUARE_ENVIRONMENT
      },
      { status: 500 }
    );
  }
}
