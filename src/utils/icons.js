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
  GlassWater
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
  "desserts": Cake,
  "drinks": GlassWater,
  "coffee": Coffee,
  "beers": Beer,
  "wines": Wine,
  "cocktails": Martini,
  "beverages": CupSoda,
};

export function getCategoryIcon(name = "") {
  const key = typeof name === "string"
    ? name.trim().toLowerCase()
    : "";

  return CATEGORY_ICON_MAP[key] || Package;
}