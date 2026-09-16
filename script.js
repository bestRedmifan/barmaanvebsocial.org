/* Barmaan Social Media - frontend only */

const TZ =
  3.5 * 60 * 60 * 1000;

const KEY =
  "barmaan_social_v1";

const LIMIT = {
  Short: 5,
  "News Short": 5,
  Photo: 3,
  Poll: 5,
  Text: 3
};

const LIFE = {
  Short: 5,
  "News Short": 10,
  Photo: 4,
  Poll: 2,
  Text: 2
};

let db =
  JSON.parse(
    localStorage.getItem(KEY) ||
    "null"
  ) || {
    posts: []
  };

function $(selector) {
  return document.querySelector(
    selector
  );
}

function save() {
  localStorage.setItem(
    KEY,
    JSON.stringify(db)
  );
}

function now() {
  return Date.now() + TZ;
}

function iso(time) {
  return new Date(
    time - TZ
  )
    .toISOString()
    .slice(0, 16)
    .replace("T", " ") +
    " GMT+3:30";
}

function clean() {
  const time = now();

  db.posts =
    db.posts.filter(post => {

      if (
        post.expires &&
        time >= post.expires
      ) {
        return false;
      }

      return true;
    });

  save();
}

function count(type) {
  return db.posts.filter(
    post => post.type === type
  ).length;
}

function hasSpace(type) {
  return count(type) < LIMIT[type];
}

function message(id, text, error) {
  const box = $(id);

  if (!box) {
    return;
  }

  box.className =
    error
      ? "messageBox errorMessage"
      : "messageBox successMessage";

  box.textContent = text;
}

function clearMessage(id) {
  const box = $(id);

  if (!box) {
    return;
  }

  box.className =
    "messageBox";

  box.textContent =
    "";
}

function checkMedia(
  inputId,
  infoId,
  type
) {
  const input =
    document.getElementById(
      inputId
    );

  const info =
    document.getElementById(
      infoId
    );

  if (!input) {
    return false;
  }

  const file =
    input.files[0];

  if (!file) {

    if (info) {
      info.hidden = true;
    }

    return false;
  }

  if (
    file.size >
    25 * 1024 * 1024
  ) {

    input.value = "";

    if (info) {
      info.hidden = true;
    }

    const msgId =
      type === "Short"
        ? "#shortMsg"
        : type === "News Short"
          ? "#newsMsg"
          : "#photoMsg";

    message(
      msgId,
      "File is too large. Maximum size is 25 MB.",
      true
    );

    return false;
  }

  const correct =
    type === "Photo"
      ? file.type.startsWith(
          "image/"
        )
      : file.type.startsWith(
          "video/"
        );

  if (!correct) {

    input.value = "";

    if (info) {
      info.hidden = true;
    }

    const msgId =
      type === "Photo"
        ? "#photoMsg"
        : type === "News Short"
          ? "#newsMsg"
          : "#shortMsg";

    message(
      msgId,
      type === "Photo"
        ? "Please choose an image."
        : "Please choose a video.",
      true
    );

    return false;
  }

  if (info) {

    info.hidden = false;

    info.textContent =
      file.name +
      " • " +
      formatBytes(
        file.size
      );
  }

  return true;
}

function formatBytes(bytes) {

  if (bytes < 1024) {
    return bytes + " B";
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return (
      (bytes / 1024)
        .toFixed(1) +
      " KB"
    );
  }

  return (
    (bytes / 1024 / 1024)
      .toFixed(1) +
    " MB"
  );
}

function createMediaPost(
  type
) {
  if (!hasSpace(type)) {

    const id =
      type === "Short"
        ? "#shortMsg"
        : type === "News Short"
          ? "#newsMsg"
          : "#photoMsg";

    message(
      id,
      "No empty slot for this subject. Try tomorrow in GMT+3:30.",
      true
    );

    return;
  }

  const ids = {

    Short: {
      file: "shortFile",
      caption: "shortCaption",
      info: "shortInfo",
      msg: "#shortMsg"
    },

    "News Short": {
      file: "newsFile",
      caption: "newsCaption",
      info: "newsInfo",
      msg: "#newsMsg"
    },

    Photo: {
      file: "photoFile",
      caption: "photoCaption",
      info: "photoInfo",
      msg: "#photoMsg"
    }

  };

  const config =
    ids[type];

  const input =
    document.getElementById(
      config.file
    );

  const file =
    input?.files[0];

  if (!file) {

    message(
      config.msg,
      "Upload a file first.",
      true
    );

    return;
  }

  if (
    !checkMedia(
      config.file,
      config.info,
      type
    )
  ) {
    return;
  }

  const post = {
    id: crypto.randomUUID(),
    type: type,
    created: now(),
    expires:
      now() +
      LIFE[type] *
      864e5,
    caption:
      document.getElementById(
        config.caption
      )?.value.trim() || "",
    status: "active",
    fileName: file.name,
    mime: file.type
  };

  const reader =
    new FileReader();

  reader.onload = () => {

    post.file =
      reader.result;

    db.posts.push(post);

    save();

    renderLocalFeed();

    document.getElementById(
      config.caption
    ).value = "";

    input.value = "";

    const info =
      document.getElementById(
        config.info
      );

    if (info) {
      info.hidden = true;
      info.textContent = "";
    }

    message(
      config.msg,
      "Subject posted successfully.",
      false
    );
  };

  reader.onerror = () => {

    message(
      config.msg,
      "Unable to read the selected file.",
      true
    );
  };

  reader.readAsDataURL(file);
}

