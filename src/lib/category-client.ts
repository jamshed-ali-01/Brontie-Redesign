// ✅ Client-safe mappings (NO Mongo)

export const CATEGORY_ID_TO_NAME: Record<string, string> = {
  '68483ef21d38b4b7195d45cd': 'Café & Treats',
  '68483ef21d38b4b7195d45ce': 'Tickets & Passes',
  '68492e4c7c523741d619abeb': 'Dining & Meals',
};

export const BUSINESS_CATEGORY_TO_ID: Record<string, string> = {
  'Café & Treats': '68483ef21d38b4b7195d45cd',
  'Tickets & Passes': '68483ef21d38b4b7195d45ce',
  'Dining & Meals': '68492e4c7c523741d619abeb',
  'Other': '68483ef21d38b4b7195d45cd',
};

export function getCategoryNameById(categoryId?: string): string {
  if (!categoryId) return 'Other';
  return CATEGORY_ID_TO_NAME[categoryId] ?? 'Other';
}

export function getCategoryIdByBusiness(businessCategory?: string): string {
  if (!businessCategory) return BUSINESS_CATEGORY_TO_ID['Other'];
  return BUSINESS_CATEGORY_TO_ID[businessCategory] ?? BUSINESS_CATEGORY_TO_ID['Other'];
}