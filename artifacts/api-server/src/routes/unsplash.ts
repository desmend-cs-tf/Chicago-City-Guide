import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();
const searchQuery = z.object({
  query: z.string().trim().min(3, "Enter at least 3 characters to search.").max(120),
});
const photoParams = z.object({
  photoId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/, "That photo ID is not valid."),
});

const UnsplashSearch = z.object({
  results: z.array(
    z.object({
      id: z.string().min(1),
      alt_description: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      urls: z.object({
        small: z.string().url(),
        regular: z.string().url(),
      }),
      user: z.object({
        name: z.string().min(1),
        links: z.object({ html: z.string().url() }),
      }),
      links: z.object({
        html: z.string().url(),
      }),
    }),
  ),
});

const UnsplashPhoto = z.object({
  links: z.object({
    download_location: z.string().url(),
  }),
});

function withAttribution(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "unsplash.com" && parsed.hostname !== "www.unsplash.com") {
    throw new Error("Unsplash returned an unexpected link.");
  }
  parsed.searchParams.set("utm_source", "chicago_city_guide");
  parsed.searchParams.set("utm_medium", "referral");
  return parsed.toString();
}

function friendlyUpstreamError(status: number): { status: number; message: string } {
  if (status === 401 || status === 403) {
    return {
      status: 502,
      message: "Unsplash rejected the API key. Check UNSPLASH_ACCESS_KEY in Replit Secrets.",
    };
  }
  if (status === 429) {
    return {
      status: 429,
      message: "Unsplash is receiving too many requests. Wait a moment and try again.",
    };
  }
  return {
    status: 502,
    message: "Unsplash could not complete that request. Try again in a moment.",
  };
}

router.get("/gallery/photos/search", async (req, res): Promise<void> => {
  const parsed = searchQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Enter a valid search." });
    return;
  }

  const accessKey = process.env["UNSPLASH_ACCESS_KEY"];
  if (!accessKey) {
    res.status(503).json({
      error: "Add an UNSPLASH_ACCESS_KEY secret in Replit to search Unsplash photos.",
    });
    return;
  }

  const params = new URLSearchParams({
    query: parsed.data.query,
    per_page: "12",
    orientation: "landscape",
    content_filter: "high",
  });

  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const failure = friendlyUpstreamError(response.status);
      res.status(failure.status).json({ error: failure.message });
      return;
    }

    const data = UnsplashSearch.safeParse(await response.json());
    if (!data.success) {
      req.log.warn({ error: data.error.message }, "Unsplash returned an unexpected search response");
      res.status(502).json({ error: "Unsplash returned an unexpected response. Try again later." });
      return;
    }

    const results = data.data.results.flatMap((photo) => {
      try {
        const imageUrl = new URL(photo.urls.small);
        const fullImageUrl = new URL(photo.urls.regular);
        if (
          imageUrl.protocol !== "https:" ||
          imageUrl.hostname !== "images.unsplash.com" ||
          fullImageUrl.protocol !== "https:" ||
          fullImageUrl.hostname !== "images.unsplash.com"
        ) return [];
        return [{
          id: photo.id,
          imageUrl: photo.urls.small,
          fullImageUrl: photo.urls.regular,
          alt: photo.alt_description ?? photo.description ?? "Chicago pizza photo",
          photographer: photo.user.name,
          photographerUrl: withAttribution(photo.user.links.html),
          photoUrl: withAttribution(photo.links.html),
        }];
      } catch {
        return [];
      }
    });

    res.json({ results });
  } catch (err) {
    req.log.warn({ err }, "Unsplash search failed");
    res.status(502).json({ error: "Could not reach Unsplash. Check your connection and try again." });
  }
});

router.post("/gallery/photos/:photoId/add", async (req, res): Promise<void> => {
  const parsed = photoParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "That photo ID is not valid." });
    return;
  }

  const accessKey = process.env["UNSPLASH_ACCESS_KEY"];
  if (!accessKey) {
    res.status(503).json({
      error: "Add an UNSPLASH_ACCESS_KEY secret in Replit to add Unsplash photos.",
    });
    return;
  }

  try {
    const photoResponse = await fetch(
      `https://api.unsplash.com/photos/${encodeURIComponent(parsed.data.photoId)}`,
      {
        headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!photoResponse.ok) {
      const failure = friendlyUpstreamError(photoResponse.status);
      res.status(failure.status).json({ error: failure.message });
      return;
    }

    const photo = UnsplashPhoto.safeParse(await photoResponse.json());
    if (!photo.success) {
      req.log.warn({ error: photo.error.message }, "Unsplash returned an unexpected photo response");
      res.status(502).json({ error: "Unsplash could not verify that photo. Try another one." });
      return;
    }

    const downloadLocation = new URL(photo.data.links.download_location);
    if (downloadLocation.origin !== "https://api.unsplash.com") {
      res.status(502).json({ error: "Unsplash returned an unexpected photo link." });
      return;
    }
    const tracked = await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!tracked.ok) {
      const failure = friendlyUpstreamError(tracked.status);
      res.status(failure.status).json({ error: failure.message });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.warn({ err }, "Adding an Unsplash photo failed");
    res.status(502).json({ error: "Could not add that photo right now. Try again in a moment." });
  }
});

export default router;
