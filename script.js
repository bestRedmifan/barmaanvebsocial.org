// ===============================
// Barmaan Vebs - Full Locked Engine (Rewrite Version)
// ===============================

// DOM
const root = document.getElementById("root");
const status = document.getElementById("status");

// Safe text setter
function setTextSafe(el, text) {
  if (!el) return;
  el.textContent = text != null ? String(text) : "";
}

// Create element
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

// LocalStorage keys
function keyUnlock(id) {
  return "unlock_" + id;
}
function keyPoll(id) {
  return "poll_" + id;
}

// Check unlock
function isUnlocked(post) {
  return localStorage.getItem(keyUnlock(post.id)) === "true";
}
function setUnlocked(post) {
  localStorage.setItem(keyUnlock(post.id), "true");
}

// Ask for code
function askCode(post, subjectContainer, bodyContainer) {
  const userCode = prompt("Enter the code inside the posts.json");
  if (userCode == null) return;

  const trimmed = String(userCode).trim();
  const real = String(post.code || "").trim();

  if (trimmed === real && real.length > 0) {
    setUnlocked(post);
    reveal(post, subjectContainer, bodyContainer);
  } else {
    alert("Wrong code.");
  }
}

// Reveal subject + body
function reveal(post, subjectContainer, bodyContainer) {
  subjectContainer.innerHTML = "";
  bodyContainer.style.display = "block";

  const subjectEl = createEl("h2", "post-title", post.file || "");
  subjectContainer.appendChild(subjectEl);
}

// Locked subject
function renderLocked(post, subjectContainer, bodyContainer) {
  subjectContainer.innerHTML = "";
  bodyContainer.style.display = "none";

  const btn = createEl("button", "see-button", "See");
  btn.onclick = () => askCode(post, subjectContainer, bodyContainer);
  subjectContainer.appendChild(btn);
}

// Subject area
function renderSubject(post, bodyContainer) {
  const subjectContainer = createEl("div", "subject-container", null);

  if (isUnlocked(post)) {
    reveal(post, subjectContainer, bodyContainer);
  } else {
    renderLocked(post, subjectContainer, bodyContainer);
  }

  return subjectContainer;
}

// Render body
function renderBody(post) {
  const body = createEl("div", "post-body", null);

  const type = post.type || "";
  const file = post.file || "";

  if (type === "text") {
    body.appendChild(createEl("p", null, file));
  }

  else if (type === "photo") {
    const img = document.createElement("img");
    img.src = file;
    img.alt = file;
    body.appendChild(img);
  }

  else if (type === "shorts") {
    const video = document.createElement("video");
    video.src = file;
    video.controls = true;
    body.appendChild(video);
  }

  else if (type === "poll_original") {
    renderPollOriginal(post, body);
  }

  else if (type === "poll_quiz") {
    renderPollQuiz(post, body);
  }

  else {
    body.appendChild(createEl("p", null, "Unknown type: " + type));
  }

  return body;
}

// ===============================
// 🟩 Poll Original (Highlight + LocalStorage)
// ===============================
function renderPollOriginal(post, body) {
  const options = Array.isArray(post.options) ? post.options : [];
  const saved = localStorage.getItem(keyPoll(post.id));

  options.forEach(opt => {
    const btn = createEl("div", "poll-option", opt);

    if (saved === opt) btn.classList.add("selected");

    btn.onclick = () => {
      localStorage.setItem(keyPoll(post.id), opt);

      Array.from(body.children).forEach(c => c.classList.remove("selected"));

      btn.classList.add("selected");
    };

    body.appendChild(btn);
  });
}

// ===============================
// 🟩 Poll Quiz (Correct / Wrong)
// ===============================
function renderPollQuiz(post, body) {
  const options = Array.isArray(post.options) ? post.options : [];

  options.forEach(opt => {
    const btn = createEl("div", "poll-option", opt.text || "");

    btn.onclick = () => {
      Array.from(body.children).forEach(c => {
        c.classList.remove("correct");
        c.classList.remove("wrong");
      });

      if (opt.correct) btn.classList.add("correct");
      else btn.classList.add("wrong");
    };

    body.appendChild(btn);
  });
}

// Render post
function renderPost(post) {
  const box = createEl("article", "post", null);

  const body = renderBody(post);
  const subjectArea = renderSubject(post, body);

  box.appendChild(subjectArea);
  box.appendChild(body);

  return box;
}

// ===============================
// 🟩 Load posts.json (NEVER gets stuck)
// ===============================
function loadPosts() {
  setTextSafe(status, "در حال بارگذاری...");

  fetch("posts.json", { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("File not found");
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error("Invalid JSON");

      if (data.length === 0) {
        setTextSafe(status, "هیچ پستی منتشر نشده");
        return;
      }

      setTextSafe(status, "");
      data.forEach(post => {
        const box = renderPost(post);
        root.appendChild(box);
      });
    })
    .catch(err => {
      console.error(err);
      setTextSafe(status, "خطا در بارگذاری پست‌ها");
    });
}

// Start
document.addEventListener("DOMContentLoaded", loadPosts);
