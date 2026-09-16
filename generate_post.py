import base64
import json
import os
import subprocess
from pathlib import Path

VIDEO = Path("chatgpt_funny.mp4")
JSON_FILE = Path("posts.json")

CAPTION = (
    "Guys this is a funny video made by #CHATGPT and everyone can see it "
    "and you're asking why I can't 😂"
)

# Create a tiny funny video with FFmpeg.
# FFmpeg must be installed and available in PATH.
cmd = [
    "ffmpeg",
    "-y",
    "-f", "lavfi",
    "-i",
    "color=c=black:s=640x360:r=24",
    "-vf",
    (
        "drawtext="
        "text='😂 CHATGPT MADE THIS 😂':"
        "fontcolor=white:fontsize=36:"
        "x=(w-text_w)/2:y=(h-text_h)/2"
    ),
    "-t", "5",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    str(VIDEO)
]

subprocess.run(cmd, check=True)

# Read the generated video
video_bytes = VIDEO.read_bytes()

# Convert the entire video to Base64
video_base64 = base64.b64encode(video_bytes).decode("ascii")

# Put the video directly inside posts.json
data = {
    "version": 1,
    "posts": [
        {
            "id": "post_chatgpt_funny_001",
            "type": "Short",
            "caption": CAPTION,
            "mediaType": "video/mp4",
            "media": "data:video/mp4;base64," + video_base64,
            "createdAt": "2026-09-16T14:00:00+03:30",
            "status": "active"
        }
    ]
}

JSON_FILE.write_text(
    json.dumps(data, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

print("✅ Funny video created!")
print("✅ Video embedded inside posts.json!")
print(f"📄 Created: {JSON_FILE}")
print(f"📦 JSON size: {JSON_FILE.stat().st_size / 1024:.1f} KB")
