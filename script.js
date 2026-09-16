// ===============================
// Barmaan Vebs - Guaranteed SEE Button Version
// ===============================

// DOM
const root = document.getElementById("root");
const status = document.getElementById("status");

// Create element helper
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

// LocalStorage keys
function unlockKey(id) {
  return "unlock_" + id;
}
function pollKey(id) {
  return "poll_" + id;
}

// Check unlock
function isUnlocked(post) {
  return localStorage.getItem(unlockKey(post.id)) === "true";
}
function setUnlocked(post) {
  localStorage.setItem(unlockKey(post.id), "true");
}

// Ask for code
function askCode(post, subjectBox, bodyBox) {
  const user = prompt("Enter the code inside the posts.json");
  if (user == null) return;

  if (String(user).trim() === String(post.code).trim()) {
    setUnlocked(post);
    showSubject(post, subjectBox, bodyBox);
  } else {
    alert("Wrong code.");
  }
}

// Show subject + body
function showSubject(post, subjectBox, bodyBox) {
  subjectBox.innerHTML = "";
  bodyBox.style.display = "block";

  const title = el("h2", "post-title", post.file);
  subjectBox.appendChild(title);
}

// Render locked subject
function renderLocked(post, subjectBox, bodyBox) {
  subjectBox.innerHTML = "";
  bodyBox.style.display = "none";

  const btn = el("button", "see-button", "See");
  btn.onclick = () => askCode(post, subjectBox, bodyBox);

  subjectBox.appendChild(btn);
}

// Render subject area
function renderSubject(post, bodyBox) {
  const subjectBox = el("div", "subject-container");

  if (isUnlocked(post)) {
    showSubject(post, subjectBox, bodyBox);
  } else {
    renderLocked(post, subjectBox, bodyBox);
  }

  return subjectBox;
}

// Render body
function renderBody(post) {
  const body = el("div", "post-body");

  if (post.type === "text") {
    body.appendChild(el("p", null, post.file));
  }

  else if (post.type === "photo") {
    const img = document.createElement("img");
    img.src = post.file;
    body.appendChild(img);
  }

  else if (post.type === "shorts") {
    const video = document.createElement("video");
    video.src = post.file;
    video.controls = true;
    body.appendChild(video);
  }

  else if (post.type === "poll_original") {
    renderPollOriginal(post, body);
  }

  else if (post.type === "poll_quiz") {
    renderPollQuiz(post, body);
  }

  return body;
}

// ===============================
// Poll Original (Highlight + Save)
// ===============================
function renderPollOriginal(post, body) {
  const saved = localStorage.getItem(pollKey(post.id));
  const options = post.options || [];

  options.forEach(opt => {
    const btn = el("div", "poll-option", opt);

    if (saved === opt) btn.classList.add("selected");

    btn.onclick = () => {
      localStorage.setItem(pollKey(post.id), opt);

      Array.from(body.children).forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
    };

    body.appendChild(btn);
  });
}

// ===============================
// Poll Quiz
// ===============================
function renderPollQuiz(post, body) {
  const options = post.options || [];

  options.forEach(opt => {
    const btn = el("div", "poll-option", opt.text);

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
  const box = el("article", "post");

  const body = renderBody(post);
  const subject = renderSubject(post, body);

  box.appendChild(subject);
  box.appendChild(body);

  return box;
}

// ===============================
// Load posts.json (NEVER gets stuck)
// ===============================
function loadPosts() {
  status.textContent = "در حال بارگذاری...";

  fetch("posts.json", { cache: "no-store" })
    .then(r => {
      if (!r.ok) throw new Error("File missing");
      return r.json();
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error("Invalid JSON");

      status.textContent = "";

      data.forEach(post => {
        root.appendChild(renderPost(post));
      });
    })
    .catch(err => {
      console.error(err);
      status.textContent = "خطا در بارگذاری پست‌ها";
    });
}

document.addEventListener("DOMContentLoaded", loadPosts);
