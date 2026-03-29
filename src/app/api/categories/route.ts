import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all categories for public display, sorted by displayOrder and name
    const categories = await Category.find({})
      .sort({ displayOrder: 1, name: 1 })
      .select('name slug description imageUrl displayOrder isActive');
      
    // Ensure imageUrl is never undefined (convert empty strings or null to empty string)
    const processedCategories = categories.map(category => {
      const categoryObj = category.toObject();
      if (categoryObj.imageUrl === undefined || categoryObj.imageUrl === null) {
        categoryObj.imageUrl = '';
      }
      return categoryObj;
    });
    
    return NextResponse.json({
      success: true,
      categories: processedCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
