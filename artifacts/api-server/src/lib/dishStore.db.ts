import { desc, eq } from "drizzle-orm";
import { db, dishPhotosTable } from "@workspace/db";
import type { DishStore } from "./dishStore";

// Step 2: the same three jobs as the memory store, but saved in Postgres.
// Requires the Replit database (DATABASE_URL) and `pnpm --filter @workspace/db run push`.
export const dbDishStore: DishStore = {
  async list() {
    return db.select().from(dishPhotosTable).orderBy(desc(dishPhotosTable.createdAt));
  },
  async get(id) {
    const [row] = await db.select().from(dishPhotosTable).where(eq(dishPhotosTable.id, id));
    return row;
  },
  async add(dish) {
    const [row] = await db.insert(dishPhotosTable).values(dish).returning();
    return row;
  },
};
