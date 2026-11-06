// Activity 2: the favorite-dish gallery.
// The waiter carries photos to the kitchen (POST /api/dishes) and
// brings back the gallery menu (GET /api/dishes).

const uploadForm = document.querySelector("#dish-form");
const titleInput = document.querySelector("#dish-title");
const captionInput = document.querySelector("#dish-caption");
const fileInput = document.querySelector("#dish-file");
const preview = document.querySelector("#dish-preview");
const uploadButton = uploadForm.querySelector("button[type='submit']");
const uploadMessage = document.querySelector("#dish-message");
const galleryGrid = document.querySelector("#dish-grid");

let preparedImage = null; // the resized photo, as a data URL

// Show a preview and shrink the photo before it travels.
fileInput.addEventListener("change", async () => {
  clearMessage();
  const file = fileInput.files[0];
  preparedImage = null;
  preview.hidden = true;
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showMessage("That file is not a photo.", "error");
    return;
  }
  try {
    preparedImage = await shrinkImage(file, 1280);
    preview.src = preparedImage;
    preview.hidden = false;
  } catch {
    showMessage("Could not read that photo. Try a JPEG or PNG.", "error");
  }
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  if (!preparedImage) {
    showMessage("Choose a photo first.", "error");
    return;
  }

  uploadButton.disabled = true;
  showMessage("Uploading... the kitchen is checking your photo.", "info");

  try {
    const res = await fetch("/api/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleInput.value,
        caption: captionInput.value,
        image: preparedImage,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      // Activity 3: the inspector's "only deep dish" error shows up here.
      showMessage(data.error + (data.reason ? ` ${data.reason}` : ""), "error");
      return;
    }
    showMessage("Added to the gallery!", "success");
    uploadForm.reset();
    preparedImage = null;
    preview.hidden = true;
    loadGallery();
  } catch {
    showMessage("Could not reach the kitchen. Is the API server running?", "error");
  } finally {
    uploadButton.disabled = false;
  }
});

async function loadGallery() {
  try {
    const res = await fetch("/api/dishes");
    const data = await res.json();
    renderGallery(data.dishes);
  } catch {
    galleryGrid.replaceChildren(note("Start the API server to see the gallery."));
  }
}

function renderGallery(dishes) {
  if (!dishes.length) {
    galleryGrid.replaceChildren(note("No photos yet. Be the first to share one!"));
    return;
  }
  const cards = dishes.map((dish) => {
    const card = document.createElement("li");
    card.className = "dish-card";

    const img = document.createElement("img");
    img.src = dish.imageUrl;
    img.alt = dish.title;
    img.loading = "lazy";

    const title = document.createElement("h3");
    title.textContent = dish.title;

    const caption = document.createElement("p");
    caption.textContent = dish.caption;

    const meta = document.createElement("small");
    meta.textContent = new Date(dish.createdAt).toLocaleDateString();

    card.append(img, title, caption, meta);
    if (dish.inspectorNote) {
      const inspected = document.createElement("span");
      inspected.className = "inspector-badge";
      inspected.textContent = dish.inspectorNote;
      card.append(inspected);
    }
    return card;
  });
  galleryGrid.replaceChildren(...cards);
}

// Resize big phone photos so uploads stay small and fast.
function shrinkImage(file, maxSize) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function note(text) {
  const item = document.createElement("li");
  item.className = "dish-empty";
  item.textContent = text;
  return item;
}

function showMessage(text, kind) {
  uploadMessage.textContent = text;
  uploadMessage.className = `dish-message ${kind}`;
}

function clearMessage() {
  uploadMessage.textContent = "";
  uploadMessage.className = "dish-message";
}

loadGallery();
