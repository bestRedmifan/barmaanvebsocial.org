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

const $ =
selector =>
document.querySelector(
selector
);

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
.replace(
"T",
" "
) +
" GMT+3:30";

}

function clean() {

const time =
now();

db.posts =
db.posts.filter(
post => {

    if (
      post.status ===
        "blocked" &&
      post.blockUntil &&
      time >=
        post.blockUntil
    ) {

      return false;

    }

    return (
      time <
      post.expires
    );

  }
);

save();

}

function counts(type) {

return db.posts.filter(
post =>
post.type === type
).length;

}

function free(type) {

return (
counts(type) <
LIMIT[type]
);

}

function render() {

clean();

const feed =
$("#feed");

if (!feed) {
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
.join("") ||
"<p class="muted emptyState"> No posts yet. </p>";

const current =
$("#form")?.dataset.type ||
"Short";

updateSubjectButtons(
current
);

renderForm(
current
);

}

function updateSubjectButtons(
selected
) {

const buttons =
document.querySelectorAll(
".subjectButton"
);

buttons.forEach(
button => {

  const type =
    button.dataset.type;

  button.classList.toggle(
    "active",
    type === selected
  );

}

);

}

function selectSubject(
type
) {

const allowed = [

"Short",

"News Short",

"Photo",

"Poll",

"Text"

];

if (
!allowed.includes(type)
) {

return;

}

const form =
$("#form");

if (!form) {
return;
}

form.dataset.type =
type;

updateSubjectButtons(
type
);

renderForm(
type
);

form.scrollIntoView({
behavior: "smooth",
block: "nearest"
});

}

function renderForm(
selectedType
) {

const form =
$("#form");

if (!form) {
return;
}

const type =
selectedType ||
form.dataset.type ||
"Short";

form.dataset.type =
type;

updateSubjectButtons(
type
);

if (!free(type)) {

form.innerHTML =
  `
    <div class="notice">
      No empty slot for this
      subject. Try tomorrow
      in GMT+3:30.
    </div>
  `;

return;

}

let file =
"";

if (
[
"Short",
"News Short",
"Photo"
].includes(type)
) {

const accept =
  type === "Photo"
    ? "image/*"
    : "video/*";

file =
  `
    <label>
      2. Upload your file
    </label>

    <input
      id="file"
      type="file"
      accept="${accept}"
      onchange="checkFile()">

    <div
      id="fileInfo"
      class="fileInfo"
      hidden>
    </div>
  `;

}

let poll =
"";

if (
type === "Poll"
) {

poll =
  `
    <label>
      2. Poll / quiz options
      (2–5)
    </label>

    <div
      id="opts"
      class="optionList">

      ${opt(0)}
      ${opt(1)}

    </div>

    <button
      type="button"
      onclick="addOpt()">
      + Add option
    </button>

    <label>
      Correct option
    </label>

    <select id="correct">

      <option value="">
        No correct answer
      </option>

      <option value="0">
        Option 1
      </option>

      <option value="1">
        Option 2
      </option>

    </select>
  `;

}

const captionNumber =
file || poll
? "3"
: "2";

const caption =
`
<label>
${captionNumber}.
Write the caption
</label>

  <textarea
    id="caption"
    placeholder="Write the caption...">
  </textarea>
`;

form.innerHTML =
file +
poll +
caption +
`
<button
class="ok"
type="button"
onclick="post()">
Post
</button>

  <div
    id="msg"
    class="messageBox">
  </div>
`;

}

function opt(index) {

return "<input class="opt" placeholder="Option ${index + 1}" data-option-index="${index}">";

}

function addOpt() {

const options =
document.querySelectorAll(
".opt"
);

const number =
options.length;

if (
number < 5
) {

$("#opts")
  .insertAdjacentHTML(
    "beforeend",
    opt(number)
  );

updateCorrect();

}
else {

showMessage(
  "Maximum 5 options.",
  "error"
);

}

}

function updateCorrect() {

const select =
$("#correct");

if (!select) {
return;
}

select.innerHTML =
"<option value=""> No correct answer </option>" +
[
...document.querySelectorAll(
".opt"
)
]
.map(
(_, index) =>
"<option value="${index}"> Option ${index + 1} </option>"
)
.join("");

}

function checkFile() {

const input =
$("#file");

const info =
$("#fileInfo");

if (!input) {
return;
}

const file =
input.files[0];

const type =
$("#form")
?.dataset.type;

if (!file) {

if (info) {
  info.hidden = true;
}

return;

}

if (
file.size >
25 * 1024 * 1024
) {

input.value =
  "";

showMessage(
  "File is too large for browser storage.",
  "error"
);

return;

}

if (
type !== "Photo" &&
!file.type.startsWith(
"video/"
)
) {

input.value =
  "";

showMessage(
  "Please choose a video.",
  "error"
);

return;

}

if (
type === "Photo" &&
!file.type.startsWith(
"image/"
)
) {

input.value =
  "";

showMessage(
  "Please choose an image.",
  "error"
);

return;

}

if (info) {

info.hidden =
  false;

info.textContent =
  file.name +
  " • " +
  formatBytes(
    file.size
  );

}

}

function formatBytes(
bytes
) {

if (
bytes < 1024
) {

return (
  bytes +
  " B"
);

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
(bytes /
1024 /
1024)
.toFixed(1) +
" MB"
);

}

function post() {

const form =
$("#form");

const type =
form?.dataset.type;

if (!type) {
return;
}

if (!free(type)) {

renderForm(
  type
);

return;

}

const caption =
$("#caption")
?.value
.trim() ||
"";

const postData = {

id:
  crypto.randomUUID(),

type:
  type,

created:
  now(),

expires:
  now() +
  LIFE[type] *
  864e5,

caption:
  caption,

status:
  "active"

};

if (
[
"Short",
"News Short",
"Photo"
].includes(type)
) {

const input =
  $("#file");

const file =
  input?.files[0];

if (!file) {

  showMessage(
    "Upload a file first.",
    "error"
  );

  return;

}

postData.fileName =
  file.name;

postData.mime =
  file.type;

const reader =
  new FileReader();

reader.onload =
  () => {

    postData.file =
      reader.result;

    finish(
      postData
    );

  };

reader.onerror =
  () => {

    showMessage(
      "Unable to read the selected file.",
      "error"
    );

  };

reader.readAsDataURL(
  file
);

return;

}

if (
type === "Poll"
) {

postData.options =
  [
    ...document.querySelectorAll(
      ".opt"
    )
  ]
    .map(
      input =>
        input.value.trim()
    )
    .filter(Boolean);

if (
  postData.options.length <
  2
) {

  showMessage(
    "Add at least 2 options.",
    "error"
  );

  return;

}

postData.correct =
  $("#correct")
    ?.value ||
  "";

postData.votes =
  {};

}

finish(
postData
);

}

function finish(
postData
) {

db.posts.push(
postData
);

save();

render();

alert(
"Subject posted successfully."
);

}

function showMessage(
text,
kind
) {

const message =
$("#msg");

if (!message) {
return;
}

message.className =
kind === "error"
? "errorMessage"
: "successMessage";

message.textContent =
text;

}

function postHTML(
post
) {

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
  pollHTML(
    post
  );

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
        src="${post.file}"
        alt="${esc(
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
        src="${post.file}">
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
    <p class="muted">
      Media:
      ${esc(
        post.fileName ||
        "Unknown file"
      )}
    </p>

    <p>
      ${esc(
        post.caption
      )}
    </p>
  `;

}

let state =
"";

if (
post.status ===
"blocked"
) {

state =
  "<b>Blocked</b>";

}

if (
post.status ===
"deleted"
) {

state =
  "<b>Deleted</b>";

}

return `
<article
class="post
${
post.status ===
"blocked"
? "blocked"
: ""
}">

  <span class="tag">
    ${esc(
      post.type
    )}
  </span>

  ${state}

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

function pollHTML(
post
) {

return `
<p>
${esc(
post.caption
)}
</p>

<div
  class="pollButtons">

  ${
    post.options
      .map(
        (
          option,
          index
        ) =>
          `
            <button
              type="button"
              onclick="vote(
                '${post.id}',
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

function vote(
id,
index
) {

const post =
db.posts.find(
item =>
item.id === id
);

if (!post) {
return;
}

if (!post.votes) {

post.votes =
  {};

}

post.votes[index] =
(
post.votes[index] ||
0
) + 1;

save();

render();

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

function resetExpiredPosts() {

clean();

render();

}

window.addEventListener(
"storage",
event => {

if (
  event.key === KEY
) {

  db =
    JSON.parse(
      event.newValue ||
      '{"posts":[]}'
    );

  render();

}

}
);

setInterval(
resetExpiredPosts,
60000
);

/*
Important:
Create Post is intentionally
initialized immediately.
*/

render();

selectSubject(
"Short"
);
