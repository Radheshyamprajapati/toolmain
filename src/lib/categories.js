// src/lib/categories.js

export const EVENT_OCCASIONS = [
  "Birthday Celebration",
  "Wedding Decoration",
  "Engagement Decoration",
  "Anniversary Decoration",
  "Baby Shower",
  "Bridal Shower",
  "Ganesh Chaturthi Decoration",
  "Diwali Decoration",
  "Navratri Decoration",
  "Holi Decoration",
  "Christmas Decoration",
  "New Year Decoration",
  "Housewarming / Griha Pravesh",
  "Puja & Religious Events",
  "Corporate Events",
  "Other Events",
];

export const EVENT_ITEM_TYPES = [
  "Party Supplies",
  "Stage & Backdrop",
  "Lighting & Sound",
  "Tables & Chairs",
  "Tents & Canopies",
  "Flower & Artificial Flower Decoration",
  "Balloons & Balloon Decoration",
  "Photo Booth & Props",
  "Projectors",
  "Speakers",
  "Other Events Items",
];

export const CATEGORY_GROUPS = [
  {
    key: "TOOLS",
    shortLabel: "Tools & Equipment",
    icon: "🧰",
    categories: ["Power Tools", "Hand Tools", "Measuring Tools", "Ladders", "Cleaning"],
  },
  {
    key: "INDUSTRIAL",
    shortLabel: "Industrial & Manufacturing",
    icon: "🏗️",
    categories: ["Heavy Machinery", "Generators", "Construction Equipment"],
  },
  {
    key: "EVENTS",
    shortLabel: "Events & Occasion Decoration",
    icon: "🎉",
    categories: EVENT_ITEM_TYPES,
  },
];

export function isValidGroup(group) {
  if (!group) return false;
  return CATEGORY_GROUPS.some((g) => g.key === group);
}

export function categoriesForGroup(group) {
  const found = CATEGORY_GROUPS.find((g) => g.key === group);
  return found?.categories || [];
}

export function getGroup(category) {
  if (!category) return null;
  return CATEGORY_GROUPS.find((g) => g.categories.includes(category)) || null;
}

export function isValidEventOccasion(occasion) {
  if (!occasion) return false;
  return EVENT_OCCASIONS.includes(occasion);
}
