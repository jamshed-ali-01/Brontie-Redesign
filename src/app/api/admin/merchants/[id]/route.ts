import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    const merchant = await Merchant.findById(id);
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      merchant
    });
    
  } catch (error) {
    console.error('Error fetching merchant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    const { name, description, logoUrl, contactEmail, contactPhone, website, address } = body;
    
    if (!name || !contactEmail || !address) {
      return NextResponse.json(
        { error: 'Name, contact email, and address are required' },
        { status: 400 }
      );
    }
    
    // Check if another merchant with same email exists
    const existingMerchant = await Merchant.findOne({ 
      contactEmail: contactEmail.toLowerCase(), 
      _id: { $ne: id } 
    });
    if (existingMerchant) {
      return NextResponse.json(
        { error: 'Merchant with this email already exists' },
        { status: 400 }
      );
    }
    
    const merchant = await Merchant.findByIdAndUpdate(
      id,
      {
        name,
        description: description || '',
        logoUrl: logoUrl || '',
        contactEmail: contactEmail.toLowerCase(),
        contactPhone: contactPhone || '',
        website: website || '',
        address,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      merchant
    });
    
  } catch (error) {
    console.error('Error updating merchant:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;

    // Ensure the merchant exists before proceeding
    const existing = await Merchant.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    const { default: GiftItem } = await import('@/models/GiftItem');
    const { default: Voucher } = await import('@/models/Voucher');
    const { default: Transaction } = await import('@/models/Transaction');
    const { default: QRCode } = await import('@/models/QRCode');
    const { default: MerchantLocation } = await import('@/models/MerchantLocation');
    const { default: RedemptionLog } = await import('@/models/RedemptionLog');

    const performDeletes = async (session?: mongoose.ClientSession) => {
      // Gather gift items for this merchant
      const giftItemsQuery = GiftItem.find({ merchantId: id }).select('_id');
      const giftItems = session ? await giftItemsQuery.session(session) : await giftItemsQuery;
      const giftItemIds = giftItems.map((g: { _id: mongoose.Types.ObjectId }) => g._id);

      // Gather vouchers tied to those gift items
      const vouchersQuery = Voucher.find({ giftItemId: { $in: giftItemIds } }).select('_id');
      const vouchers = giftItemIds.length > 0 ? (session ? await vouchersQuery.session(session) : await vouchersQuery) : [];
      const voucherIds = vouchers.map((v: { _id: mongoose.Types.ObjectId }) => v._id);

      // Delete dependent vouchers and transactions for those gift items
      if (giftItemIds.length > 0) {
        // Delete redemption logs tied to those vouchers
        if (voucherIds.length > 0) {
        const redemptionsDelete = RedemptionLog.deleteMany({ voucherId: { $in: voucherIds } });
        if (session) {
          await redemptionsDelete.session(session);
        } else {
          await redemptionsDelete;
        }
        }

        const voucherDelete = Voucher.deleteMany({ giftItemId: { $in: giftItemIds } });
        const txDelete = Transaction.deleteMany({ giftItemId: { $in: giftItemIds } });
        if (session) {
          await voucherDelete.session(session);
          await txDelete.session(session);
        } else {
          await voucherDelete;
          await txDelete;
        }
      }

      // Delete gift items for this merchant
      const giftDelete = GiftItem.deleteMany({ merchantId: id });
      if (session) {
        await giftDelete.session(session);
      } else {
        await giftDelete;
      }

      // Delete QR codes and merchant locations tied to this merchant
      const qrDelete = QRCode.deleteMany({ merchantId: id });
      const locationsQuery = MerchantLocation.find({ merchantId: id }).select('_id');
      const locations = session ? await locationsQuery.session(session) : await locationsQuery;
      const locationIds = locations.map((l: { _id: mongoose.Types.ObjectId }) => l._id);
      // Delete redemption logs tied to merchant locations
      if (locationIds.length > 0) {
        const locLogsDelete = RedemptionLog.deleteMany({ merchantLocationId: { $in: locationIds } });
        if (session) {
          await locLogsDelete.session(session);
        } else {
          await locLogsDelete;
        }
      }
      const locDelete = MerchantLocation.deleteMany({ merchantId: id });
      if (session) {
        await qrDelete.session(session);
        await locDelete.session(session);
      } else {
        await qrDelete;
        await locDelete;
      }

      // Finally delete the merchant
      const merchantDelete = Merchant.findByIdAndDelete(id);
      if (session) {
        await merchantDelete.session(session);
      } else {
        await merchantDelete;
      }
    };

    // Try transactional delete; fall back to non-transactional if unsupported
    let usedTransaction = false;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await performDeletes(session);
      });
      usedTransaction = true;
    } catch (txErr: unknown) {
      // Fallback if transactions are not supported (e.g., not a replica set)
      console.warn('Transaction failed, falling back to non-transactional deletes:', txErr instanceof Error ? txErr.message : String(txErr));
      await performDeletes();
    } finally {
      session.endSession();
    }

    return NextResponse.json({
      success: true,
      message: usedTransaction
        ? 'Merchant and related data deleted successfully (transaction)'
        : 'Merchant and related data deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting merchant:', error);
    return NextResponse.json(
      { error: 'Failed to delete merchant' },
      { status: 500 }
    );
  }
}