function createPoll() {

  if (!hasSpace("Poll")) {

    message(
      "#pollMsg",
      "No empty slot for Poll. Try tomorrow in GMT+3:30.",
      true
    );

    return;
  }

  const options =
    [
      ...document.querySelectorAll(
        ".pollOption"
      )
    ]
      .map(
        input =>
          input.value.trim()
      )
      .filter(Boolean);

  if (options.length < 2) {

    message(
      "#pollMsg",
      "Add at least 2 options.",
      true
    );

    return;
  }

  const correct =
    $("#pollCorrect")?.value ||
    "";

  const post = {

    id: crypto.randomUUID(),

    type: "Poll",

    created: now(),

    expires:
      now() +
      LIFE.Poll *
      864e5,

    caption:
      $("#pollCaption")
        ?.value.trim() ||
      "",

    status: "active",

    options: options,

    correct: correct,

    votes: {}

  };

  db.posts.push(post);

  save();

  renderLocalFeed();

  $("#pollCaption").value =
    "";

  document.querySelectorAll(
    ".pollOption"
  ).forEach(
    input => {
      input.value = "";
    }
  );

  message(
    "#pollMsg",
    "Poll posted successfully.",
    false
  );
}

function addPollOption() {

  const options =
    document.querySelectorAll(
      ".pollOption"
    );

  if (options.length >= 5) {

    message(
      "#pollMsg",
      "Maximum 5 options.",
      true
    );

    return;
  }

  const input =
    document.createElement(
      "input"
    );

  input.className =
    "pollOption";

  input.placeholder =
    "Option " +
    (options.length + 1);

  $("#pollOptions")
    .appendChild(input);

  updateCorrectOptions();
}

function updateCorrectOptions() {

  const select =
    $("#pollCorrect");

  if (!select) {
    return;
  }

  select.innerHTML =
    `
      <option value="">
        No correct answer
      </option>
    `;

  const options =
    document.querySelectorAll(
      ".pollOption"
    );

  options.forEach(
    (_, index) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        String(index);

      option.textContent =
        "Option " +
        (index + 1);

      select.appendChild(
        option
      );
    }
  );
}

function createText() {

  if (!hasSpace("Text")) {

    message(
      "#textMsg",
      "No empty slot for Text. Try tomorrow in GMT+3:30.",
      true
    );

    return;
  }

  const caption =
    $("#textCaption")
      ?.value.trim() ||
    "";

  if (!caption) {

    message(
      "#textMsg",
      "Write some text first.",
      true
    );

    return;
  }

  const post = {

    id: crypto.randomUUID(),

    type: "Text",

    created: now(),

    expires:
      now() +
      LIFE.Text *
      864e5,

    caption: caption,

    status: "active"

  };

  db.posts.push(post);

  save();

  renderLocalFeed();

  $("#textCaption").value =
    "";

  message(
    "#textMsg",
    "Text posted successfully.",
    false
  );
}

function renderLocalFeed() {

  clean();

  const feed =
    $("#feed");

  if (!feed) {
    return;
  }

  if (
    db.posts.length === 0
  ) {

    loadSharedPosts();

    return;
  }

  feed.innerHTML =
    db.posts
      .slice()
      .sort(
        (a, b) =>
          b.created -
          a.created
      )
      .map(
        postHTML
      )
      .join("");
}

async function loadSharedPosts() {

  const feed =
    $("#feed");

  if (!feed) {
    return;
  }

  try {

    const response =
      await fetch(
        "posts.json",
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "posts.json could not be loaded"
      );
    }

    const data =
      await response.json();

    const shared =
      Array.isArray(data.posts)
        ? data.posts
        : [];

    const local =
      db.posts
        .slice()
        .sort(
          (a, b) =>
            b.created -
            a.created
        );

    const sharedHTML =
      shared
        .map(
          sharedPostHTML
        )
        .join("");

    const localHTML =
      local
        .map(
          postHTML
        )
        .join("");

    feed.innerHTML =
      localHTML +
      sharedHTML;

    if (
      !localHTML &&
      !sharedHTML
    ) {

      feed.innerHTML =
        `
          <p class="muted emptyState">
            No shared posts yet.
          </p>
        `;
    }

  }
  catch (error) {

    console.error(error);

    if (
      db.posts.length
    ) {

      renderLocalFeed();

      return;
    }

    feed.innerHTML =
      `
        <p class="muted">
          Unable to load shared posts.
        </p>
      `;
  }
}

