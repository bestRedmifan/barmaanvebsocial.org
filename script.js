// ===============================
// Barmaan Vebs - Anti-Lag Lock System
// ===============================

// DOM
const root = document.getElementById("root");
const status = document.getElementById("status");

// Helper
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

// Ask for code
function askCode(post, subjectBox, bodyBox) {
  const user = prompt("Enter the code inside the posts.json");
  if (user == null) return;

  if (String(user).trim() === String(post.code).trim()) {
    showSubject(post, subjectBox, bodyBox);
  } else {
    alert("Wrong code.");
    renderLocked(post, subjectBox, bodyBox);
  }
}

// ===============================
// Subject (Unlocked)
// ===============================
function showSubject(post, subjectBox, bodyBox) {
  subjectBox.innerHTML = "";
  bodyBox.style.display = "block";

  const title = el("h2", "post-title", post.caption || post.file);
  subjectBox.appendChild(title);
}

// ===============================
// Subject (Locked)
// ===============================
function renderLocked(post, subjectBox, bodyBox) {
  subjectBox.innerHTML = "";
  bodyBox.style.display = "none";

  const btn = el("button", "see-button", "See");
  btn.onclick = () => askCode(post, subjectBox, bodyBox);

  subjectBox.appendChild(btn);
}

// ===============================
// Subject Renderer (Always Locked First)
// ===============================
function renderSubject(post, bodyBox) {
  const subjectBox = el("div", "subject-container");
  renderLocked(post, subjectBox, bodyBox);
  return subjectBox;
}

// ===============================
// Body Renderer
// ===============================
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

  return body;
}

// ===============================
// Poll Original (Highlight + Save)
// ===============================
function renderPollOriginal(post, body) {
  const saved = localStorage.getItem("poll_" + post.id);
  const options = post.options || [];

  options.forEach(opt => {
    const btn = el("div", "poll-option", opt);

    if (saved === opt) btn.classList.add("selected");

    btn.onclick = () => {
      localStorage.setItem("poll_" + post.id, opt);

      Array.from(body.children).forEach(c => c.classList.remove("selected"));
      btn.classList.add("selected");
    };

    body.appendChild(btn);
  });
}

// ===============================
// Render Post
// ===============================
function renderPost(post) {
  const box = el("article", "post");

  const body = renderBody(post);      // اول body ساخته می‌شود
  const subject = renderSubject(post, body); // بعد subject ساخته می‌شود

  box.appendChild(subject);
  box.appendChild(body);

  return box;
}

// ===============================
// Load posts.json (No Cache)
// ===============================
function loadPosts() {
  status.textContent = "در حال بارگذاری...";

  fetch("posts.json", { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      status.textContent = "";
      data.forEach(post => root.appendChild(renderPost(post)));
    })
    .catch(err => {
      console.error(err);
      status.textContent = "خطا در بارگذاری پست‌ها";
    });
}

document.addEventListener("DOMContentLoaded", loadPosts);
