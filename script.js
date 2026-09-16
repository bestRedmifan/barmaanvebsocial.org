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

        // ویدیو
        if (post.type === "shorts") {
          const video = document.createElement("video");
          video.src = post.content;
          video.controls = true;
          body.appendChild(video);
        }

        // عکس
        else if (post.type === "photo") {
          const img = document.createElement("img");
          img.src = post.content;
          body.appendChild(img);
        }

        // متن
        else if (post.type === "text" || post.type === "short_news") {
          const p = document.createElement("p");
          p.textContent = post.content || "";
          body.appendChild(p);
        }

        // آزمونک (Poll واقعی)
        else if (post.type === "poll") {
          post.options.forEach(opt => {
            const btn = document.createElement("div");
            btn.className = "poll-option";
            btn.textContent = opt.text;

            btn.onclick = () => {
              if (opt.correct) {
                btn.classList.add("correct");
              } else {
                btn.classList.add("wrong");
              }
            };

            body.appendChild(btn);
          });
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
