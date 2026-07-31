import { z } from "zod";

export const STORE_CATEGORIES = [
  "MARKETPLACE",
  "DEPARTMENT_STORE",
  "HOME_AND_FURNISHINGS",
  "APPAREL_AND_ACCESSORIES",
  "BEAUTY_AND_WELLNESS",
  "ELECTRONICS_RETAILER",
  "GROCERY_AND_FOOD",
  "SPORTING_GOODS",
  "TRAVEL_AND_HOSPITALITY",
  "SOFTWARE_AND_SUBSCRIPTIONS",
  "FINANCIAL_SERVICES",
  "AUTOMOTIVE",
  "PET_SUPPLIES",
  "OFFICE_CRAFT_AND_SCHOOL",
  "SPECIALTY_RETAIL",
  "OTHER",
] as const;

export const ITEM_CATEGORIES = [
  "FURNITURE",
  "HOME_DECOR",
  "BED_AND_BATH",
  "KITCHEN_AND_DINING",
  "APPLIANCES",
  "ELECTRONICS",
  "COMPUTERS_AND_MOBILE",
  "CLOTHING",
  "SHOES",
  "ACCESSORIES",
  "BEAUTY_AND_PERSONAL_CARE",
  "HEALTH_AND_FITNESS",
  "GROCERIES",
  "FOOD_AND_DINING",
  "TRAVEL",
  "SOFTWARE",
  "STREAMING_AND_MEDIA",
  "FINANCIAL_PRODUCTS",
  "AUTOMOTIVE",
  "PET_SUPPLIES",
  "BABY_AND_KIDS",
  "TOYS_AND_GAMES",
  "OUTDOOR_AND_GARDEN",
  "OFFICE_AND_SCHOOL",
  "GIFTS",
  "GENERAL_MERCHANDISE",
  "SERVICES",
  "OTHER",
] as const;

export const StoreCategorySchema = z.enum(STORE_CATEGORIES);
export const ItemCategorySchema = z.enum(ITEM_CATEGORIES);
export const CategoryConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export type StoreCategory = z.infer<typeof StoreCategorySchema>;
export type ItemCategory = z.infer<typeof ItemCategorySchema>;
export type CategoryConfidence = z.infer<typeof CategoryConfidenceSchema>;

export const STORE_CATEGORY_LABELS: Record<StoreCategory, string> = {
  MARKETPLACE: "Marketplace",
  DEPARTMENT_STORE: "Department store",
  HOME_AND_FURNISHINGS: "Home & furnishings",
  APPAREL_AND_ACCESSORIES: "Apparel & accessories",
  BEAUTY_AND_WELLNESS: "Beauty & wellness",
  ELECTRONICS_RETAILER: "Electronics retailer",
  GROCERY_AND_FOOD: "Grocery & food",
  SPORTING_GOODS: "Sporting goods",
  TRAVEL_AND_HOSPITALITY: "Travel & hospitality",
  SOFTWARE_AND_SUBSCRIPTIONS: "Software & subscriptions",
  FINANCIAL_SERVICES: "Financial services",
  AUTOMOTIVE: "Automotive",
  PET_SUPPLIES: "Pet supplies",
  OFFICE_CRAFT_AND_SCHOOL: "Office, craft & school",
  SPECIALTY_RETAIL: "Specialty retail",
  OTHER: "Other store",
};

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  FURNITURE: "Furniture",
  HOME_DECOR: "Home decor",
  BED_AND_BATH: "Bed & bath",
  KITCHEN_AND_DINING: "Kitchen & dining",
  APPLIANCES: "Appliances",
  ELECTRONICS: "Electronics",
  COMPUTERS_AND_MOBILE: "Computers & mobile",
  CLOTHING: "Clothing",
  SHOES: "Shoes",
  ACCESSORIES: "Accessories",
  BEAUTY_AND_PERSONAL_CARE: "Beauty & personal care",
  HEALTH_AND_FITNESS: "Health & fitness",
  GROCERIES: "Groceries",
  FOOD_AND_DINING: "Food & dining",
  TRAVEL: "Travel",
  SOFTWARE: "Software",
  STREAMING_AND_MEDIA: "Streaming & media",
  FINANCIAL_PRODUCTS: "Financial products",
  AUTOMOTIVE: "Automotive",
  PET_SUPPLIES: "Pet supplies",
  BABY_AND_KIDS: "Baby & kids",
  TOYS_AND_GAMES: "Toys & games",
  OUTDOOR_AND_GARDEN: "Outdoor & garden",
  OFFICE_AND_SCHOOL: "Office & school",
  GIFTS: "Gifts",
  GENERAL_MERCHANDISE: "General merchandise",
  SERVICES: "Services",
  OTHER: "Other items",
};

export function removeOtherWhenSpecific<T extends string>(
  values: T[],
  other: T,
) {
  const unique = [...new Set(values)];
  return unique.length > 1 ? unique.filter((value) => value !== other) : unique;
}
