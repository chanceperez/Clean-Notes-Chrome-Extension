const container = document.querySelector(".container");
const addBtn = document.querySelector(".add-box");
const searchBar = document.querySelector(".search-bar");
const noteBox = document.querySelector(".notebox");
const titleTag = noteBox.querySelector("input");
const descTag = noteBox.querySelector("textarea");
const backArrows = document.querySelectorAll(".back");
const wrapper = document.querySelector(".wrapper");
const menu = document.querySelector(".menu");
const menuButton = document.querySelector(".menu-box");
const exportButton = document.querySelector("#export-button");
const importButton = document.querySelector("#import-button");
const replaceImportButton = document.querySelector("#replace-import-button");
const backgroundColorButton = document.querySelector("#background-color");
const colorButtons = document.querySelectorAll(".color-button");
const closePopup = document.querySelector(".close-popup");

let currentNote;
// chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

window.addEventListener("load", () => {
  const bgColor = localStorage.getItem("backgroundColor") ?? "fafadc";
  document.querySelector("body").style.backgroundColor = bgColor;
  document.querySelector(".search-box").style.backgroundColor = bgColor;
  searchBar.style.backgroundColor = bgColor;
});

function getNotes() {
  const notes = JSON.parse(localStorage.getItem("notes")) ?? [];

  return notes;
}

function saveNote(note) {
  const notes = getNotes();
  const updateNote = notes.find((o) => o.id === note.id); //determines if there's another note of the same id
  let noteIdCounter = JSON.parse(localStorage.getItem("noteIdCounter") ?? 0);

  if (updateNote) {
    updateNote.title = note.title;
    updateNote.description = note.description;
    // updates info to localStorage
    if (note.id === currentNote) {
      titleTag.value = note.title;
      descTag.value = note.description;
    }
  } else {
    noteIdCounter++;
    note.id = noteIdCounter;
    notes.push(note);
    currentNote = noteIdCounter;
  }

  localStorage.setItem("noteIdCounter", JSON.stringify(noteIdCounter));
  localStorage.setItem("notes", JSON.stringify(notes)); //saves notes to localstorage
  generateNotes();
}

function deleteNote(id) {
  const notes = getNotes();
  const filteredNotes = notes.filter((note) => note.id != id); //all notes that do not have the id stay, removing the note with the id
  localStorage.setItem("notes", JSON.stringify(filteredNotes));
}

addBtn.addEventListener("click", () => {
  openNoteBox();
  currentNote = undefined;
  // chrome.runtime.sendMessage({ command: "notebox" });
});

searchBar.addEventListener("input", (e) => {
  const notes = JSON.parse(localStorage.getItem("notes")) ?? [];
  const searchData = e.target.value.toLowerCase();
  const filterByTitleStart = notes.filter((note) => {
    let lowerTitle = note.title.toLowerCase();
    return lowerTitle.startsWith(searchData);
  });
  const filterByTitle = notes.filter((note) => {
    let lowerTitle = note.title.toLowerCase();
    return (
      lowerTitle.includes(searchData) && !lowerTitle.startsWith(searchData)
    );
  });
  const filterByDesc = notes.filter((note) => {
    let lowerDesc = note.description.toLowerCase();
    if (filterByTitle.includes(note) || filterByTitleStart.includes(note))
      return false;
    return lowerDesc.includes(searchData);
  });
  if (e.target.value != "") {
    const titleResults = [];
    filterByTitle.forEach((note) => titleResults.push(note));
    filterByTitleStart.forEach((note) => titleResults.push(note));
    generateNotes(JSON.stringify(titleResults), JSON.stringify(filterByDesc));
  } else {
    generateNotes();
  }
});

titleTag.addEventListener("input", () => {
  let noteInfo = {
    id: currentNote,
    title: titleTag.value,
    description: descTag.value,
  };
  saveNote(noteInfo);
  chrome.runtime.sendMessage({ command: "save", note: noteInfo });
});

descTag.addEventListener("input", () => {
  let noteInfo = {
    id: currentNote,
    title: titleTag.value,
    description: descTag.value,
  };
  saveNote(noteInfo);
  chrome.runtime.sendMessage({ command: "save", note: noteInfo });
});

backArrows.forEach((backArrow) => {
  backArrow.addEventListener("click", () => {
    openNoteList();
    // chrome.runtime.sendMessage({ command: "note-list" });
  });
});

menuButton.addEventListener("click", () => {
  openMenu();
  // chrome.runtime.sendMessage({ command: "menu" });
});

exportButton.addEventListener("click", () => {
  exportNotes();
});

importButton.addEventListener("click", () => {
  importNotes("add");
});

replaceImportButton.addEventListener("click", () => {
  importNotes("replace");
});

backgroundColorButton.addEventListener("click", () => {
  document.querySelector(".popup").classList.add("show");
});

closePopup.addEventListener("click", () => {
  document.querySelector(".popup").classList.remove("show");
});

colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setBackgroundColor(button.id);
    chrome.runtime.sendMessage({ command: "color", color: button.id });
  });
});

function openNoteBox(title, description) {
  noteBox.classList.add("show");
  container.classList.remove("show");
  if (title) titleTag.value = title;
  if (description) descTag.value = description;
  searchBar.value = "";
}

function openMenu() {
  menu.classList.add("show");
  searchBar.value = "";
  container.classList.remove("show");
}

function openNoteList() {
  titleTag.value = descTag.value = "";
  noteBox.classList.remove("show");
  menu.classList.remove("show");
  container.classList.add("show");
  document.querySelector("body").style.overflow = "auto";
  generateNotes();
}

