const root = document.getElementById("root");
const status = document.getElementById("status");
const SAVED_KEY = "barmaan_saved_subjects";
const LIKE_KEY = "barmaan_likes";
const COMMENT_KEY = "barmaan_comments";
const POLL_KEY = "barmaan_polls";
const CODE_KEY = "barmaan_unlocked_subjects";
const LOAD_TIMEOUT = 12000;
const RENDER_BATCH_SIZE = 8;
let loadingLock = false;
let loadToken = 0;
let savedPanelOpen = false;
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}
function safeGet(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) ?? fallback);
  } catch (error) { return fallback; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (error) { return false; }
}
function getPostKey(post) {
  if (!post) return "";
  if (post.id !== undefined && post.id !== null) return String(post.id);
  if (post.file !== undefined && post.file !== null) return String(post.file);
  if (post.subject !== undefined && post.subject !== null) return String(post.subject);
  return "";
}
function getSubject(post) { return String(post.subject ?? post.title ?? post.name ?? "Untitled"); }
function isBlocked(post) { return Boolean(post && (post.blocked === true || post.blocked === "true")); }
function hasCode(post) { return Boolean(post && post.password); }
function getUnlocked() {
  const data = safeGet(CODE_KEY, []);
  return Array.isArray(data) ? data : [];
}
function isUnlocked(post) {
  return getUnlocked().includes(getPostKey(post));
}
function setUnlocked(post) {
  const list = getUnlocked(); const key = getPostKey(post);
  if (!list.includes(key)) list.push(key); safeSet(CODE_KEY, list);
}
function askPostCode(post) {
  if (!hasCode(post) || isUnlocked(post)) return true;
  const entered = window.prompt("رمز این محتوا را وارد کنید:");
  if (entered === null) return false;
  if (String(entered) === String(post.password)) {
    setUnlocked(post);
    return true;
  }
  window.alert("رمز اشتباه است.");
  return false;
}
function getSavedSubjects() {
  const data = safeGet(SAVED_KEY, []);
  return Array.isArray(data) ? data : [];
}
function saveSavedSubjects(list) {
  safeSet(SAVED_KEY, Array.isArray(list) ? list : []);
}
function isSaved(post) {
  return getSavedSubjects().includes(getPostKey(post));
}
function setSaved(post, value) {
  const key = getPostKey(post);
  const list = getSavedSubjects();
  const index = list.indexOf(key);
  if (value && index === -1) list.push(key);
  if (!value && index !== -1) list.splice(index, 1);
  saveSavedSubjects(list);
}
function updateSaveButtonAppearance(button, saved) {
  button.classList.toggle("saved", saved);
  button.setAttribute("aria-pressed", String(saved));
  button.title = saved ? "حذف از Saved Subjects" : "ذخیره در Saved Subjects";
  if (saved) {
    button.style.background = "#ffd400";
    button.style.color = "#000";
  } else {
    button.style.background = "";
    button.style.color = "";
  }
}
function renderSaveButton(post) {
  const button = el("button", "s-button", "S");
  button.type = "button";
  updateSaveButtonAppearance(button, isSaved(post));
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    const next = !isSaved(post);
    setSaved(post, next);
    updateSaveButtonAppearance(button, next);
    if (savedPanelOpen) refreshSavedSubjectsPanel();
  });
  return button;
}
function getLikes() {
  const data = safeGet(LIKE_KEY, {});
  return data && typeof data === "object" ? data : {};
}
function isLiked(post) {
  return Boolean(getLikes()[getPostKey(post)]);
}
function toggleLike(post) {
  const data = getLikes();
  const key = getPostKey(post);
  data[key] = !Boolean(data[key]);
  safeSet(LIKE_KEY, data);
  return Boolean(data[key]);
}
function getComments() {
  const data = safeGet(COMMENT_KEY, {});
  return data && typeof data === "object" ? data : {};
}
function getPostComments(post) {
  const data = getComments();
  return Array.isArray(data[getPostKey(post)]) ? data[getPostKey(post)] : [];
}
function addComment(post, text) {
  const value = String(text || "").trim();
  if (!value) return;
  const data = getComments();
  const key = getPostKey(post);
  if (!Array.isArray(data[key])) data[key] = [];
  data[key].push({ text: value, time: Date.now() });
  safeSet(COMMENT_KEY, data);
}
function getPollAnswers() {
  const data = safeGet(POLL_KEY, {});
  return data && typeof data === "object" ? data : {};
}
function getPollAnswer(post) {
  return getPollAnswers()[getPostKey(post)];
}
function setPollAnswer(post, answer) {
  const data = getPollAnswers();
  data[getPostKey(post)] = answer;
  safeSet(POLL_KEY, data);
}
function waitForFrame() {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(resolve);
    else setTimeout(resolve, 0);
  });
}
function makeText(text) {
  const p = el("p");
  p.textContent = text === undefined ? "" : String(text);
  return p;
}
function makeImage(src, alt) {
  const image = document.createElement("img");
  image.src = String(src || "");
  image.alt = String(alt || "");
  image.loading = "lazy";
  image.decoding = "async";
  return image;
}
function makeVideo(src) {
  const video = document.createElement("video");
  video.src = String(src || "");
  video.controls = true;
  video.preload = "metadata";
  return video;
}
function makeDownload(post) {
  const link = el("a", "see-button", "Download");
  link.href = String(post.url || post.file || post.src || "");
  link.download = "";
  link.target = "_blank";
  link.rel = "noopener";
  return link;
}
function renderBlocked() {
  const box = el("div", "post-body");
  box.appendChild(makeText("🚫 این محتوا مسدود شده است."));
  return box;
}
function renderProtected(post) {
  const box = el("div", "post-body");
  box.appendChild(makeText("🔒 این محتوا با رمز محافظت شده است."));
  const button = el("button", "see-button", "See");
  button.type = "button";
  button.addEventListener("click", () => {
    if (askPostCode(post)) box.replaceWith(renderBody(post));
  });
  box.appendChild(button);
  return box;
}
function renderPollOriginal(post) {
  const box = el("div", "post-body");
  const options = Array.isArray(post.options) ? post.options : [];
  const selected = getPollAnswer(post);
  options.forEach((option, index) => {
    const button = el("div", "poll-option", String(option));
    if (selected === index) button.classList.add("selected");
    button.addEventListener("click", () => {
      setPollAnswer(post, index);
      box.querySelectorAll(".poll-option").forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
    });
    box.appendChild(button);
  });
  return box;
}
function renderPollQuiz(post) {
  const box = el("div", "post-body");
  const options = Array.isArray(post.options) ? post.options : [];
  const correct = Number(post.correct);
  const answer = getPollAnswer(post);
  const result = el("div", "quiz-result");
  options.forEach((option, index) => {
    const button = el("div", "poll-option", String(option));
    if (answer !== undefined) {
      if (index === correct) button.classList.add("correct");
      else if (index === Number(answer)) button.classList.add("wrong");
    }
    button.addEventListener("click", () => {
      if (getPollAnswer(post) !== undefined) return;
      setPollAnswer(post, index);
      box.querySelectorAll(".poll-option").forEach((item, itemIndex) => {
        item.classList.remove("correct", "wrong");
        if (itemIndex === correct) item.classList.add("correct");
        else if (itemIndex === index) item.classList.add("wrong");
      });
      result.textContent = index === correct ? "✅ درست!" : "❌ اشتباه!";
    });
    box.appendChild(button);
  });
  if (answer !== undefined) result.textContent = Number(answer) === correct ? "✅ درست!" : "❌ اشتباه!";
  box.appendChild(result);
  return box;
}
function renderBody(post) {
  if (isBlocked(post)) return renderBlocked();
  if (hasCode(post) && !isUnlocked(post)) return renderProtected(post);
  const box = el("div", "post-body");
  const type = String(post.type || "text").toLowerCase();
  if (type === "photo" || type === "image") {
    const sources = Array.isArray(post.images)
      ? post.images
      : [post.image || post.src || post.url];
    sources.filter(Boolean).forEach(src => box.appendChild(makeImage(src, getSubject(post))));
  } else if (type === "photos") {
    const sources = Array.isArray(post.images) ? post.images : [];
    sources.forEach(src => box.appendChild(makeImage(src, getSubject(post))));
  } else if (type === "shorts" || type === "video") {
    box.appendChild(makeVideo(post.video || post.src || post.url));
  } else if (type === "file" || type === "download") {
    box.appendChild(makeDownload(post));
  } else if (type === "poll_original") {
    return renderPollOriginal(post);
  } else if (type === "poll_quiz") {
    return renderPollQuiz(post);
  } else {
    box.appendChild(makeText(post.text || post.content || ""));
  }
  return box;
}
function renderComments(post) {
  const panel = el("div", "comments-panel");
  panel.appendChild(el("div", "comments-title", "Comments"));
  const list = getPostComments(post);
  if (!list.length) {
    panel.appendChild(el("div", "no-comments", "No comments yet."));
  } else {
    list.forEach(comment => {
      panel.appendChild(el("div", "comment-item", String(comment.text || "")));
    });
  }
  return panel;
}
function renderSocialControls(post, card) {
  const controls = el("div", "social-controls");
  const heart = el("button", "heart-button");
  heart.type = "button";
  heart.setAttribute("aria-label", "Like");
  const refreshHeart = () => {
    const liked = isLiked(post);
    heart.textContent = liked ? "♥" : "♡";
    heart.classList.toggle("liked", liked);
  };
  refreshHeart();
  heart.addEventListener("click", () => {
    toggleLike(post);
    refreshHeart();
  });
  const commentButton = el("button", "comment-button", "C");
  commentButton.type = "button";
  let commentsVisible = false;
  let commentsPanel = null;
  commentButton.addEventListener("click", () => {
    commentsVisible = !commentsVisible;
    if (commentsVisible) {
      commentsPanel = renderComments(post);
      card.appendChild(commentsPanel);
    } else if (commentsPanel) {
      commentsPanel.remove();
      commentsPanel = null;
    }
  });
  const saveButton = renderSaveButton(post);
  controls.appendChild(heart);
  controls.appendChild(commentButton);
  controls.appendChild(saveButton);
  const input = el("input");
  input.type = "text";
  input.placeholder = "Comment...";
  input.maxLength = 500;
  const send = el("button", "comment-button", "↑");
  send.type = "button";
  send.addEventListener("click", () => {
    addComment(post, input.value);
    input.value = "";
    if (commentsVisible && commentsPanel) {
      const replacement = renderComments(post);
      commentsPanel.replaceWith(replacement);
      commentsPanel = replacement;
    }
  });
  controls.appendChild(input);
  controls.appendChild(send);
  return controls;
}
function renderPost(post) {
  const card = el("article", "post");
  card.dataset.postKey = getPostKey(post);
  card.appendChild(el("h3", "post-title", getSubject(post)));
  const subject = el("div", "subject-container");
  subject.appendChild(renderBody(post));
  card.appendChild(subject);
  card.appendChild(renderSocialControls(post, card));
  return card;
}
function normalizePosts(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.posts)) return data.posts;
  return [];
}
function getSavedPostList() {
  const saved = getSavedSubjects();
  return (Array.isArray(window.barmaanPosts) ? window.barmaanPosts : []).filter(post => saved.includes(getPostKey(post)));
}
function createSavedPanel() {
  const panel = el("section", "saved-subjects-panel");
  panel.id = "saved-subjects-panel";
  return panel;
}
function refreshSavedSubjectsPanel() {
  const old = document.getElementById("saved-subjects-panel");
  if (!old) return;
  const panel = createSavedPanel();
  panel.appendChild(el("h2", "post-title", "Saved Subjects"));
  const posts = getSavedPostList();
  if (!posts.length) {
    panel.appendChild(el("div", "no-comments", "No saved subjects."));
  } else {
    posts.forEach(post => {
      const row = el("div", "post");
      row.appendChild(el("h3", "post-title", getSubject(post)));
      const remove = el("button", "s-button", "S");
      remove.type = "button";
      updateSaveButtonAppearance(remove, true);
      remove.addEventListener("click", () => {
        setSaved(post, false);
        refreshSavedSubjectsPanel();
      });
      const see = el("button", "see-button", "See");
      see.type = "button";
      see.addEventListener("click", () => {
        if (!askPostCode(post)) return;
        const body = renderBody(post);
        const oldBody = row.querySelector(".post-body");
        if (oldBody) oldBody.replaceWith(body);
        else row.appendChild(body);
      });
      row.appendChild(remove);
      row.appendChild(see);
      panel.appendChild(row);
    });
  }
  old.replaceWith(panel);
}
function showSavedSubjects() {
  savedPanelOpen = true;
  let panel = document.getElementById("saved-subjects-panel");
  if (panel) {
    refreshSavedSubjectsPanel();
    return;
  }
  panel = createSavedPanel();
  root.prepend(panel);
  refreshSavedSubjectsPanel();
}
function hideSavedSubjects() {
  savedPanelOpen = false;
  const panel = document.getElementById("saved-subjects-panel");
  if (panel) panel.remove();
}
function installSavedButton() {
  const old = document.getElementById("saved-subjects-button");
  if (old) old.remove();
  const button = el("button", "see-button", "Saved Subjects");
  button.id = "saved-subjects-button";
  button.type = "button";
  button.addEventListener("click", () => {
    if (savedPanelOpen) hideSavedSubjects();
    else showSavedSubjects();
  });
  if (root && root.parentNode) root.parentNode.insertBefore(button, root);
}
function setStatus(message) {
  if (status) status.textContent = String(message || "");
}
function fetchPostsWithTimeout() {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LOAD_TIMEOUT);
    fetch("posts.json", {
      cache: "no-store",
      signal: controller.signal
    })
      .then(response => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(data => {
        clearTimeout(timer);
        resolve(normalizePosts(data));
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
async function renderPostsInChunks(posts, token) {
  if (!root) throw new Error("Root element not found.");
  root.innerHTML = "";
  if (!posts.length) {
    setStatus("هیچ پستی پیدا نشد.");
    return;
  }
  for (let start = 0; start < posts.length; start += RENDER_BATCH_SIZE) {
    if (token !== loadToken) return;
    const fragment = document.createDocumentFragment();
    const end = Math.min(start + RENDER_BATCH_SIZE, posts.length);
    for (let index = start; index < end; index++) {
      fragment.appendChild(renderPost(posts[index]));
    }
    root.appendChild(fragment);
    setStatus("در حال نمایش پست‌ها... " + end + " / " + posts.length);
    await waitForFrame();
  }
  setStatus("");
}
async function loadPosts() {
  if (loadingLock) return;
  loadingLock = true;
  const token = ++loadToken;
  setStatus("در حال بارگذاری...");
  try {
    const posts = await fetchPostsWithTimeout();
    if (token !== loadToken) return;
    window.barmaanPosts = posts;
    await renderPostsInChunks(posts, token);
    if (token === loadToken) installSavedButton();
  } catch (error) {
    if (token !== loadToken) return;
    root.innerHTML = "";
    const box = el("div", "post");
    const message = error && error.name === "AbortError"
      ? "⏱️ بارگذاری بیشتر از حد مجاز طول کشید."
      : "❌ خطا در بارگذاری posts.json.";
    box.appendChild(makeText(message));
    const retry = el("button", "see-button", "Retry");
    retry.type = "button";
    retry.addEventListener("click", loadPosts);
    box.appendChild(retry);
    root.appendChild(box);
    setStatus("بارگذاری انجام نشد.");
  } finally {
    if (token === loadToken) loadingLock = false;
  }
}
function startBarmaanVebs() {
  if (!root) return;
  loadPosts();
}
document.addEventListener("DOMContentLoaded", startBarmaanVebs, { once: true });
window.barmaanReloadPosts = loadPosts;
// End of Barmaan Vebs Anti-Lag Lock System.
