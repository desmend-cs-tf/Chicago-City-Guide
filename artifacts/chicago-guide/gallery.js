// Activity 4: search Unsplash and keep selected deep-dish photos in this browser.
const searchForm = document.querySelector("#photo-search-form");
const searchInput = document.querySelector("#photo-search");
const searchResults = document.querySelector("#gallery-results");
const savedGallery = document.querySelector("#saved-gallery");
const galleryStatus = document.querySelector("#gallery-status");

const storageKey = "chicago-deep-dish-gallery-v1";
const maxSavedPhotos = 24;
let savedPhotos = readSavedPhotos();

renderSavedPhotos();

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query.length < 3) {
    galleryStatus.textContent = "Enter at least 3 characters to search.";
    searchInput.focus();
    return;
  }

  searchForm.querySelector("button").disabled = true;
  galleryStatus.textContent = "Searching Unsplash…";
  searchResults.replaceChildren();

  try {
    const response = await fetch(`/api/gallery/photos/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unsplash search failed. Try again.");

    if (!Array.isArray(data.results) || data.results.length === 0) {
      galleryStatus.textContent = "No photos found. Try a different search.";
      return;
    }

    data.results.forEach((photo) => searchResults.append(createPhotoCard(photo, false)));
    galleryStatus.textContent = `${data.results.length} photos found. Add a favorite to your gallery.`;
  } catch (error) {
    galleryStatus.textContent = error instanceof Error
      ? error.message
      : "Could not search Unsplash. Try again in a moment.";
  } finally {
    searchForm.querySelector("button").disabled = false;
  }
});

function readSavedPhotos() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPhoto).slice(0, maxSavedPhotos);
  } catch {
    return [];
  }
}

function isPhoto(value) {
  return value &&
    typeof value.id === "string" &&
    typeof value.imageUrl === "string" &&
    typeof value.alt === "string" &&
    typeof value.photographer === "string" &&
    typeof value.photographerUrl === "string" &&
    typeof value.photoUrl === "string" &&
    isUnsplashImage(value.imageUrl) &&
    isUnsplashLink(value.photographerUrl) &&
    isUnsplashLink(value.photoUrl);
}

function isUnsplashImage(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

function isUnsplashLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "unsplash.com" || url.hostname === "www.unsplash.com");
  } catch {
    return false;
  }
}

function createPhotoCard(photo, isSaved) {
  const card = document.createElement("article");
  card.className = "gallery-card";
  card.dataset.photoId = photo.id;

  const image = document.createElement("img");
  image.src = photo.imageUrl;
  image.alt = photo.alt || "Chicago pizza photo";
  image.loading = "lazy";
  image.referrerPolicy = "no-referrer";

  const body = document.createElement("div");
  body.className = "gallery-card-body";

  const credit = document.createElement("p");
  credit.className = "gallery-credit";
  credit.append("Photo by ");
  credit.append(createLink(photo.photographer, photo.photographerUrl));
  credit.append(" on ");
  credit.append(createLink("Unsplash", photo.photoUrl));

  const button = document.createElement("button");
  button.type = "button";

  if (isSaved) {
    button.textContent = "REMOVE FROM GALLERY";
    button.addEventListener("click", () => removePhoto(photo.id));
  } else {
    const alreadySaved = savedPhotos.some((saved) => saved.id === photo.id);
    button.textContent = alreadySaved ? "ADDED" : "ADD TO GALLERY";
    button.disabled = alreadySaved;
    if (alreadySaved) button.className = "is-added";
    button.addEventListener("click", () => addPhoto(photo, button));
  }

  body.append(credit, button);
  card.append(image, body);
  return card;
}

function createLink(label, href) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  link.target = "_blank";
  link.rel = "noreferrer";
  return link;
}

async function addPhoto(photo, button) {
  if (!isPhoto(photo)) {
    galleryStatus.textContent = "That photo could not be added. Search again and choose another.";
    return;
  }
  if (savedPhotos.some((saved) => saved.id === photo.id)) return;
  if (savedPhotos.length >= maxSavedPhotos) {
    galleryStatus.textContent = "Your gallery is full. Remove a photo before adding another.";
    return;
  }

  button.disabled = true;
  galleryStatus.textContent = "Adding the photo…";
  try {
    const response = await fetch(`/api/gallery/photos/${encodeURIComponent(photo.id)}/add`, {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not add this photo.");

    const nextPhotos = [photo, ...savedPhotos];
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextPhotos));
    } catch {
      button.disabled = false;
      galleryStatus.textContent = "Your browser could not save the gallery. Free up storage and try again.";
      return;
    }

    savedPhotos = nextPhotos;
    renderSavedPhotos();
    button.textContent = "ADDED";
    button.className = "is-added";
    galleryStatus.textContent = "Photo added. Your gallery is saved in this browser.";
  } catch (error) {
    button.disabled = false;
    galleryStatus.textContent = error instanceof Error
      ? error.message
      : "Could not add this photo. Try again.";
  }
}

function removePhoto(photoId) {
  const nextPhotos = savedPhotos.filter((photo) => photo.id !== photoId);
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextPhotos));
  } catch {
    galleryStatus.textContent = "Your browser could not update the gallery. Try again.";
    return;
  }
  savedPhotos = nextPhotos;
  renderSavedPhotos();
  renderSearchResultsFromCurrentCards();
  galleryStatus.textContent = "Photo removed from your browser gallery.";
}

function renderSearchResultsFromCurrentCards() {
  for (const card of searchResults.querySelectorAll(".gallery-card")) {
    const button = card.querySelector("button");
    if (!button) continue;
    const isSaved = savedPhotos.some((photo) => photo.id === card.dataset.photoId);
    button.textContent = isSaved ? "ADDED" : "ADD TO GALLERY";
    button.className = isSaved ? "is-added" : "";
    button.disabled = isSaved;
  }
}

function renderSavedPhotos() {
  savedGallery.replaceChildren();
  if (savedPhotos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "gallery-empty";
    empty.textContent = "Your gallery is empty. Search Unsplash and add a photo you like.";
    savedGallery.append(empty);
    return;
  }

  savedPhotos.forEach((photo) => savedGallery.append(createPhotoCard(photo, true)));
}
