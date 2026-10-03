const note=document.getElementById('note-text');
const charCount=document.getElementById('char-count');
const wordCount=document.getElementById('word-count');
const clearButton=document.getElementById('clear-btn');
const toggleTheme = document.getElementById('theme-toggle');


function updateCount() {
  let text = note.value;
  let characters = text.length;
  let words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  charCount.textContent = characters + " / 200 characters";
  wordCount.textContent = words + " words";

  charCount.classList.remove("warning", "over");

  if (characters > 200) {
    charCount.classList.add("over");
  } else if (characters > 180) {
    charCount.classList.add("warning");
  }

  localStorage.setItem("draft", text);
}

note.addEventListener("input", updateCount);

note.value = localStorage.getItem("draft") || "";
updateCount();


clearButton.addEventListener("click", function() {
  note.value = "";
  localStorage.removeItem("draft");
  updateCount();
});


note.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    note.value = "";
    localStorage.removeItem("draft");
    updateCount();
  }
});


toggleTheme.addEventListener("click", function() {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    toggleTheme.textContent = "Light mode";
    localStorage.setItem("theme", "dark");
  } else {
    toggleTheme.textContent = "Dark mode";
    localStorage.setItem("theme", "light");
  }
});

// Restore theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  toggleTheme.textContent = "Light mode";
}