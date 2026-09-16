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

        // متن و خبر
        else if (post.type === "text" || post.type === "short_news") {
          const p = document.createElement("p");
          p.textContent = post.content || "";
          body.appendChild(p);
        }

        // Poll آزمونک (درست/غلط)
        else if (post.type === "poll_quiz") {
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

        // Poll نرمال (ذخیره انتخاب)
        else if (post.type === "poll_normal") {
          const saved = localStorage.getItem("poll_" + post.id);

          post.options.forEach(opt => {
            const btn = document.createElement("div");
            btn.className = "poll-option";
            btn.textContent = opt;

            // اگر قبلاً انتخاب شده بود
            if (saved === opt) {
              btn.classList.add("correct");
            }

            btn.onclick = () => {
              localStorage.setItem("poll_" + post.id, opt);

              // همه گزینه‌ها ریست شوند
              [...body.children].forEach(x => x.classList.remove("correct"));

              // گزینه انتخاب‌شده هایلایت شود
              btn.classList.add("correct");
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
