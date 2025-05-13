const addBtn = document.getElementById('add-note');
const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const categorySelect = document.getElementById('category');
const durationSelect = document.getElementById('duration');
const customTimeField = document.getElementById('customTimeField');
const customTimeInput = document.getElementById('customTime');
const notesDiv = document.getElementById('notes');
const exportBtn = document.getElementById('export-notes');
const importInput = document.getElementById('import-file');

let notes = JSON.parse(localStorage.getItem("notes")) || [];

// Afficher ou cacher le champ de temps perso
durationSelect.addEventListener('change', () => {
  if (durationSelect.value === 'custom') {
    customTimeField.style.display = 'block';
  } else {
    customTimeField.style.display = 'none';
  }
});

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function getDurationInMillis() {
  const selected = durationSelect.value;
  if (selected !== 'custom') return parseInt(selected);

  const seconds = parseInt(customTimeInput.value);
  if (isNaN(seconds) || seconds <= 0) {
    alert("Veuillez entrer un nombre valide de secondes.");
    return null;
  }
  return seconds * 1000;
}

function renderNotes() {
  notesDiv.innerHTML = "";
  notes.forEach((note, index) => {
    const noteEl = document.createElement("div");
    noteEl.className = `note ${note.category}`;
    const now = Date.now();
    const remaining = Math.max(0, note.timestamp + note.duration - now);

    const h3 = document.createElement("h4");
    h3.textContent = note.title;

    const p = document.createElement("p");
    p.textContent = note.content;

    const progressBarContainer = document.createElement("div");
    progressBarContainer.className = "progress-bar-container";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBar.style.width = `${(remaining / note.duration) * 100}%`;

    progressBarContainer.appendChild(progressBar);

    noteEl.appendChild(h3);
    noteEl.appendChild(p);
    noteEl.appendChild(progressBarContainer);

    notesDiv.appendChild(noteEl);
  });
}

function updateNotes() {
  const now = Date.now();
  notes = notes.map(note => {
    note.remaining = Math.max(0, note.timestamp + note.duration - now);
    return note;
  }).filter(note => note.remaining > 0);

  saveNotes();
  renderNotes();
}

setInterval(updateNotes, 1000);

// Notification API
function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Notifications non supportées.");
  } else if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

requestNotificationPermission();

function showNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

addBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const category = categorySelect.value;
  const duration = getDurationInMillis();

  if (!title || !content || !duration) return;

  const timestamp = Date.now();

  notes.push({ title, content, category, duration, timestamp });
  saveNotes();
  renderNotes();

  titleInput.value = "";
  contentInput.value = "";
  if (customTimeField.style.display === 'block') customTimeInput.value = "";

  setTimeout(() => {
    showNotification("Note expirée", `"${title}" a expiré.`);
  }, duration);
});

// Exporter
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flashnote_notes.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Importer
importInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const importedNotes = JSON.parse(event.target.result);
      notes = [...notes, ...importedNotes];
      saveNotes();
      renderNotes();
    } catch (err) {
      alert("Erreur dans l'import du fichier JSON.");
    }
  };
  reader.readAsText(file);
});

renderNotes();