import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with dashes
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { categoryId } = await params;
    const body = await request.json();
    const { name, slug, description, imageUrl, displayOrder, isActive } = body;
    
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }
    
    // Generate slug if not provided
    const finalSlug = slug || generateSlug(name);
    
    // Check if another category with same name or slug exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug: finalSlug }],
      _id: { $ne: categoryId } 
    });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 400 }
      );
    }
    
    const category = await Category.findByIdAndUpdate(
      categoryId,
      {
        name,
        slug: finalSlug,
        description,
        imageUrl: imageUrl || '',
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      category
    });
    
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { categoryId } = await params;
    
    // Check if category has associated gift items
    const { default: GiftItem } = await import('@/models/GiftItem');
    const giftItemCount = await GiftItem.countDocuments({ categoryId: categoryId });
    
    if (giftItemCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It has ${giftItemCount} associated gift items.` },
        { status: 400 }
      );
    }
    
    const category = await Category.findByIdAndDelete(categoryId);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
