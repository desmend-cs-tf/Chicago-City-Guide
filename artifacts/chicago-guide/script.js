// Let the cardinal flutter when it is activated by mouse, touch, or keyboard.
const birdButton = document.querySelector(".bird-trigger");
const birdImage = document.querySelector(".bird");

birdButton.addEventListener("click", () => {
  // Restart the animation even when the visitor taps several times quickly.
  birdImage.classList.remove("flap");
  void birdImage.offsetWidth;
  birdImage.classList.add("flap");
});

birdImage.addEventListener("animationend", () => {
  birdImage.classList.remove("flap");
});

// This list deliberately lives only in page memory; nothing is stored locally.
const likesForm = document.querySelector("#likes-form");
const likeInput = document.querySelector("#like-input");
const likesList = document.querySelector("#likes-list");
const formMessage = document.querySelector("#form-message");
const likes = [];

likesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const newLike = likeInput.value.trim();

  if (!newLike) {
    formMessage.textContent = "Add a word or two before saving your find.";
    likeInput.focus();
    return;
  }

  likes.push(newLike);
  renderLikes();
  likeInput.value = "";
  formMessage.textContent = `${newLike} added to your list.`;
  likeInput.focus();
});

function renderLikes() {
  // Build the list from text nodes so visitor-entered content stays plain text.
  likesList.replaceChildren();

  if (likes.length === 0) {
    const emptyNote = document.createElement("li");
    emptyNote.className = "empty-note";
    emptyNote.textContent = "Your list is waiting for its first good find.";
    likesList.append(emptyNote);
    return;
  }

  likes.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    likesList.append(listItem);
  });
}
