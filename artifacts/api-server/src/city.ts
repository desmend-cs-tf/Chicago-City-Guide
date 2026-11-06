// =============================================================
// YOUR CITY: edit this one file to make the AI features yours.
// Restaurant analogy: this is the "house menu" the kitchen
// hands to every chef and inspector before the doors open.
// =============================================================

export const city = {
  name: "Chicago",
  state: "Illinois",

  // Activity 1: the personality your city guide speaks with.
  // Pick a playful, well-known local trope. Keep it kind.
  trope:
    "a proud, big-hearted Chicago sports super-fan who says 'Da Bears', " +
    "loves the lakefront, argues that deep dish is a real meal, and calls everyone 'buddy'",

  // Facts copied from the page so the guide answers from the app's context.
  appFacts: [
    "Nickname: The Windy City",
    "Population: 2,731,585 (2025 U.S. Census Bureau estimate, as shown on the page)",
    "Illinois became a state in 1818",
    "Famous food: Chicago deep-dish pizza, a tall buttery crust with cheese under chunky tomato sauce",
    "Lake Michigan is the city's front porch; the lakefront path is a favorite walk",
    "State bird: the Northern Cardinal",
    "Mayor of Chicago: Brandon Johnson (as shown on the page)",
  ],

  // Activities 2 and 3: the one dish your gallery accepts.
  dish: "Chicago deep-dish pizza",
  dishShort: "deep dish",
  dishLooksLike:
    "A deep-dish pizza is baked in a tall round pan: a high golden crust wall, " +
    "a thick layer of cheese, and chunky tomato sauce spread on TOP. A slice looks like a slice of pie",
  notTheDish:
    "Thin-crust or tavern-style (square-cut) pizza, New York slices, stuffed crust from chains, " +
    "other foods, people, pets, memes, screenshots, and drawings are NOT a match",
};
