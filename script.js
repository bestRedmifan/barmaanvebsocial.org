const root = document.getElementById("root");
const status = document.getElementById("status");

function loadPosts() {
  fetch("posts.json", { cache: "no-store" })
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        status.textContent = "nothing realeased yet";
        return;
      }

      status.textContent = "";

      data.forEach(post => {
        const box = document.createElement("article");
        box.className = "post";

        const title = document.createElement("h2");
        title.className = "post-title";
        title.textContent = post.subject || "بدون عنوان";
        box.appendChild(title);

        const body = document.createElement("div");
        body.className = "post-body";

        if (post.type === "shorts") {
          const video = document.createElement("video");
          video.src = post.content;
          video.controls = true;
          body.appendChild(video);
        } else if (post.type === "photo") {
          const img = document.createElement("img");
          img.src = post.content;
          body.appendChild(img);
        } else {
          const p = document.createElement("p");
          p.textContent = post.content || "";
          body.appendChild(p);
        }

        box.appendChild(body);
        root.appendChild(box);
      });
    })
    .catch(() => {
      status.textContent = "nothing realeased yet";
    });
}

document.addEventListener("DOMContentLoaded", loadPosts);
