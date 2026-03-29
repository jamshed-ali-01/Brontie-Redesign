import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MerchantLocation from '@/models/MerchantLocation';
import Voucher from '@/models/Voucher';
import crypto from 'crypto';
import mongoose from 'mongoose';

// This should be stored as an environment variable in production
const ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY || 'your-32-character-secret-key-here';
const ALGORITHM = 'aes-256-cbc';

interface DecryptedQRData {
  merchantId: string;
  locationId: string;
  timestamp: number;
  signature: string;
}

function decryptQRData(encryptedData: string): DecryptedQRData {
  try {
    // Remove any URL encoding and extract the encrypted part
    const cleanData = decodeURIComponent(encryptedData);
    
    // Split the encrypted data and IV (assuming format: iv:encryptedData)
    const parts = cleanData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid QR data format');
    }
    
    const [ivHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    // Parse the decrypted JSON
    const data = JSON.parse(decrypted) as DecryptedQRData;
    
    // Validate required fields
    if (!data.merchantId || !data.locationId || !data.timestamp || !data.signature) {
      throw new Error('Missing required fields in QR data');
    }
    
    return data;
  } catch (error) {
    console.error('QR decryption error:', error);
    throw new Error('Failed to decrypt QR code data');
  }
}

function validateQRSignature(data: DecryptedQRData): boolean {
  try {
    // Create expected signature from the data
    const signatureData = `${data.merchantId}:${data.locationId}:${data.timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', ENCRYPTION_KEY)
      .update(signatureData)
      .digest('hex');
    
    return data.signature === expectedSignature;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { encryptedData, voucherId } = body;
    
    // Validate required fields
    if (!encryptedData || !voucherId) {
      return NextResponse.json(
        { error: 'Missing required fields: encryptedData and voucherId' },
        { status: 400 }
      );
    }
    
    // Decrypt QR code data
    let decryptedData: DecryptedQRData;
    try {
      decryptedData = decryptQRData(encryptedData);
    } catch (error) {
      console.error('QR decryption error:', error);
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      );
    }
    
    // Validate signature
    if (!validateQRSignature(decryptedData)) {
      return NextResponse.json(
        { error: 'Invalid QR code signature' },
        { status: 400 }
      );
    }
    
    // Check if QR code is not too old (e.g., valid for 24 hours)
    const qrAge = Date.now() - decryptedData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (qrAge > maxAge) {
      return NextResponse.json(
        { error: 'QR code has expired' },
        { status: 400 }
      );
    }
    
    // Verify merchant location exists
    const merchantLocation = await MerchantLocation.findById(decryptedData.locationId);
    if (!merchantLocation) {
      return NextResponse.json(
        { error: 'Merchant location not found' },
        { status: 404 }
      );
    }
    
    // Verify merchant ID matches
    if (merchantLocation.merchantId.toString() !== decryptedData.merchantId) {
      return NextResponse.json(
        { error: 'Merchant location mismatch' },
        { status: 400 }
      );
    }
    
    // Find and validate voucher
    const voucher = await Voucher.findOne({ 
      redemptionLink: voucherId 
    }).populate('giftItemId');
    
    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      );
    }
    
    // Check if voucher is already redeemed
    if (voucher.status === 'redeemed') {
      return NextResponse.json(
        { error: 'Voucher has already been redeemed' },
        { status: 400 }
      );
    }
    
    // Validate that this location is valid for the voucher
    const isValidLocation = voucher.validLocationIds.some(
      (locationId: mongoose.Types.ObjectId) => locationId.toString() === decryptedData.locationId
    );
    
    if (!isValidLocation) {
      return NextResponse.json(
        { error: 'This voucher cannot be redeemed at this location' },
        { status: 400 }
      );
    }
    
    // All validations passed - return success with location info
    return NextResponse.json({
      success: true,
      message: 'QR code validated successfully',
      locationId: decryptedData.locationId,
      merchantLocation: {
        id: merchantLocation._id,
        name: merchantLocation.name,
        address: merchantLocation.address,
        merchantId: merchantLocation.merchantId
      },
      voucher: {
        id: voucher._id,
        giftItem: voucher.giftItemId,
        recipientName: voucher.recipientName,
        senderName: voucher.senderName
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('QR decryption API error:', error);
    return NextResponse.json(
      { error: 'Failed to process QR code' },
      { status: 500 }
    );
  }
}
