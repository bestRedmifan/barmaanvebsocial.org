const root = document.getElementById("root");
const status = document.getElementById("status");

function loadPosts() {
  fetch("posts.json", { cache: "no-store" })
    .then(res => res.json())
    .then(data => {
      status.textContent = "";

      if (!Array.isArray(data) || data.length === 0) {
        status.textContent = "nothing realeased yet";
        return;
      }

      data.forEach(post => {
        const box = document.createElement("div");
        box.className = "post";

        // عنوان پست
        const title = document.createElement("h3");
        title.textContent = post.subject || "بدون عنوان";
        box.appendChild(title);

        // نمایش محتوا
        if (post.type === "shorts") {
          const video = document.createElement("video");
          video.src = post.content;
          video.controls = true;
          box.appendChild(video);
        }

        if (post.type === "photo") {
          const img = document.createElement("img");
          img.src = post.content;
          box.appendChild(img);
        }

        if (post.type === "text") {
          const p = document.createElement("p");
          p.textContent = post.content;
          box.appendChild(p);
        }

        if (post.type === "short_news") {
          const p = document.createElement("p");
          p.textContent = post.content;
          box.appendChild(p);
        }

        if (post.type === "poll") {
          const p = document.createElement("p");
          p.textContent = "Polls هنوز فعال نشده 😅";
          box.appendChild(p);
        }

        root.appendChild(box);
      });
    })
    .catch(() => {
      status.textContent = "nothing realeased yet";
    });
}

document.addEventListener("DOMContentLoaded", loadPosts);
