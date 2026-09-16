const postsRoot = document.getElementById("posts-root");
const statusText = document.getElementById("status-text");
const filterButtons = document.querySelectorAll(".filter-btn");

let allPosts = [];
let pollVotes = {};

// فرض ساختار posts.json:
// [
//   {
//     "id": 1,
//     "type": "poll",
//     "subject": "Quiz",
//     "content": {
//       "question": "What is 2+2?",
//       "options": [
//         { "text": "3", "correct": false },
//         { "text": "4", "correct": true }
//       ]
//     }
//   }
// ]

function mapTypeLabel(type) {
  switch (type) {
    case "shorts":
      return "Shorts";
    case "short_news":
      return "Short news";
    case "photo":
      return "Photo";
    case "text":
      return "Text";
    case "poll":
      return "Poll (Quiz)";
    default:
      return "Unknown";
  }
}

function createCard(post) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.type = post.type;

  const header = document.createElement("div");
  header.className = "card-header";

  const typeEl = document.createElement("div");
  typeEl.className = "card-type";
  const pill = document.createElement("span");
  pill.className = "card-type-pill";
  pill.textContent = mapTypeLabel(post.type);
  typeEl.appendChild(pill);

  const idBadge = document.createElement("div");
  idBadge.className = "badge";
  idBadge.textContent = "ID: " + (post.id ?? "?");

  header.appendChild(typeEl);
  header.appendChild(idBadge);

  const subjectEl = document.createElement("div");
  subjectEl.className = "card-subject";
  subjectEl.textContent = post.subject || "(بدون subject)";

  const contentEl = document.createElement("div");
  contentEl.className = "card-content";

  if (post.type === "photo") {
    const imgInfo = document.createElement("div");
    imgInfo.textContent = "Photo file: " + (post.content || "no file");
    imgInfo.style.fontSize = "13px";
    imgInfo.style.color = "#8f9aa7";
    contentEl.appendChild(imgInfo);
  } else if (post.type === "shorts") {
    const p = document.createElement("p");
    p.textContent = post.content || "";
    contentEl.appendChild(p);
  } else if (post.type === "short_news") {
    const p = document.createElement("p");
    p.textContent = post.content || "";
    contentEl.appendChild(p);
  } else if (post.type === "text") {
    const p = document.createElement("p");
    p.textContent = post.content || "";
    contentEl.appendChild(p);
  } else if (post.type === "poll") {
    buildPoll(contentEl, post);
  } else {
    const p = document.createElement("p");
    p.textContent = String(post.content || "");
    contentEl.appendChild(p);
  }

  const footer = document.createElement("div");
  footer.className = "card-footer";
  const left = document.createElement("div");
  left.textContent = "Subject only · no admin · no create post";
  const right = document.createElement("div");
  right.textContent = "Type: " + mapTypeLabel(post.type);
  footer.appendChild(left);
  footer.appendChild(right);

  card.appendChild(header);
  card.appendChild(subjectEl);
  card.appendChild(contentEl);
  card.appendChild(footer);

  return card;
}