function sharedPostHTML(
  post
) {

  let media =
    "";

  if (
    post.mediaType ===
      "video/mp4" &&
    post.media
  ) {

    media =
      `
        <video
          controls
          playsinline
          preload="metadata"
          src="${escAttr(
            post.media
          )}">
        </video>
      `;
  }

  else if (
    post.mediaType &&
    post.mediaType.startsWith(
      "image/"
    ) &&
    post.media
  ) {

    media =
      `
        <img
          src="${escAttr(
            post.media
          )}"
          alt="Shared image">
      `;
  }

  return `
    <article class="post">

      <span class="tag">
        ${esc(
          post.type ||
          "Post"
        )}
      </span>

      <h3>
        ${esc(
          post.caption ||
          post.type ||
          "Post"
        )}
      </h3>

      ${media}

      ${
        post.caption
          ? `
            <p>
              ${esc(
                post.caption
              )}
            </p>
          `
          : ""
      }

      ${
        post.createdAt
          ? `
            <small>
              Posted:
              ${esc(
                post.createdAt
              )}
            </small>
          `
          : ""
      }

    </article>
  `;
}

function postHTML(post) {

  let body =
    "";

  if (
    post.type ===
    "Text"
  ) {

    body =
      `
        <p>
          ${esc(
            post.caption
          )}
        </p>
      `;
  }

  else if (
    post.type ===
    "Poll"
  ) {

    body =
      pollHTML(post);
  }

  else if (
    post.file
  ) {

    if (
      post.mime &&
      post.mime.startsWith(
        "image/"
      )
    ) {

      body =
        `
          <img
            src="${escAttr(
              post.file
            )}"
            alt="${escAttr(
              post.caption ||
              "Shared image"
            )}">
        `;
    }

    else {

      body =
        `
          <video
            controls
            playsinline
            preload="metadata"
            src="${escAttr(
              post.file
            )}">
          </video>
        `;
    }

    body +=
      `
        <p>
          ${esc(
            post.caption
          )}
        </p>
      `;
  }

  else {

    body =
      `
        <p>
          ${esc(
            post.caption
          )}
        </p>
      `;
  }

  return `
    <article class="post">

      <span class="tag">
        ${esc(
          post.type
        )}
      </span>

      <h3>
        ${esc(
          post.caption ||
          post.type
        )}
      </h3>

      ${body}

      <small>
        Expires:
        ${iso(
          post.expires
        )}
      </small>

    </article>
  `;
}

function pollHTML(post) {

  return `
    <p>
      ${esc(
        post.caption
      )}
    </p>

    <div class="pollButtons">

      ${
        (post.options || [])
          .map(
            (option, index) =>
              `
                <button
                  type="button"
                  onclick="vote(
                    '${escAttr(
                      post.id
                    )}',
                    ${index}
                  )">

                  ${esc(
                    option
                  )}

                </button>
              `
          )
          .join("")
      }

    </div>
  `;
}

function vote(id, index) {

  const post =
    db.posts.find(
      item =>
        item.id === id
    );

  if (!post) {
    return;
  }

  if (!post.votes) {
    post.votes = {};
  }

  post.votes[index] =
    (
      post.votes[index] ||
      0
    ) + 1;

  save();

  renderLocalFeed();

  if (
    post.correct !== "" &&
    String(index) ===
      String(post.correct)
  ) {

    alert(
      "Correct! ✅"
    );
  }

  else if (
    post.correct !== ""
  ) {

    alert(
      "Wrong ❌"
    );
  }
}

function openPublicError() {

  const dialog =
    $("#publicDialog");

  if (!dialog) {
    return;
  }

  dialog.showModal();
}

function closePublicError() {

  const dialog =
    $("#publicDialog");

  if (
    dialog &&
    dialog.open
  ) {

    dialog.close();
  }
}

function esc(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char])
  );
}

function escAttr(value) {
  return esc(value);
}

function initialize() {

  updateCorrectOptions();

  renderLocalFeed();

  loadSharedPosts();
}

window.addEventListener(
  "storage",
  event => {

    if (
      event.key !== KEY
    ) {
      return;
    }

    db =
      JSON.parse(
        event.newValue ||
        '{"posts":[]}'
      );

    renderLocalFeed();

    loadSharedPosts();
  }
);

setInterval(
  () => {
    clean();
    renderLocalFeed();
  },
  60000
);

initialize();
