import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MessageTemplate from '@/models/MessageTemplate';

// GET single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params; // ✅ Await params
    
    const template = await MessageTemplate.findById(id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching message template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message template' },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params; // ✅ Await params
    const body = await request.json();
    
    const template = await MessageTemplate.findByIdAndUpdate(
      id,
      {
        title: body.title,
        image: body.image,
        isActive: body.isActive
      },
      { new: true }
    );
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating message template:', error);
    return NextResponse.json(
      { error: 'Failed to update message template' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params; // ✅ Await params
    const body = await request.json();
    
    const template = await MessageTemplate.findByIdAndUpdate(
      id,
      { isActive: body.isActive },
      { new: true }
    );
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template status:', error);
    return NextResponse.json(
      { error: 'Failed to update template status' },
      { status: 500 }
    );
  }
}

// DELETE - Remove template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params; // ✅ Await params
    
    const template = await MessageTemplate.findByIdAndDelete(id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    console.log('🗑️ Deleted template ID:', template.templateId);
    
    return NextResponse.json({ 
      message: 'Template deleted successfully',
      deletedTemplate: template 
    });
  } catch (error) {
    console.error('Error deleting message template:', error);
    return NextResponse.json(
      { error: 'Failed to delete message template' },
      { status: 500 }
    );
  }
}