function setBackgroundColor(color) {
  console.log(color);
  document.querySelector("body").style.backgroundColor = color;
  searchBar.style.backgroundColor = color;
  document.querySelector(".search-box").style.backgroundColor = color;
  localStorage.setItem("backgroundColor", `${color}`);
}

function generateNotes(searchedTitle, searchedDesc) {
  let notes;
  let descNote;
  if (searchedTitle || searchedDesc) {
    notes = JSON.parse(searchedTitle);
    descNote = JSON.parse(searchedDesc);
  } else {
    notes = JSON.parse(localStorage.getItem("notes")) ?? [];
  }
  document.querySelectorAll(".note").forEach((note) => note.remove()); //removes all notes

  notes.forEach((note) => {
    //for note of notes
    console.log(note);
    note.title = note.title.trim();
    if (!note.title && !note.description) deleteNote(note.id);
    let displayTitle = note.title || "untitled";

    let noteHTML = `
    <li class="note" id="note-${note.id}">
      <div class="details">
        <p>${displayTitle}</p>
      </div>
    </li>`;

    wrapper.insertAdjacentHTML("afterbegin", noteHTML);

    document.querySelector(`#note-${note.id}`).addEventListener("click", () => {
      openNoteBox(note.title, note.description);
      currentNote = note.id;
      // chrome.runtime.sendMessage({ command: "edit", note: note });
    });
  });
  if (descNote) {
    const descWrapper = document.querySelector(".description-wrapper");
    descWrapper.classList.add("show");
    const descList = document.querySelector(".description-list");
    descNote.forEach((note) => {
      note.title = note.title.trim();
      if (!note.title && !note.description) deleteNote(note.id);
      let displayTitle = note.title || "untitled";

      let noteHTML = `
      <li class="note" id="note-${note.id}">
        <div class="details">
          <p>${displayTitle}</p>
        </div>
      </li>`;

      descList.insertAdjacentHTML("afterbegin", noteHTML);

      document
        .querySelector(`#note-${note.id}`)
        .addEventListener("click", () => {
          openNoteBox(note.title, note.description);
          currentNote = note.id;
          // chrome.runtime.sendMessage({ command: "edit", note: note });
        });
    });
  }
  if (!descNote)
    document.querySelector(".description-wrapper").classList.remove("show");
}

function exportNotes() {
  const notes = JSON.parse(localStorage.getItem("notes")) ?? [];
  if (notes.length === 0) return;

  let dataString = JSON.stringify(notes);

  saveFile(dataString);
}

function importNotes(command) {
  let notesFile = getFileContent();
  notesFile.then((result) => {
    if (!result) {
      console.log("failure");
      return;
    }

    console.log(result);

    if (command === "replace") {
      let replaceCheck = confirm(
        "do you want to replace ALL your notes with the ones in this file?"
      );
      if (!replaceCheck) return;

      setNoteIdCounter(JSON.parse(result));
      localStorage.setItem("notes", result);
    } else if (command === "add") {
      const notes = JSON.parse(localStorage.getItem("notes")) ?? [];
      const notesWithoutId = [];
      const fileNotes = JSON.parse(result);
      const hash = new Set();

      notes.forEach((note) =>
        notesWithoutId.push({
          title: note.title,
          description: note.description,
        })
      );

      fileNotes.forEach((note) =>
        notesWithoutId.push({
          title: note.title,
          description: note.description,
        })
      );

      notesWithoutId.forEach((note) => hash.add(JSON.stringify(note)));

      const hashNotes = Array.from(hash);
      const notesToPush = hashNotes.map((note) => JSON.parse(note));
      setNoteIdCounter(notesToPush);

      localStorage.setItem("notes", JSON.stringify(notesToPush));
    }
    generateNotes();
  });
}

async function getFileContent() {
  const pickerOptions = {
    types: [
      {
        description: "JSON",
        accept: {
          "application/json": [".txt", ".json"],
        },
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
  };

  const [fileHandle] = await window.showOpenFilePicker(pickerOptions);
  const file = await fileHandle.getFile();

  let fileContents = await readAsText(file);

  return fileContents;
}

function readAsText(file) {
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.onload = (e) => {
      const fileContents = e.target.result;
      resolve(fileContents);
    };

    reader.readAsText(file);
  });
}

function setNoteIdCounter(notes) {
  let noteIds = [];
  let noteIdCounter = JSON.parse(localStorage.getItem("noteIdCounter") ?? 0);

  console.log(notes);
  notes.forEach((note) => {
    if (note.id) noteIds.push(note.id);
  });

  if (noteIds.length > 0) noteIdCounter = Math.max(...noteIds);

  localStorage.setItem("noteIdCounter", noteIdCounter);

  notes.forEach((note) => {
    if (!note.id) {
      noteIdCounter++;
      note.id = noteIdCounter;
    }
  });
}

async function saveFile(content) {
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: "notes.txt",
    types: [
      {
        description: "Text File",
        accept: {
          "text/plain": [".txt"],
        },
      },
    ],
  });

  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

generateNotes();

chrome.runtime.onMessage.addListener(async function (request) {
  switch (
    request.command //basically just if/else but for checking one variable
  ) {
    // case "notebox":
    //   openNoteBox();
    //   break;
    // case "edit":
    //   openNoteBox(request.note.title, request.note.description);
    //   currentNote = request.note.id;
    case "save":
      console.log("save command received."); //only runs in other tab
      saveNote(request.note);
      break;

    // case "menu":
    //   openMenu();
    //   break;
    case "color":
      setBackgroundColor(request.color);
      break;
  }
});
