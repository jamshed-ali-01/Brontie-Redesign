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

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all categories for admin, sorted by name
    const categories = await Category.find({})
      .sort({ name: 1 })
      .select('name slug description imageUrl displayOrder isActive createdAt updatedAt');
    
    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { name, description, imageUrl } = body;
    
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = generateSlug(name);
    
    // Check if category with same name or slug exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug }] 
    });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }
    
    const category = new Category({
      name,
      slug,
      description,
      imageUrl: imageUrl || '',
      displayOrder: 0,
      isActive: true
    });
    
    await category.save();
    
    return NextResponse.json({
      success: true,
      category
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
