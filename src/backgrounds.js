// Background pictures for notes. The files are made by `node scripts/make-backgrounds.js`.
// focus = the spot (in pixels of the 480x320 picture) shown, zoomed in, in the round thumbnail.
export const PICTURE_SIZE = { width: 480, height: 320 };
export const THUMB_REGION = 90; // how many picture pixels fit across a thumbnail
export const BACKGROUNDS = [
  { key: "groceries", name: "Groceries", focus: [72, 48], source: require("../assets/backgrounds/groceries.png") },
  { key: "food", name: "Food", focus: [92, 70], source: require("../assets/backgrounds/food.png") },
  { key: "music", name: "Music", focus: [270, 75], source: require("../assets/backgrounds/music.png") },
  { key: "recipes", name: "Recipes", focus: [70, 70], source: require("../assets/backgrounds/recipes.png") },
  { key: "notes", name: "Notes", focus: [45, 60], source: require("../assets/backgrounds/notes.png") },
  { key: "places", name: "Places", focus: [120, 95], source: require("../assets/backgrounds/places.png") },
  { key: "travel", name: "Travel", focus: [410, 118], source: require("../assets/backgrounds/travel.png") },
  { key: "video", name: "Video", focus: [115, 140], source: require("../assets/backgrounds/video.png") },
  { key: "celebration", name: "Celebration", focus: [330, 90], source: require("../assets/backgrounds/celebration.png") },
];

export function backgroundSource(key) {
  return BACKGROUNDS.find((b) => b.key === key)?.source ?? null;
}
