import { Router, type IRouter } from "express";
import { DishUpload, parseImageDataUrl, toGalleryItem } from "../lib/dishUpload";
import { memoryDishStore } from "../lib/dishStore";
import { dbDishStore } from "../lib/dishStore.db";

// Step 1 used memoryDishStore (forgets on restart).
// Step 2 switches to the Postgres pantry so photos survive restarts.
void memoryDishStore;
const store = dbDishStore;
const router: IRouter = Router();

// GET /api/dishes: the gallery menu (no image data, just links to each image)
router.get("/dishes", async (_req, res) => {
  const rows = await store.list();
  res.json({ dishes: rows.map(toGalleryItem) });
});

// GET /api/dishes/:id/image: serve one photo's bytes
router.get("/dishes/:id/image", async (req, res) => {
  const id = Number(req.params.id);
  const dish = Number.isInteger(id) ? await store.get(id) : undefined;
  if (!dish) {
    res.status(404).json({ error: "Photo not found." });
    return;
  }
  res.type(dish.mimeType);
  res.set("Cache-Control", "public, max-age=86400");
  res.send(Buffer.from(dish.imageBase64, "base64"));
});

// POST /api/dishes: drop off a new photo at the kitchen door
router.post("/dishes", async (req, res) => {
  const parsed = DishUpload.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid upload." });
    return;
  }

  const image = parseImageDataUrl(parsed.data.image);
  if ("error" in image) {
    res.status(400).json({ error: image.error });
    return;
  }

  // Activity 3 adds the inspector agent right here, before we save.

  const saved = await store.add({
    title: parsed.data.title,
    caption: parsed.data.caption ?? "",
    mimeType: image.mimeType,
    imageBase64: image.base64,
    inspectorNote: null,
  });
  res.status(201).json({ dish: toGalleryItem(saved) });
});

export default router;
