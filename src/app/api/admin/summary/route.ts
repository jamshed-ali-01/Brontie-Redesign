import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import GiftItem from '@/models/GiftItem';
import Merchant from '@/models/Merchant';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import MerchantLocation from '@/models/MerchantLocation';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get basic counts
    const totalMerchants = await Merchant.countDocuments({ isActive: true });
    const totalGiftItems = await GiftItem.countDocuments({ isActive: true });
    const totalVouchers = await Voucher.countDocuments();
    const totalRedemptions = await Voucher.countDocuments({ status: 'redeemed' });
    
    // Calculate total revenue from voucher amounts (not price)
    const revenueResult = await Voucher.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    // Get recent vouchers with proper joins through giftItem
    const recentVouchersAgg = await Voucher.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'giftitems',
          localField: 'giftItemId',
          foreignField: '_id',
          as: 'giftItem'
        }
      },
      { $unwind: { path: '$giftItem', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'merchants',
          localField: 'giftItem.merchantId',
          foreignField: '_id',
          as: 'merchant'
        }
      },
      { $unwind: { path: '$merchant', preserveNullAndEmptyArrays: true } },
      // For redeemed vouchers, get the actual redemption location
      {
        $lookup: {
          from: 'redemptionlogs',
          localField: '_id',
          foreignField: 'voucherId',
          as: 'redemptionLog'
        }
      },
      // For all vouchers, get the valid locations as fallback
      {
        $lookup: {
          from: 'merchantlocations',
          localField: 'validLocationIds',
          foreignField: '_id',
          as: 'validLocations'
        }
      },
      // For redeemed vouchers, get the actual redemption location details
      {
        $lookup: {
          from: 'merchantlocations',
          localField: 'redemptionLog.merchantLocationId',
          foreignField: '_id',
          as: 'redemptionLocation'
        }
      },
      {
        $project: {
          _id: 1,
          giftItemName: '$giftItem.name',
          merchantName: '$merchant.name',
          // Use redemption location for redeemed vouchers, fallback to first valid location
          locationName: {
            $cond: {
              if: { $eq: ['$status', 'redeemed'] },
              then: { $arrayElemAt: ['$redemptionLocation.name', 0] },
              else: { $arrayElemAt: ['$validLocations.name', 0] }
            }
          },
          price: '$amount', // Use amount field from voucher
          status: 1,
          createdAt: 1
        }
      }
    ]);

    const recentVouchers = recentVouchersAgg.map(voucher => ({
      _id: voucher._id.toString(),
      giftItemName: voucher.giftItemName || 'Unknown Gift',
      merchantName: voucher.merchantName || 'Unknown Merchant',
      locationName: voucher.locationName || 'Unknown Location',
      price: voucher.price || 0,
      status: voucher.status,
      createdAt: voucher.createdAt.toISOString()
    }));
    
    // Get top gift items (most purchased) - join with giftItem for names
    const topGiftItems = await Voucher.aggregate([
      {
        $group: {
          _id: '$giftItemId',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' } // Use amount instead of price
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'giftitems',
          localField: '_id',
          foreignField: '_id',
          as: 'giftItem'
        }
      },
      { $unwind: { path: '$giftItem', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: '$giftItem.name',
          count: 1,
          revenue: 1
        }
      }
    ]);
    
    // Get top merchants through giftItem relationship
    const topMerchants = await Voucher.aggregate([
      {
        $lookup: {
          from: 'giftitems',
          localField: 'giftItemId',
          foreignField: '_id',
          as: 'giftItem'
        }
      },
      { $unwind: { path: '$giftItem', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$giftItem.merchantId',
          voucherCount: { $sum: 1 },
          redemptionCount: {
            $sum: { $cond: [{ $eq: ['$status', 'redeemed'] }, 1, 0] }
          },
          revenue: { $sum: '$amount' } // Use amount instead of price
        }
      },
      { $sort: { voucherCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'merchants',
          localField: '_id',
          foreignField: '_id',
          as: 'merchant'
        }
      },
      { $unwind: { path: '$merchant', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: '$merchant.name',
          voucherCount: 1,
          redemptionCount: 1,
          revenue: 1
        }
      }
    ]);

    return NextResponse.json({
      totalMerchants,
      totalGiftItems,
      totalVouchers,
      totalRedemptions,
      totalRevenue,
      recentVouchers,
      topGiftItems,
      topMerchants
    });

  } catch (error) {
    console.error('Error fetching admin summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin summary' },
      { status: 500 }
    );
  }
}
