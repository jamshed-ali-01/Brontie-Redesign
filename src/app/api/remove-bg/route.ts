import { NextRequest, NextResponse } from 'next/server';

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY ?? 'YoQTAZJAuSEjjRseojsTi9wF';

export async function POST(request: NextRequest) {
  try {
    // preview: true  → free low-res preview (no credit used)
    // preview: false → full resolution (uses 1 credit)
    const { imageDataUrl, preview = true } = await request.json();

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return NextResponse.json({ error: 'imageDataUrl is required' }, { status: 400 });
    }

    // Strip the "data:image/xxx;base64," prefix to get raw base64
    const base64Match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: 'Invalid image data URL format' }, { status: 400 });
    }
    const base64Image = base64Match[2];

    // Send to remove.bg
    // size: 'preview' = free, low-res watermarked
    // size: 'auto'    = full quality, uses 1 credit
    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: base64Image,
        size: preview ? 'preview' : 'auto',
        format: 'png',
      }),
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      console.error('remove.bg error:', removeBgResponse.status, errorText);
      return NextResponse.json(
        { error: `Background removal failed (${removeBgResponse.status})` },
        { status: removeBgResponse.status }
      );
    }

    // Get the PNG binary and convert back to base64 data URL
    const pngBuffer = await removeBgResponse.arrayBuffer();
    const resultBase64 = Buffer.from(pngBuffer).toString('base64');
    const resultDataUrl = `data:image/png;base64,${resultBase64}`;

    return NextResponse.json({ imageDataUrl: resultDataUrl, preview });
  } catch (error) {
    console.error('remove-bg route error:', error);
    return NextResponse.json({ error: 'Failed to remove background' }, { status: 500 });
  }
}
