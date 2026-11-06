// Activity 2: where photos are kept.
// Step 1 uses memoryDishStore: a plain array. Easy, but it forgets
// everything when the server restarts (like a whiteboard wiped every night).
// Step 2 swaps in dbDishStore from ./dishStore.db, a real Postgres table
// (like the pantry logbook that survives closing time).

export type StoredDish = {
  id: number;
  title: string;
  caption: string;
  mimeType: string;
  imageBase64: string;
  inspectorNote: string | null;
  createdAt: Date;
};

export type NewDish = Omit<StoredDish, "id" | "createdAt">;

export interface DishStore {
  list(): Promise<StoredDish[]>;
  get(id: number): Promise<StoredDish | undefined>;
  add(dish: NewDish): Promise<StoredDish>;
}

const dishes: StoredDish[] = [];

export const memoryDishStore: DishStore = {
  async list() {
    return [...dishes].reverse(); // newest first
  },
  async get(id) {
    return dishes.find((dish) => dish.id === id);
  },
  async add(dish) {
    const saved = { ...dish, id: dishes.length + 1, createdAt: new Date() };
    dishes.push(saved);
    return saved;
  },
};
