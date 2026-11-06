import { z } from "zod";

// The order ticket for a new photo. The browser sends the image as a
// data URL: "data:image/jpeg;base64,/9j/4AAQ..."
export const DishUpload = z.object({
  title: z.string().trim().min(1, "Give your photo a title.").max(80),
  caption: z.string().trim().max(280).optional(),
  image: z.string().min(1, "Choose a photo first."),
});

export type DishUpload = z.infer<typeof DishUpload>;

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB after decoding
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

export type ParsedImage = { mimeType: string; base64: string; bytes: number };

// Split the data URL into its type and its data, and check both.
export function parseImageDataUrl(dataUrl: string): ParsedImage | { error: string } {
  const match = DATA_URL.exec(dataUrl);
  if (!match) {
    return { error: "Only JPEG, PNG, or WebP photos can be uploaded." };
  }
  const [, mimeType, base64] = match;
  const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  if (bytes > MAX_IMAGE_BYTES) {
    return { error: "That photo is too big. Keep it under 3 MB." };
  }
  return { mimeType, base64, bytes };
}

// What the gallery receives. The image travels separately via imageUrl,
// so the list stays small and fast.
export function toGalleryItem(row: {
  id: number;
  title: string;
  caption: string;
  inspectorNote: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption,
    inspectorNote: row.inspectorNote,
    createdAt: row.createdAt.toISOString(),
    imageUrl: `/api/dishes/${row.id}/image`,
  };
}