function buildPoll(container, post) {
  const pollData = post.content || {};
  const question = pollData.question || "Poll question";
  const options = Array.isArray(pollData.options) ? pollData.options : [];

  const pollWrapper = document.createElement("div");
  pollWrapper.className = "poll-container";

  const qEl = document.createElement("div");
  qEl.className = "poll-question";
  qEl.textContent = question;
  pollWrapper.appendChild(qEl);

  const optionsEl = document.createElement("div");
  optionsEl.className = "poll-options";

  const pollKey = "poll_" + (post.id ?? Math.random().toString(36).slice(2));
  if (!pollVotes[pollKey]) {
    pollVotes[pollKey] = {
      total: 0,
      counts: options.map(() => 0)
    };
  }

  options.forEach((opt, index) => {
    const optRow = document.createElement("label");
    optRow.className = "poll-option";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = pollKey;
    radio.value = String(index);

    const text = document.createElement("div");
    text.className = "poll-option-text";
    text.textContent = opt.text || "Option";

    const meta = document.createElement("div");
    meta.className = "poll-option-meta";
    meta.textContent = "0%";

    const barWrapper = document.createElement("div");
    barWrapper.className = "poll-bar-wrapper";
    const bar = document.createElement("div");
    bar.className = "poll-bar";
    barWrapper.appendChild(bar);

    optRow.appendChild(radio);
    optRow.appendChild(text);
    optRow.appendChild(meta);
    optRow.appendChild(barWrapper);

    optionsEl.appendChild(optRow);
  });

  pollWrapper.appendChild(optionsEl);

  const actions = document.createElement("div");
  actions.className = "poll-actions";

  const resultText = document.createElement("div");
  resultText.className = "poll-result";
  resultText.textContent = "یک گزینه را انتخاب کن و روی Check بزن.";

  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "poll-btn";
  checkBtn.textContent = "Check";

  checkBtn.addEventListener("click", () => {
    const selected = document.querySelector("input[name='" + pollKey + "']:checked");
    if (!selected) {
      resultText.className = "poll-result wrong";
      resultText.textContent = "هیچ گزینه‌ای انتخاب نشده.";
      return;
    }

    const index = parseInt(selected.value, 10);
    const chosen = options[index];
    const isCorrect = !!(chosen && chosen.correct);

    const stats = pollVotes[pollKey];
    stats.total += 1;
    stats.counts[index] += 1;

    const optRows = optionsEl.querySelectorAll(".poll-option");
    optRows.forEach((row, i) => {
      const meta = row.querySelector(".poll-option-meta");
      const bar = row.querySelector(".poll-bar");
      const count = stats.counts[i];
      const total = stats.total || 1;
      const percent = Math.round((count / total) * 100);
      meta.textContent = percent + "%";
      bar.style.width = percent + "%";
    });

    if (isCorrect) {
      resultText.className = "poll-result correct";
      resultText.textContent = "درست ✅";
    } else {
      resultText.className = "poll-result wrong";
      resultText.textContent = "غلط ❌";
    }
  });

  actions.appendChild(resultText);
  actions.appendChild(checkBtn);

  pollWrapper.appendChild(actions);
  container.appendChild(pollWrapper);
}

function renderPosts(filterType) {
  postsRoot.innerHTML = "";

  let visible = allPosts;
  if (filterType && filterType !== "all") {
    visible = allPosts.filter(p => p.type === filterType);
  }

  if (!visible || visible.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-message";
    empty.textContent = "nothing realeased yet";
    const sub = document.createElement("span");
    sub.textContent = "posts.json خالی است یا چیزی با این فیلتر پیدا نشد.";
    empty.appendChild(document.createElement("br"));
    empty.appendChild(sub);
    postsRoot.appendChild(empty);
    statusText.textContent = "هیچ پستی منتشر نشده است.";
    return;
  }

  visible.forEach(post => {
    const card = createCard(post);
    postsRoot.appendChild(card);
  });

  statusText.textContent = "Loaded " + visible.length + " post(s) from posts.json.";
}

function setFilterButtons(activeType) {
  filterButtons.forEach(btn => {
    const type = btn.dataset.filter;
    if (type === activeType) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.filter;
    setFilterButtons(type);
    renderPosts(type);
  });
});

function showLoading() {
  postsRoot.innerHTML = "";
  const loading = document.createElement("div");
  loading.className = "loading";
  loading.innerHTML = "در حال خواندن posts.json<span class='loading-dot'></span>";
  postsRoot.appendChild(loading);
  statusText.textContent = "در حال بارگذاری...";
}

function loadPosts() {
  showLoading();
  fetch("posts.json", { cache: "no-store" })
    .then(res => {
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        allPosts = [];
      } else {
        allPosts = data;
      }
      renderPosts("all");
    })
    .catch(err => {
      console.error("Error loading posts.json:", err);
      allPosts = [];
      renderPosts("all");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPosts();
});
