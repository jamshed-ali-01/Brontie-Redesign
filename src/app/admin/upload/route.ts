import { NextRequest, NextResponse } from 'next/server';
import { put } from "@vercel/blob";
import path from 'path';

//updated code here
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // File type validation
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // File size validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const filename = `message-template-${timestamp}${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public"
    });

    // imageUrl same rakha
    const imageUrl = blob.url;

    return NextResponse.json({ 
      success: true, 
      imageUrl 
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
