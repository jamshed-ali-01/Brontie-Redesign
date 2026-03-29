import Category from '@/models/Category';
import { connectToDatabase } from '@/lib/mongodb';

// Cache for categories to avoid repeated database calls
let categoriesCache: { [key: string]: string } | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Mapping from business category to product category ID (fallback)
export const BUSINESS_CATEGORY_TO_PRODUCT_CATEGORY: Record<string, string> = {
  'Café & Treats': '68483ef21d38b4b7195d45cd',
  'Tickets & Passes': '68483ef21d38b4b7195d45ce', 
  'Dining & Meals': '68492e4c7c523741d619abeb',
  'Other': '68483ef21d38b4b7195d45cd' // Default to Cafés & Treats
};

// Load categories from database
export async function loadCategoriesFromDB(): Promise<{ [key: string]: string }> {
  try {
    await connectToDatabase();
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
    
    const categoryMap: { [key: string]: string } = {};
    categories.forEach(category => {
      categoryMap[category.name] = category._id.toString();
    });
    
    return categoryMap;
  } catch (error) {
    console.error('Error loading categories from database:', error);
    return BUSINESS_CATEGORY_TO_PRODUCT_CATEGORY; // Fallback to hardcoded
  }
}

// Get cached categories or load from database
export async function getCategoriesMap(): Promise<{ [key: string]: string }> {
  const now = Date.now();
  
  // Check if cache is valid
  if (categoriesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return categoriesCache;
  }
  
  // Load from database and update cache
  categoriesCache = await loadCategoriesFromDB();
  cacheTimestamp = now;
  
  return categoriesCache;
}

// Get product category ID from business category
export async function getProductCategoryId(businessCategory: string): Promise<string> {
  const categoriesMap = await getCategoriesMap();
  return categoriesMap[businessCategory] || categoriesMap['Other'] || BUSINESS_CATEGORY_TO_PRODUCT_CATEGORY['Other'];
}

// Get business category name from product category ID
export async function getBusinessCategoryName(categoryId: string): Promise<string> {
  const categoriesMap = await getCategoriesMap();
  const entry = Object.entries(categoriesMap).find(
    ([_, id]) => id === categoryId
  );
  return entry ? entry[0] : 'Other';
}

// Clear cache (useful for testing or when categories are updated)
export function clearCategoriesCache(): void {
  categoriesCache = null;
  cacheTimestamp = null;
}
