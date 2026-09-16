// ===============================
// Barmaan Vebs - Locked Subject Engine (Fixed Version)
// ضد گیر کردن روی "در حال بارگذاری"
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
function getUnlockKey(id) {
  return "unlock_" + id;
}
function getPollKey(id) {
  return "poll_" + id;
}

// Unlock check
function isPostUnlocked(post) {
  const key = getUnlockKey(post.id);
  return localStorage.getItem(key) === "true";
}
function setPostUnlocked(post) {
  const key = getUnlockKey(post.id);
  localStorage.setItem(key, "true");
}

// Ask for code
function askForCode(post, subjectContainer) {
  const userCode = prompt("Enter the code inside the posts.json");
  if (userCode == null) return;

  const trimmed = String(userCode).trim();
  const real = String(post.code || "").trim();

  if (trimmed === real && real.length > 0) {
    setPostUnlocked(post);
    revealSubject(post, subjectContainer);
  } else {
    alert("Wrong code.");
  }
}

// Reveal subject
function revealSubject(post, subjectContainer) {
  subjectContainer.innerHTML = "";
  const caption = post.caption || "";
  const subjectEl = createEl("h2", "post-title", caption);
  subjectContainer.appendChild(subjectEl);
}

// Locked subject
function renderLockedSubject(post, subjectContainer) {
  subjectContainer.innerHTML = "";
  const btn = createEl("button", "see-button", "See");
  btn.onclick = () => askForCode(post, subjectContainer);
  subjectContainer.appendChild(btn);
}

// Subject area
function renderSubjectArea(post) {
  const subjectContainer = createEl("div", "subject-container", null);
  if (isPostUnlocked(post)) {
    revealSubject(post, subjectContainer);
  } else {
    renderLockedSubject(post, subjectContainer);
  }
  return subjectContainer;
}

// Render body by type
function renderBody(post) {
  const body = createEl("div", "post-body", null);
  const type = post.type || "";
  const caption = post.caption || "";
  const file = post.file || "";

  if (type === "text") {
    body.appendChild(createEl("p", null, caption || file));
  }

  else if (type === "short_news") {
    body.appendChild(createEl("p", "short-news", caption || file));
  }

  else if (type === "photo") {
    const img = document.createElement("img");
    img.src = file;
    img.alt = caption;
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

// Poll original
function renderPollOriginal(post, body) {
  const options = Array.isArray(post.options) ? post.options : [];
  const saved = localStorage.getItem(getPollKey(post.id));

  options.forEach(opt => {
    const btn = createEl("div", "poll-option", opt);
    if (saved === opt) btn.classList.add("selected");

    btn.onclick = () => {
      localStorage.setItem(getPollKey(post.id), opt);
      Array.from(body.children).forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
    };

    body.appendChild(btn);
  });
}

// Poll quiz
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
  box.appendChild(renderSubjectArea(post));
  box.appendChild(renderBody(post));
  return box;
}

// Load posts.json (FIXED)
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
