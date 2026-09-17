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
// Subject Renderer
// Supports password + no password
// ===============================
function renderSubject(post, bodyBox) {
  const subjectBox = el("div", "subject-container");

  if (post.blocked === true) {
    showSubject(post, subjectBox, bodyBox);
  } else if (post.code !== undefined && String(post.code).trim() !== "") {
    renderLocked(post, subjectBox, bodyBox);
  } else {
    showSubject(post, subjectBox, bodyBox);
  }

  return subjectBox;
}

// ===============================
// Body Renderer
// ===============================
function renderBody(post) {
  const body = el("div", "post-body");

  if (post.blocked === true) {
    body.appendChild(
      el("div", "blocked-content", "blocked")
    );
    return body;
  }

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
  const saved = localStorage.getItem("poll_" + post.id);
  const options = post.options || [];

  options.forEach(opt => {
    const btn = el("div", "poll-option", opt);

    if (saved === opt) {
      btn.classList.add("selected");
    }

    btn.onclick = () => {
      localStorage.setItem("poll_" + post.id, opt);

      Array.from(body.children).forEach(c => {
        c.classList.remove("selected");
      });

      btn.classList.add("selected");
    };

    body.appendChild(btn);
  });
}

// ===============================
// Poll Quiz
// ===============================
function renderPollQuiz(post, body) {
  const options = Array.isArray(post.options)
    ? post.options
    : [];

  const correctAnswer = String(
    post.correctAnswer ?? ""
  ).trim();

  const saved = localStorage.getItem(
    "quiz_" + post.id
  );

  options.forEach(opt => {
    const option = String(opt);

    const btn = el(
      "div",
      "poll-option",
      option
    );

    // Restore saved answer
    if (saved === option) {
      btn.classList.add("selected");

      if (option.trim() === correctAnswer) {
        btn.classList.add("correct");
      } else {
        btn.classList.add("wrong");
      }
    }

    btn.onclick = () => {
      // Save selected answer
      localStorage.setItem(
        "quiz_" + post.id,
        option
      );

      // Remove previous selection and result
      Array.from(body.children).forEach(child => {
        child.classList.remove("selected");
        child.classList.remove("correct");
        child.classList.remove("wrong");

        if (
          child.classList.contains("quiz-result")
        ) {
          child.remove();
        }
      });

      // Keep the normal highlight
      btn.classList.add("selected");

      // Check answer
      const isCorrect =
        option.trim() === correctAnswer;

      if (isCorrect) {
        btn.classList.add("correct");
      } else {
        btn.classList.add("wrong");
      }

      // Result text
      const resultText = isCorrect
        ? "درست! ✓"
        : "غلط! ✗";

      const result = el(
        "div",
        "quiz-result",
        resultText
      );

      // Add result
      body.appendChild(result);
    };

    body.appendChild(btn);
  });

  // Restore saved result after refresh
  if (saved !== null) {
    const isCorrect =
      String(saved).trim() === correctAnswer;

    const resultText = isCorrect
      ? "درست! ✓"
      : "غلط! ✗";

    const result = el(
      "div",
      "quiz-result",
      resultText
    );

    body.appendChild(result);
  }
}

// ===============================
// Like Storage
// ===============================
function getLikeKey(post) {
  return "like_" + String(post.id);
}

// ===============================
// Read Like State
// ===============================
function getLikeState(post) {
  return localStorage.getItem(
    getLikeKey(post)
  ) === "true";
}

// ===============================
// Save Like State
// ===============================
function saveLikeState(post, state) {
  localStorage.setItem(
    getLikeKey(post),
    state ? "true" : "false"
  );
}

// ===============================
// Heart Renderer
// ===============================
function renderHeart(post) {
  const button = el(
    "button",
    "heart-button",
    "♡"
  );

  const liked = getLikeState(post);

  if (liked) {
    button.classList.add("liked");
    button.textContent = "♥";
  }

  button.setAttribute(
    "aria-label",
    liked ? "Unlike" : "Like"
  );

  button.onclick = () => {
    const current = getLikeState(post);
    const next = !current;

    saveLikeState(post, next);

    if (next) {
      button.classList.add("liked");
      button.textContent = "♥";
      button.setAttribute("aria-label", "Unlike");
    } else {
      button.classList.remove("liked");
      button.textContent = "♡";
      button.setAttribute("aria-label", "Like");
    }
  };

  return button;
}

