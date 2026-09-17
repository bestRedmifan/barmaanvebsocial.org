function showSubject(post, subjectBox, bodyBox) {
  subjectBox.innerHTML = "";
  bodyBox.style.display = "block";

  // کپشن یا نام فایل
  const title = el("h2", "post-title", post.caption || post.file);
  subjectBox.appendChild(title);
}

function renderLocked(post, subjectBox, bodyBox) {
  subjectBox.innerHTML = "";
  bodyBox.style.display = "none";

  const btn = el("button", "see-button", "See");
  btn.onclick = () => askCode(post, subjectBox, bodyBox);

  subjectBox.appendChild(btn);
}

function renderSubject(post, bodyBox) {
  const subjectBox = el("div", "subject-container");

  if (isUnlocked(post)) {
    showSubject(post, subjectBox, bodyBox);
  } else {
    renderLocked(post, subjectBox, bodyBox);
  }

  return subjectBox;
}

function askCode(post, subjectBox, bodyBox) {
  const user = prompt("Enter the code inside the posts.json");
  if (user == null) return;

  if (String(user).trim() === String(post.code).trim()) {
    setUnlocked(post);
    showSubject(post, subjectBox, bodyBox);
  } else {
    alert("Wrong code.");
    renderLocked(post, subjectBox, bodyBox); // دوباره قفل می‌شود
  }
}
