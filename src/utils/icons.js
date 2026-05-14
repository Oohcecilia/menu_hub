import {
  Utensils,
  UtensilsCrossed,
  Pizza,
  Beef,
  Salad,
  Soup,
  Cake,
  Coffee,
  Beer,
  Wine,
  Martini,
  CupSoda,
  Package,
  Sandwich,
  ChefHat,
  GlassWater,
  Sparkles,
  IceCreamBowl,
  Cookie
} from "lucide-react";

const CATEGORY_ICON_MAP = {
  "main course": Utensils,
  "pasta": UtensilsCrossed,
  "pizzas": Pizza,
  "antipasti": ChefHat,
  "appetizers": Sandwich,
  "bar food": Beef,
  "salad": Salad,
  "soups": Soup,
  "desserts": IceCreamBowl,
  "drinks": GlassWater,
  "coffee": Coffee,
  "beers": Beer,
  "wines": Wine,
  "cocktails": Martini,
  "beverages": CupSoda,
  "pizze": Pizza,

  "dips": Cookie,
  "tapas": Utensils, 
  "specials": Sparkles,
};

export function getCategoryIcon(name = "") {
  const key = typeof name === "string"
    ? name.trim().toLowerCase()
    : "";

  return CATEGORY_ICON_MAP[key] || Package;
}