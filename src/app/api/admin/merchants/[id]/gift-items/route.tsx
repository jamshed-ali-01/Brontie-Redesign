import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import GiftItem from "@/models/GiftItem";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connectToDatabase();

    const giftItems = await GiftItem.find({ merchantId: id }).sort({
      itemDisplayOrder: 1,
    }); // ascending order

    return NextResponse.json({ success: true, giftItems });
  } catch (error) {
    console.error("Error fetching gift items:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gift items" },
      { status: 500 }
    );
  }
}

// import { NextResponse } from 'next/server';
// import { connectToDatabase } from '@/lib/mongodb';
// import GiftItem from '@/models/GiftItem';
// import Category from '@/models/Category';
// import Merchant from '@/models/Merchant';
// import MerchantLocation from '@/models/MerchantLocation';

// export async function GET() {
//   try {
//     await connectToDatabase();

//     const giftItems = await GiftItem.find({})
//       .populate('categoryId', 'name')
//       .populate('merchantId', 'name')
//       .populate('locationIds', 'name')
//       .sort({ name: 1 });

//     // Transform the data to include readable names
//     const transformedGiftItems = giftItems.map(item => ({
//       _id: item._id,
//       name: item.name,
//       description: item.description,
//       price: item.price,
//       imageUrl: item.imageUrl,
//       categoryId: item.categoryId._id,
//       categoryName: item.categoryId.name,
//       merchantId: item.merchantId._id,
//       merchantName: item.merchantId.name,
//       locationIds: item.locationIds.map((loc: { _id: string }) => loc._id),
//       locationNames: item.locationIds.map((loc: { name: string }) => loc.name),
//       isActive: item.isActive,
//       createdAt: item.createdAt,
//       updatedAt: item.updatedAt
//     }));

//     return NextResponse.json({
//       success: true,
//       giftItems: transformedGiftItems
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Error fetching gift items:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch gift items' },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     await connectToDatabase();

//     const body = await request.json();
//     const { name, description, price, imageUrl, categoryId, merchantId, locationIds, isActive } = body;

//     if (!name || !description || !price || !categoryId || !merchantId) {
//       return NextResponse.json(
//         { error: 'Name, description, price, category, and merchant are required' },
//         { status: 400 }
//       );
//     }

//     // Verify category exists
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return NextResponse.json(
//         { error: 'Category not found' },
//         { status: 400 }
//       );
//     }

//     // Verify merchant exists
//     const merchant = await Merchant.findById(merchantId);
//     if (!merchant) {
//       return NextResponse.json(
//         { error: 'Merchant not found' },
//         { status: 400 }
//       );
//     }

//     // Check if merchant already has 15 items
//     const existingItemsCount = await GiftItem.countDocuments({
//       merchantId,
//       isActive: true
//     });

//     if (existingItemsCount >= 15) {
//       return NextResponse.json(
//         { error: 'Merchant can only have up to 15 items. Please remove some items before adding new ones.' },
//         { status: 400 }
//       );
//     }

//     // Verify locations belong to the merchant
//     if (locationIds && locationIds.length > 0) {
//       const locations = await MerchantLocation.find({
//         _id: { $in: locationIds },
//         merchantId
//       });

//       if (locations.length !== locationIds.length) {
//         return NextResponse.json(
//           { error: 'Some locations do not belong to the selected merchant' },
//           { status: 400 }
//         );
//       }
//     }

//     // Check if gift item with same name exists for this merchant
//     const existingGiftItem = await GiftItem.findOne({ name, merchantId });
//     if (existingGiftItem) {
//       return NextResponse.json(
//         { error: 'Gift item with this name already exists for this merchant' },
//         { status: 400 }
//       );
//     }

//     const giftItem = new GiftItem({
//       name,
//       description,
//       price: parseFloat(price),
//       imageUrl: imageUrl || '',
//       categoryId,
//       merchantId,
//       locationIds: locationIds || [],
//       isActive: isActive !== undefined ? isActive : true
//     });

//     await giftItem.save();

//     return NextResponse.json({
//       success: true,
//       giftItem
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Error creating gift item:', error);
//     return NextResponse.json(
//       { error: 'Failed to create gift item' },
//       { status: 500 }
//     );
//   }
// }
