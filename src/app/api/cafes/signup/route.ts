import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import GiftItem from '@/models/GiftItem';
import { sendMerchantSignupEmail, sendAdminNotificationEmail } from '@/lib/email';
import { nanoid } from 'nanoid';



// Rate limiting (simple in-memory store - consider Redis for production)
const submissionCounts = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS = 3; // Max 3 submissions per hour per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const count = submissionCounts.get(ip) || 0;
  
  if (now - (count * RATE_LIMIT_WINDOW) > RATE_LIMIT_WINDOW) {
    submissionCounts.set(ip, 1);
    return false;
  }
  
  if (count >= MAX_SUBMISSIONS) {
    return true;
  }
  
  submissionCounts.set(ip, count + 1);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { step, merchant, giftItems, merchantId } = body;

    // Connect to database
    await connectToDatabase();

    // Sanitize text inputs (strip HTML)
    const sanitizeText = (text: string): string => {
      return text ? text.replace(/<[^>]*>/g, '').trim() : '';
    };

    // Step 1: Basics (Name, Email)
    if (step === 1) {
      if (!merchant?.name || !merchant?.businessEmail) {
        return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
      }

      const existingMerchant = await Merchant.findOne({ 
        contactEmail: merchant.businessEmail.toLowerCase() 
      });

      if (existingMerchant) {
        return NextResponse.json({ error: 'email_exists' }, { status: 409 });
      }

      const token = nanoid(12);
      // Persistent magic link until password set

      const newMerchant = new Merchant({
        name: sanitizeText(merchant.name),
        contactEmail: merchant.businessEmail.toLowerCase(),
        address: '', 
        county: 'Dublin',
        businessCategory: 'Café & Treats',
        status: 'approved', // Auto-approve for simplified flow
        magicLinkToken: token,
        signupStep: 1
      });

      await newMerchant.save();

      // Send notifications immediately (Simplified flow with Magic Link)
      try {
        await sendMerchantSignupEmail(newMerchant.contactEmail, {
          name: newMerchant.name,
          email: newMerchant.contactEmail,
          magicLinkToken: token
        });
        await sendAdminNotificationEmail({
          merchant: {
            name: newMerchant.name,
            email: newMerchant.contactEmail,
            address: '',
            description: '',
            phone: '',
            website: '',
            businessCategory: 'Café & Treats'
          },
          giftItems: [], // No items in simplified flow
          merchantId: newMerchant._id.toString()
        });
      } catch (e) {
        console.error('Email notification failed:', e);
      }

      return NextResponse.json({ success: true, merchantId: newMerchant._id });
    }

    // Step 2: Details (Address, County, Category, Description, etc)
    if (step === 2) {
      if (!merchantId) return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 });
      
      const updatedMerchant = await Merchant.findByIdAndUpdate(merchantId, {
        address: sanitizeText(merchant.address),
        county: merchant.county || 'Dublin',
        businessCategory: merchant.businessCategory || 'Café & Treats',
        description: sanitizeText(merchant.description),
        website: sanitizeText(merchant.website),
        contactPhone: sanitizeText(merchant.contactPhone),
        signupStep: 2
      }, { new: true });

      if (!updatedMerchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    // Step 3: Products
    if (step === 3) {
      if (!merchantId || !giftItems) return NextResponse.json({ error: 'Data missing' }, { status: 400 });

      // Create gift items
      for (const item of giftItems) {
        const newGiftItem = new GiftItem({
          merchantId,
          categoryId: item.categoryId,
          name: sanitizeText(item.name),
          description: sanitizeText(item.description),
          price: item.price,
          imageUrl: item.imageUrl || '',
          isActive: false
        });
        await newGiftItem.save();
      }

      // Finalize Merchant
      await Merchant.findByIdAndUpdate(merchantId, { signupStep: 3 });

      // Send notifications
      const finalMerchant = await Merchant.findById(merchantId);
      if (finalMerchant) {
        try {
          await sendMerchantSignupEmail(finalMerchant.contactEmail, {
            name: finalMerchant.name,
            email: finalMerchant.contactEmail
          });
          await sendAdminNotificationEmail({
            merchant: {
              name: finalMerchant.name,
              email: finalMerchant.contactEmail,
              address: finalMerchant.address || '',
              description: finalMerchant.description || '',
              phone: finalMerchant.contactPhone || '',
              website: finalMerchant.website || '',
              businessCategory: finalMerchant.businessCategory || ''
            },
            giftItems: giftItems.map((item: any) => ({
              name: item.name,
              categoryId: item.categoryId,
              price: item.price,
              description: item.description
            })),
            merchantId: finalMerchant._id.toString()
          });
        } catch (e) { console.error('Email failed', e); }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  } catch (error) {
    console.error('SERVER SIDE ERROR LOG - Café signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