// ===============================
// Comment Text Helper
// ===============================
function getCommentText(comment) {
  if (typeof comment === "string") {
    return comment;
  }

  if (
    comment &&
    typeof comment === "object"
  ) {
    if (comment.text !== undefined) {
      return String(comment.text);
    }

    if (comment.comment !== undefined) {
      return String(comment.comment);
    }

    if (comment.caption !== undefined) {
      return String(comment.caption);
    }
  }

  return "";
}

// ===============================
// Comments Renderer
// ===============================
function renderComments(post, box) {
  const old = box.querySelector(
    ".comments-panel"
  );

  if (old) {
    old.remove();
    return;
  }

  const panel = el(
    "div",
    "comments-panel"
  );

  const title = el(
    "div",
    "comments-title",
    "Comments"
  );

  panel.appendChild(title);

  const comments = Array.isArray(post.comments)
    ? post.comments
    : [];

  if (comments.length === 0) {
    panel.appendChild(
      el(
        "div",
        "no-comments",
        "No comments."
      )
    );
  } else {
    comments.forEach(comment => {
      const text = getCommentText(comment);

      if (text.trim() === "") return;

      const item = el(
        "div",
        "comment-item",
        text
      );

      panel.appendChild(item);
    });
  }

  box.appendChild(panel);
}

// ===============================
// Comments Button
// ===============================
function renderCommentButton(post, box) {
  const button = el(
    "button",
    "comment-button",
    "C"
  );

  button.setAttribute(
    "aria-label",
    "Comments"
  );

  button.onclick = () => {
    renderComments(post, box);
  };

  return button;
}

// ===============================
// Social Controls
// ===============================
function renderSocialControls(post) {
  const controls = el(
    "div",
    "social-controls"
  );

  const heart = renderHeart(post);
  const comments = renderCommentButton(
    post,
    controls
  );

  controls.appendChild(heart);
  controls.appendChild(comments);

  return controls;
}

// ===============================
// Render Post
// ===============================
function renderPost(post) {
  const box = el("article", "post");

  const body = renderBody(post);
  const subject = renderSubject(post, body);

  box.appendChild(subject);
  box.appendChild(body);

  // New social controls
  const social = renderSocialControls(post);
  box.appendChild(social);

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

      data.forEach(post =>
        root.appendChild(
          renderPost(post)
        )
      );
    })
    .catch(err => {
      console.error(err);
      status.textContent =
        "خطا در بارگذاری پست‌ها";
    });
}

document.addEventListener(
  "DOMContentLoaded",
  loadPosts
);

// ===============================
// Extra Safe Storage Helpers
// ===============================
function hasLocalStorage() {
  try {
    const test = "__barmaan_test__";
    localStorage.setItem(test, "1");
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

// ===============================
// Safe Like State
// ===============================
function getSafeLikeState(post) {
  if (!hasLocalStorage()) {
    return false;
  }

  return getLikeState(post);
}

// ===============================
// Safe Save Like
// ===============================
function safeSaveLikeState(post, state) {
  if (!hasLocalStorage()) {
    return;
  }

  saveLikeState(post, state);
}

// ===============================
// End of Main Logic
// ===============================
// ===============================
// Blocked content support
// ===============================
// blocked is handled before normal body rendering.
// Social controls remain available for blocked posts.
// Password-locked posts remain supported.
// Normal posts keep their existing behavior.
// Poll Original remains unchanged.
// Poll Quiz remains unchanged.
// Like storage remains unchanged.
// Comment rendering remains unchanged.
// posts.json remains the content source.
// No media is created for blocked posts.
// Blocked state is controlled by posts.json.
// blocked must be true to activate this state.
// false or missing blocked keeps normal rendering.
// Existing code locking still works when needed.
// Existing subject rendering remains supported.
// Existing social controls are always rendered.
// End of blocked support.
// ===============================
