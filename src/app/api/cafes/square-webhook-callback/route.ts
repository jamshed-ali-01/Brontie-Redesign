// src/app/api/cafes/square-webhook-callback/route.ts - WITH PAGINATION
// NO CODE DELETED, JUST ADDED PAGINATION AND FIXED DB UNDEFINED

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Store processed events
const processedEvents = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('📬 Webhook Received!');

    let eventData;
    try {
      eventData = JSON.parse(body);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json({ success: true });
    }

    const eventId = eventData.event_id;
    const eventType = eventData.type || 'unknown';

    console.log(`📊 Event: ${eventType} | ID: ${eventId?.substring(0, 8)}...`);

    if (processedEvents.has(eventId)) {
      console.log('🔄 Duplicate event, skipping...');
      return NextResponse.json({ success: true, duplicate: true });
    }

    processedEvents.add(eventId);

    if (processedEvents.size > 100) {
      const firstEvent = Array.from(processedEvents)[0];
      processedEvents.delete(firstEvent);
    }

    if (eventType !== 'catalog.version.updated') {
      console.log(`⏭️ Skipping non-catalog event: ${eventType}`);
      return NextResponse.json({ success: true, skipped: true });
    }

    console.log('🔄 CATALOG UPDATE DETECTED - SMART NAME+MERCHANT MATCHING...');

    const mongoose = await connectToDatabase();
    if (!mongoose?.connection?.db) {
      console.error('Database connection failed');
      return NextResponse.json({ success: true, dbError: true });
    }

    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database is undefined');
      return NextResponse.json({ success: false, error: 'Database connection failed' });
    }

    const squareMerchantId = eventData.merchant_id;

    if (!squareMerchantId) {
      console.error('❌ No merchant_id in webhook event');
      return NextResponse.json({ success: false, error: 'Invalid webhook payload' });
    }

    console.log(`🔍 Webhook for Square Merchant ID: ${squareMerchantId}`);

    const credentials = await db.collection('squareCredentials').findOne({
      squareMerchantId: squareMerchantId,
      isActive: { $ne: false }
    });

    if (!credentials) {
      console.error(`❌ No active credentials found for Square Merchant ID: ${squareMerchantId}`);
      // Try fallback to find by other means if necessary, but strictly safer to fail if not found
      return NextResponse.json({
        success: false,
        error: 'Merchant not found or not active'
      });
    }

    if (!credentials.accessToken) {
      console.error('❌ Credentials found but no access token');
      return NextResponse.json({
        success: false,
        error: 'No access token found'
      });
    }

    const accessToken = credentials.accessToken;
    const merchantId = credentials.merchantId;

    console.log(`🔑 Merchant: ${merchantId?.toString()?.substring(0, 8)}...`);

    // ✅ SMART MATCHING - SKIP IF MULTIPLE RECORDS
    const updateResult = await smartNameMerchantMatching(db, merchantId, accessToken);

    if (updateResult.success) {
      console.log(`✅ Update successful! ${updateResult.updatedCount} items updated`);
    } else {
      console.error('❌ Update failed:', updateResult.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Prices updated (skipped duplicates)',
      updatedCount: updateResult.updatedCount || 0,
      skippedDuplicates: updateResult.skippedDuplicates || 0
    });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}

