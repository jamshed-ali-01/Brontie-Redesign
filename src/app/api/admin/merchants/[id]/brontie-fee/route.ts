import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import jwt from 'jsonwebtoken';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication via cookie set on admin login
    const adminUserId = request.cookies.get('admin-user-id')?.value;
    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // No JWT validation required for simple cookie-based session

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body; // action: 'activate' | 'deactivate'

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "activate" or "deactivate"' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find merchant
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Update Brontie fee settings
    const updateData: Record<string, unknown> = {};
    
    if (action === 'activate') {
      updateData['brontieFeeSettings.isActive'] = true;
      updateData['brontieFeeSettings.activatedAt'] = new Date();
      updateData['brontieFeeSettings.deactivatedAt'] = undefined;
      updateData['brontieFeeSettings.deactivatedBy'] = undefined;
      updateData['brontieFeeSettings.deactivationReason'] = undefined;
    } else if (action === 'deactivate') {
      updateData['brontieFeeSettings.isActive'] = false;
      updateData['brontieFeeSettings.deactivatedAt'] = new Date();
      updateData['brontieFeeSettings.deactivatedBy'] = adminUserId;
      updateData['brontieFeeSettings.deactivationReason'] = reason || 'Admin deactivated';
    }

    const updated = await Merchant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('brontieFeeSettings');

    return NextResponse.json({
      success: true,
      message: `Brontie fee ${action}d successfully`,
      merchantId: id,
      brontieFeeSettings: updated?.brontieFeeSettings
    });

  } catch (error) {
    console.error('Brontie fee control error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication via cookie set on admin login
    const adminUserId = request.cookies.get('admin-user-id')?.value;
    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // No JWT validation required for simple cookie-based session

    const { id } = await params;
    await connectToDatabase();

    // Get merchant Brontie fee settings
    const merchant = await Merchant.findById(id).select('brontieFeeSettings createdAt');
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Calculate account age
    const accountAge = Math.floor((Date.now() - new Date(merchant.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilAutoActivation = Math.max(0, 90 - accountAge);

    return NextResponse.json({
      merchantId: id,
      brontieFeeSettings: merchant.brontieFeeSettings,
      accountAge,
      daysUntilAutoActivation,
      shouldAutoActivate: accountAge >= 90 && !merchant.brontieFeeSettings.isActive
    });

  } catch (error) {
    console.error('Get Brontie fee settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
