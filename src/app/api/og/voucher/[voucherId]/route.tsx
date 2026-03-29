import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

async function getVoucherData(voucherId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/voucher/${voucherId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching voucher data for OG image:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ voucherId: string }> }
) {
  try {
    const { voucherId } = await params;
    const data = await getVoucherData(voucherId);
    
    if (!data || !data.voucher) {
      // Return a default error image
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f5f2',
              fontSize: 32,
              fontWeight: 600,
            }}
          >
            <div style={{ marginBottom: 20, fontSize: 48 }}>🎁</div>
            <div style={{ color: '#d96e54' }}>Voucher Not Found</div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const voucher = data.voucher;
    
    // Get the gift item image URL or fallback to favicon
    const giftImageUrl = voucher.giftItemId.imageUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/favicon-32x32.png`;
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f5f2',
            backgroundImage: 'linear-gradient(45deg, #f8f5f2 0%, #faf8f6 100%)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            <div style={{ fontSize: 48, marginRight: 20 }}>🎁</div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#2c4e52',
              }}
            >
              Gift Voucher
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              padding: 60,
              borderRadius: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              maxWidth: 1000,
              gap: 40,
            }}
          >
            {/* Gift Image */}
            <div
              style={{
                display: 'flex',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={giftImageUrl}
                alt="Gift Item"
                style={{
                  width: 200,
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 15,
                  border: '3px solid #f4b942',
                }}
              />
            </div>

            {/* Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                flex: 1,
              }}
            >
              {/* Gift Item */}
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: '#2c4e52',
                  marginBottom: 30,
                }}
              >
                {voucher.giftItemId.name}
              </div>

              {/* From/To */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 18, color: '#8d9b6f', marginBottom: 5 }}>From</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#2c4e52' }}>
                    {voucher.senderName}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 18, color: '#8d9b6f', marginBottom: 5 }}>To</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#2c4e52' }}>
                    {voucher.recipientName}
                  </div>
                </div>
              </div>

              {/* Merchant */}
              <div
                style={{
                  fontSize: 20,
                  color: '#8d9b6f',
                  marginBottom: 10,
                }}
              >
                Redeemable at
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: '#2c4e52',
                  marginBottom: 20,
                }}
              >
                {voucher.giftItemId.merchantId.name}
              </div>

              {/* Message */}
              {voucher.senderMessage && (
                <div
                  style={{
                    fontSize: 18,
                    color: '#2c4e52',
                    fontStyle: 'italic',
                    backgroundColor: '#faf8f6',
                    padding: 20,
                    borderRadius: 10,
                    maxWidth: 400,
                  }}
                >
                  &quot;{voucher.senderMessage}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 40,
              fontSize: 18,
              color: '#8d9b6f',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: 10 }}>✨</span>
            A warm cup, a kind thought
            <span style={{ marginLeft: 10 }}>✨</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('Error generating OG image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
