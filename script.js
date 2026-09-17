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

function showSubject(post, subjectBox, bodyBox) {
  subjectBox.innerHTML = "";
  bodyBox.style.display = "block";

  const title = document.createElement("h2");
  title.className = "post-title";
  title.textContent = post.caption || post.file;
  subjectBox.appendChild(title);
}

function renderLocked(post, subjectBox, bodyBox) {
  subjectBox.innerHTML = "";
  bodyBox.style.display = "none";

  const btn = document.createElement("button");
  btn.className = "see-button";
  btn.textContent = "See";
  btn.onclick = () => askCode(post, subjectBox, bodyBox);

  subjectBox.appendChild(btn);
}

function renderSubject(post, bodyBox) {
  const subjectBox = document.createElement("div");
  subjectBox.className = "subject-container";

  // همیشه قفل، بدون isUnlocked
  renderLocked(post, subjectBox, bodyBox);

  return subjectBox;
}