// ✅ SMART MATCHING - SKIP IF MULTIPLE SAME NAME FOR SAME MERCHANT
async function smartNameMerchantMatching(db: any, merchantId: string, accessToken: string) {
  try {
    console.log('🧠 Smart matching: Name + MerchantId (skip duplicates)...');

    console.log('⏳ Waiting for Square catalog to sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    // 1. Get Square items - USING PAGINATION NOW
    const squareItems = await getAllSquareItems(accessToken);
    console.log(`📦 Found ${squareItems.length} items in Square (with pagination)`);

    // 2. Get merchant's credentials to get location info
    const credentials = await db.collection('squareCredentials').findOne({
      merchantId: new ObjectId(merchantId)
    });

    if (!credentials) {
      return { success: false, error: 'Merchant credentials not found' };
    }

    // 3. For each Square item, find matching database items
    let updatedCount = 0;
    let skippedDuplicates = 0;

    for (const squareItem of squareItems) {
      if (squareItem.type === 'ITEM' && squareItem.item_data) {
        const squareItemName = squareItem.item_data.name;
        const newPrice = getPriceFromItem(squareItem);

        if (newPrice === null) continue;

        console.log(`\n🔍 Processing Square item: "${squareItemName}" ($${newPrice})`);

        // ✅ CHECK 1: Find all database items with this name for this merchant
        const matchingItems = await db.collection('giftitems').find({
          merchantId: new ObjectId(merchantId),
          name: { $regex: new RegExp(`^${squareItemName}$`, 'i') } // Case-insensitive
        }).toArray();

        console.log(`   Found ${matchingItems.length} database items with name: "${squareItemName}"`);

        // ✅ CHECK 2: If multiple items found, SKIP (duplicate names)
        if (matchingItems.length === 0) {
          console.log(`   📭 No database item found for: "${squareItemName}"`);
          continue;
        }
        else if (matchingItems.length > 1) {
          console.log(`   ⚠️ SKIPPING: ${matchingItems.length} items with same name`);
          console.log(`   IDs: ${matchingItems.map((item: any) => item._id.toString().substring(0, 8)).join(', ')}`);
          skippedDuplicates++;
          continue;
        }

        // ✅ CHECK 3: Exactly 1 item found - Safe to update
        const dbItem = matchingItems[0];
        const oldPrice = dbItem.price;

        if (oldPrice !== newPrice) {
          const result = await db.collection('giftitems').updateOne(
            { _id: dbItem._id },
            {
              $set: {
                price: newPrice,
                square_price: newPrice,
                name: squareItemName, // normalize casing here
                updated_at: new Date()
              }
            }
          );

          if (result.modifiedCount > 0) {
            updatedCount++;
            console.log(`   ✅ Updated: "${dbItem.name}" - $${oldPrice} → $${newPrice}`);

            // Also update name case to match Square
            if (dbItem.name !== squareItemName) {
              await db.collection('giftitems').updateOne(
                { _id: dbItem._id },
                { $set: { name: squareItemName } }
              );
              console.log(`   🔄 Name case updated: "${dbItem.name}" → "${squareItemName}"`);
            }
          }
        } else {
          console.log(`   ⏭️ Price unchanged: "${dbItem.name}" - $${newPrice}`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Square items processed: ${squareItems.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped (duplicate names): ${skippedDuplicates}`);

    // 4. Check for potential duplicate names in database
    const duplicateNames = await db.collection('giftitems').aggregate([
      { $match: { merchantId: new ObjectId(merchantId) } },
      {
        $group: {
          _id: { $toLower: "$name" }, // Case-insensitive grouping
          count: { $sum: 1 },
          items: { $push: { id: "$_id", name: "$name", price: "$price" } }
        }
      },
      { $match: { count: { $gt: 1 } } },
      {
        $project: {
          name: { $arrayElemAt: ["$items.name", 0] },
          count: 1,
          items: { $slice: ["$items", 2] } // Show first 2 items
        }
      }
    ]).toArray();

    if (duplicateNames.length > 0) {
      console.log(`\n🚨 DUPLICATE NAME WARNINGS:`);
      duplicateNames.forEach((dup: any, index: number) => {
        console.log(`   ${index + 1}. "${dup.name}" - ${dup.count} duplicate items`);
        console.log(`      Items: ${dup.items.map((i: any) => `${i.name} ($${i.price})`).join(', ')}`);
      });
      console.log(`   ⚠️ These items were skipped in updates`);
    }

    return {
      success: true,
      updatedCount,
      skippedDuplicates,
      duplicateWarnings: duplicateNames.length,
      note: duplicateNames.length > 0
        ? 'Some items skipped due to duplicate names'
        : 'All updates processed successfully'
    };

  } catch (error: any) {
    console.error('❌ Smart matching error:', error);
    return { success: false, error: error.message };
  }
}

// NEW FUNCTION: Get ALL Square items with pagination
async function getAllSquareItems(accessToken: string): Promise<any[]> {
  const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';
  const squareApiBaseUrl = SQUARE_ENVIRONMENT === 'sandbox'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

  let allItems: any[] = [];
  let cursor: string | null = null;
  let hasMore = true;
  let pageNumber = 1;

  console.log('📡 Fetching ALL Square items with pagination...');
  console.log(`Environment: ${SQUARE_ENVIRONMENT}`);

  while (hasMore) {
    let apiUrl = `${squareApiBaseUrl}/v2/catalog/list?types=ITEM`;

    // Add cursor only if it exists
    if (cursor) {
      apiUrl += `&cursor=${cursor}`;
    }

    try {
      console.log(`   📄 Fetching page ${pageNumber}... ${cursor ? '(with cursor)' : '(first page)'}`);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2025-10-16',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Square API Error: ${response.status} - ${response.statusText}`);
        throw new Error(`Square API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`   ✅ Page ${pageNumber}: ${data.objects?.length || 0} items`);

      if (data.objects && data.objects.length > 0) {
        allItems = [...allItems, ...data.objects];

        // Log first few items from each page
        console.log(`   Sample items from page ${pageNumber}:`);
        data.objects.slice(0, 3).forEach((item: any, index: number) => {
          if (item.type === 'ITEM' && item.item_data?.name) {
            console.log(`     ${index + 1}. ${item.item_data.name}`);
          }
        });
      }

      // Check for next cursor
      cursor = data.cursor || null;
      hasMore = !!(cursor && data.objects && data.objects.length > 0);

      if (hasMore) {
        console.log(`   ↪️ More items available, getting next page...`);
      }

      pageNumber++;

    } catch (error: any) {
      console.error('Error fetching Square items:', error);
      throw error;
    }
  }

  console.log(`🎉 Total Square items fetched: ${allItems.length} (from ${pageNumber - 1} pages)`);
  return allItems;
}

// OLD FUNCTION: Get Square items (without pagination - KEEPING FOR REFERENCE)
async function getSquareItems(accessToken: string): Promise<any[]> {
  try {
    const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';
    const squareApiBaseUrl = SQUARE_ENVIRONMENT === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    const response = await fetch(`${squareApiBaseUrl}/v2/catalog/list?types=ITEM`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2025-10-16',
      },
    });

    const data = await response.json();
    return data.objects || [];
  } catch (error) {
    console.error('Failed to get Square items:', error);
    return [];
  }
}

function getPriceFromItem(item: any): number | null {
  if (item.item_data?.variations?.[0]?.item_variation_data?.price_money?.amount) {
    return item.item_data.variations[0].item_variation_data.price_money.amount / 100;
  }
  return null;
}

// ✅ GET METHOD TO CHECK DUPLICATES
export async function GET(request: NextRequest) {
  try {
    const mongoose = await connectToDatabase();

    if (!mongoose?.connection?.db) {
      return NextResponse.json({
        status: 'error',
        error: 'Database connection failed'
      });
    }

    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Database is undefined'
      });
    }

    const token = request.cookies.get('cafe-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    // Check duplicate names for this merchant
    const duplicateNames = await db.collection('giftitems').aggregate([
      { $match: { merchantId: new ObjectId(merchantId) } },
      {
        $group: {
          _id: { $toLower: "$name" },
          count: { $sum: 1 },
          items: {
            $push: {
              id: "$_id",
              name: "$name",
              price: "$price",
              square_id: "$square_id"
            }
          }
        }
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get Square items if credentials exist
    const credentials = await db.collection('squareCredentials').findOne({
      merchantId: new ObjectId(merchantId)
    });

    let squareItems = [];
    let paginationInfo = null;

    if (credentials?.accessToken) {
      try {
        // Test the NEW pagination function
        console.log('Testing pagination function...');
        squareItems = await getAllSquareItems(credentials.accessToken);

        paginationInfo = {
          totalItems: squareItems.length,
          usingPagination: true,
          environment: process.env.SQUARE_ENVIRONMENT || 'production'
        };

      } catch (error) {
        console.log('Could not fetch Square items:', error);
      }
    }

    return NextResponse.json({
      status: 'Webhook System Status',
      merchantId: merchantId,
      pagination: paginationInfo,
      squareItems: {
        totalCount: squareItems.length,
        sample: squareItems.slice(0, 5).map((s: any) => ({
          name: s.item_data?.name,
          price: getPriceFromItem(s),
          variations: s.item_data?.variations?.length || 0
        }))
      },
      duplicateCheck: {
        hasDuplicates: duplicateNames.length > 0,
        duplicateCount: duplicateNames.length,
        duplicates: duplicateNames.map((dup: any) => ({
          name: dup.items[0]?.name,
          count: dup.count,
          items: dup.items.map((i: any) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            hasSquareId: !!i.square_id
          }))
        }))
      },
      webhookLogic: [
        '✅ Match by: Name + MerchantId',
        '✅ Update if: Exactly 1 match found',
        '❌ Skip if: Multiple items with same name',
        '❌ Skip if: No items found',
        '📦 Pagination: ALL items fetched automatically',
        `🌍 Environment: ${process.env.SQUARE_ENVIRONMENT || 'production'}`
      ]
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    });
  }
}