// app/api/organizations/vouchers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Models - import GiftItem to ensure registration
import Voucher from '@/models/Voucher';
import GiftItem from '@/models/GiftItem';
import Organization from '@/models/Organization';

// Return lists of vouchers for organization (active / redeemed / all)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('org-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    } catch (err) {
      console.error('Organization vouchers - JWT verify failed', err);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const organizationId = decoded.organizationId || decoded.orgId || decoded.id;
    if (!organizationId || !/^[0-9a-fA-F]{24}$/.test(String(organizationId))) {
      return NextResponse.json({ error: 'Invalid organization id' }, { status: 400 });
    }

    await connectToDatabase();
    console.log('Mongoose models registered:', mongoose.modelNames());

    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    // Query parameters: ?type=active|redeemed|all & limit=...
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';
    const limit = Number(url.searchParams.get('limit') || '50');

    // Build base query
    const baseQuery: any = { organizationId: orgObjectId };

    if (type === 'active') {
      baseQuery.status = { $in: ['issued', 'pending', 'unredeemed'] };
    } else if (type === 'redeemed') {
      baseQuery.status = 'redeemed';
    } // else all

    const vouchers = await Voucher.find(baseQuery)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 500))
      .populate({
        path: 'giftItemId',
        select: 'name price imageUrl merchantId',
      })
      .lean();

    // Map to a friendly payload
    const mapped = vouchers.map((v: any) => ({
      _id: v._id,
      giftItem: v.giftItemId ? {
        id: v.giftItemId._id,
        name: v.giftItemId.name,
        price: v.giftItemId.price,
        imageUrl: v.giftItemId.imageUrl || null,
      } : null,
      status: v.status,
      senderName: v.senderName || 'Anonymous',
      recipientName: v.recipientName || '',
      recipientEmail: v.recipientEmail || '',
      amount: v.amount || null,
      createdAt: v.createdAt,
      redeemedAt: v.redeemedAt || null,
      message: v.message || '',
      qrShortId: v.qrShortId || '',
      redemptionLink: v.redemptionLink || '',
    }));

    return NextResponse.json({ count: mapped.length, vouchers: mapped });
  } catch (error) {
    console.error('Organization vouchers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
