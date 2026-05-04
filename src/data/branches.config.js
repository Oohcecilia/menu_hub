const server = window.location.hostname.split(".")[0];

export const branchesData = {
  giuseppe: {
    slug: "giuseppe",
    buid: 1154,
    name: `Giuseppe Pizzeria Sicilian Roast - ${server}`,
    categories: [
      'Main Course',
      'Pasta E Risotti',
      'Pizze',
      'Antipasti',
      'Appetizers',
      'Salad',
      'Soup',
      'Desserts',
      'Drinks',
      'Coffee',
      'Beers',
      'Wines',
      'Cocktails',
      'Beverages',
    ],
    logo: "/@/assets/GI/logo.png",
    nav_logo: "/@/assets/GI/logo.png",
    no_image: "/@/assets/GI/logo.png",
    brand_name: "GIUSEPPE",
    brand_tagline: "Pizzeria Sicilian Roast",
    cover_images: ["/@/assets/GI/cover/cover1.jpg", "/@/assets/GI/cover/cover2.jpeg", "/@/assets/GI/cover/cover3.png"],
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
    logo: "/@assets/JI/logo.png",
    nav_logo: "/@/assets/JI/nav_logo.png",
    no_image: "/@/assets/JI/nav_logo.png",
    brand_name: "JARDIN",
    cover_images: ["/@/assets/JI/cover/cover1.png", "/@/assets/JI/cover/cover3.jpg", "/@/assets/JI/cover/cover2.jpg"],
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
  },

  mb: {
    slug: "mb",
    buid: 1154,
    name: `MB Restaurant - ${server}`,
    categories: ['All Items'],
    theme_primary: "#1e293b",
    theme_background: "#ffffff",
    is_active: true,
  },
};