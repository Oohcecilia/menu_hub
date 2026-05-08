import GILogo from "@/assets/GI/logo.png";
import GICover1 from "@/assets/GI/cover/cover1.jpg";
import GICover2 from "@/assets/GI/cover/cover2.jpeg";
import GICover3 from "@/assets/GI/cover/cover3.png";

import JILogo from "@/assets/JI/logo.png";
import JINavLogo from "@/assets/JI/nav_logo.png";
import JICover1 from "@/assets/JI/cover/cover1.png";
import JICover2 from "@/assets/JI/cover/cover2.jpg";
import JICover3 from "@/assets/JI/cover/cover3.jpg";

const server = window.location.hostname.split(".")[0];


export const branchesData = {
  giuseppe: {
    slug: "giuseppe",
    buid: 1154,
    name: `Giuseppe Pizzeria Sicilian Roast - ${server}`,
    categories: [
      'Antipasti',
      'Soup',
      'Salad',
      'Pasta E Risotti',
      'Pizze',
      'Main Course',
      'Desserts',
      'Coffee',
      'Beers',
      'Wines',
      'Cocktails',
      'Beverages',
    ],
    logo: GILogo,
    nav_logo: GILogo,
    no_image: GILogo,
    brand_name: "GIUSEPPE",
    brand_tagline: "Pizzeria Sicilian Roast",
    cover_images: [GICover1, GICover2, GICover3],
    is_active: true,
    theme: {
      colors: {
        primary: "#28a745",
      },
      fonts: {
        sans: "Inter",
        heading: "Asul",
      }
    }
  },

  jardin: {
    slug: "jardin",
    buid: 1361,
    name: `Jardin Mediterranean Cuisine - ${server}`,
    categories: [
      'Main Dishes',
      'Appetizers',
      'Soup',
      'Salad',
      'Dips',
      'Desserts',
      'Tapas',
      'Breakfast',
      'Drinks',
      'Coffee',
      'Wines',
      'Cocktails',
      'Beverages',
      'Beers',
    ],
    logo: JILogo,
    nav_logo: JINavLogo,
    no_image: JINavLogo,
    brand_name: "JARDIN",
    cover_images: [JICover1, JICover3, JICover2],
    brand_tagline: "Mediterranean Cuisine",
    is_active: true,
    theme: {
      colors: {
        primary: "#77964b",
      },
      fonts: {
        sans: "Inter",
        heading: "Playfair Display",
      }
    }
  }
};