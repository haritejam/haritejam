export type Capability = "Prebook" | "Pre-Order" | "Pickup";
export type DiningIntent = "reserve" | "reserve-preorder" | "pickup";
export type Fulfillment = "dine-in" | "pickup";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  priceRupees: number;
}

export interface Restaurant {
  id: string;
  name: string;
  neighborhood: string;
  location: string;
  cuisine: string;
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: "$$" | "$$$" | "$$$$";
  distance: string;
  eta: string;
  offer: string;
  image: string;
  imageAlt: string;
  capabilities: readonly Capability[];
  nextAvailability: string;
  menuItems: readonly MenuItem[];
}

function item(id: string, name: string, description: string, priceRupees: number): MenuItem {
  return {
    id,
    name,
    description,
    priceRupees,
    priceLabel: `₹${priceRupees.toLocaleString("en-IN")}`,
  };
}

export const restaurants: readonly Restaurant[] = [
  {
    id: "serein-house",
    name: "Serein House",
    neighborhood: "Bandra West",
    location: "Mumbai",
    cuisine: "Contemporary Indian",
    description: "Ingredient-led plates and a quiet, candlelit dining room.",
    rating: 4.8,
    reviewCount: 326,
    priceRange: "$$$$",
    distance: "1.2 km",
    eta: "22–30 min",
    offer: "15% Off",
    image: "/images/serein-house.jpg",
    imageAlt: "Warmly lit contemporary restaurant dining room",
    capabilities: ["Prebook", "Pre-Order", "Pickup"],
    nextAvailability: "Tables from 7:15 PM",
    menuItems: [
      item("sh-1", "Charred paneer tikka", "Smoked yoghurt, burnt chilli oil", 480),
      item("sh-2", "Coastal crab curry", "Kokum, coconut, steamed rice", 890),
      item("sh-3", "Saffron rice, ghee tadka", "Crisp curry leaves", 320),
      item("sh-4", "Tandoori sea bass", "Mustard, dill, pickled onion", 980),
      item("sh-5", "Slow lamb raan", "Overnight marinade, bone jus", 1240),
      item("sh-6", "Cardamom kulfi", "Pistachio brittle", 280),
    ],
  },
  {
    id: "mizu-atelier",
    name: "Mizu Atelier",
    neighborhood: "Kala Ghoda",
    location: "Mumbai",
    cuisine: "Japanese",
    description: "A focused omakase counter shaped by the day’s catch.",
    rating: 4.9,
    reviewCount: 184,
    priceRange: "$$$$",
    distance: "3.8 km",
    eta: "35–45 min",
    offer: "Chef’s table",
    image: "/images/mizu-atelier.jpg",
    imageAlt: "Candlelit fine dining plate at a restaurant table",
    capabilities: ["Prebook", "Pre-Order", "Pickup"],
    nextAvailability: "Tables from 8:30 PM",
    menuItems: [
      item("mz-1", "Salmon sashimi, yuzu", "Citrus oil, shiso", 720),
      item("mz-2", "Wagyu nigiri duo", "Wasabi, aged soy", 1150),
      item("mz-3", "Miso black cod", "Pickled cucumber", 980),
      item("mz-4", "Chawanmushi", "Dashi, uni optional", 540),
      item("mz-5", "Tempura lotus", "Matcha salt", 390),
      item("mz-6", "Yuzu cheesecake", "White sesame crumb", 420),
    ],
  },
  {
    id: "pasta-social",
    name: "Pasta Social",
    neighborhood: "Khar",
    location: "Mumbai",
    cuisine: "Italian",
    description: "Hand-rolled pasta, seasonal sauces, and an easygoing bar.",
    rating: 4.7,
    reviewCount: 512,
    priceRange: "$$$",
    distance: "2.4 km",
    eta: "20–25 min",
    offer: "15% Off",
    image: "/images/pasta-social.jpg",
    imageAlt: "Wood-fired pizza served at a restaurant table",
    capabilities: ["Prebook", "Pre-Order", "Pickup"],
    nextAvailability: "Ready for pickup in 20 min",
    menuItems: [
      item("ps-1", "Truffle tagliatelle", "Parmesan, cracked pepper", 640),
      item("ps-2", "Wood-fired margherita", "San Marzano, basil", 520),
      item("ps-3", "Burrata, heirloom tomato", "Aged balsamic", 490),
      item("ps-4", "Cacio e pepe", "Pecorino, toasted pepper", 560),
      item("ps-5", "Lamb ragu pappardelle", "Slow-cooked shoulder", 720),
      item("ps-6", "Tiramisu al cucchiaio", "Espresso, mascarpone", 340),
    ],
  },
  {
    id: "honey-and-smoke",
    name: "Honey & Smoke",
    neighborhood: "Lower Parel",
    location: "Mumbai",
    cuisine: "Modern European",
    description: "Wood-fired cooking with a polished, convivial dining room.",
    rating: 4.6,
    reviewCount: 278,
    priceRange: "$$$",
    distance: "4.1 km",
    eta: "25–32 min",
    offer: "10% Off",
    image: "/images/honey-and-smoke.jpg",
    imageAlt: "Refined plated dish at a restaurant table",
    capabilities: ["Prebook", "Pre-Order", "Pickup"],
    nextAvailability: "Tables from 6:45 PM",
    menuItems: [
      item("hs-1", "Smoked lamb shoulder", "Charred leek, jus", 1080),
      item("hs-2", "Honey-glazed carrots", "Yoghurt, dukkah", 360),
      item("hs-3", "Charred octopus", "Paprika oil, fennel", 790),
      item("hs-4", "Wood-fired chicken", "Lemon thyme, pan juices", 680),
      item("hs-5", "Bone marrow toast", "Parsley salad", 450),
      item("hs-6", "Dark chocolate tart", "Sea salt, cream", 390),
    ],
  },
  {
    id: "little-saigon",
    name: "Little Saigon",
    neighborhood: "Colaba",
    location: "Mumbai",
    cuisine: "Vietnamese",
    description: "Bright, herb-forward Vietnamese comfort food made to travel well.",
    rating: 4.7,
    reviewCount: 391,
    priceRange: "$$",
    distance: "5.6 km",
    eta: "15–22 min",
    offer: "15% Off",
    image: "/images/little-saigon.jpg",
    imageAlt: "Fresh, herb-forward restaurant dish",
    capabilities: ["Prebook", "Pre-Order", "Pickup"],
    nextAvailability: "Ready for pickup in 15 min",
    menuItems: [
      item("ls-1", "Pho ga, herb plate", "Free-range chicken, star anise", 420),
      item("ls-2", "Crispy pork banh mi", "Pickle, chilli mayo", 310),
      item("ls-3", "Green papaya salad", "Peanuts, nuoc cham", 280),
      item("ls-4", "Prawn summer rolls", "Peanut sauce", 340),
      item("ls-5", "Caramel claypot fish", "Broken rice", 560),
      item("ls-6", "Vietnamese coffee panna", "Condensed milk", 220),
    ],
  },
  {
    id: "the-verandah",
    name: "The Verandah",
    neighborhood: "Worli",
    location: "Mumbai",
    cuisine: "Coastal Indian",
    description: "Elegant coastal classics in a sun-washed all-day restaurant.",
    rating: 4.8,
    reviewCount: 246,
    priceRange: "$$$",
    distance: "3.1 km",
    eta: "22–28 min",
    offer: "12% Off",
    image: "/images/the-verandah.jpg",
    imageAlt: "Sophisticated restaurant interior with natural light",
    capabilities: ["Prebook", "Pre-Order", "Pickup"],
    nextAvailability: "Tables from 7:00 PM",
    menuItems: [
      item("tv-1", "Prawn moilee", "Coconut, turmeric, appam", 760),
      item("tv-2", "Appam and stew", "Vegetable, curry leaf", 390),
      item("tv-3", "Sol kadhi", "Kokum, cumin", 180),
      item("tv-4", "Bombil fry", "Semolina crust, lime", 520),
      item("tv-5", "Konkani fish thali", "Rice, pickle, solkadhi", 890),
      item("tv-6", "Coconut jaggery payasam", "Toasted cashew", 260),
    ],
  },
];

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find((restaurant) => restaurant.id === id);
}

export function parseSearchQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export function searchRestaurants(list: readonly Restaurant[], query: string): Restaurant[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...list];
  }

  return list.filter((restaurant) => {
    const haystack = [
      restaurant.name,
      restaurant.cuisine,
      restaurant.neighborhood,
      restaurant.location,
      ...restaurant.menuItems.map((item) => item.name),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function intentToFulfillment(intent: DiningIntent | undefined): Fulfillment {
  if (intent === "pickup") {
    return "pickup";
  }
  return "dine-in";
}

export function parseDiningIntent(value: string | string[] | undefined): DiningIntent | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "reserve" || raw === "reserve-preorder" || raw === "pickup") {
    return raw;
  }
  return undefined;
}
