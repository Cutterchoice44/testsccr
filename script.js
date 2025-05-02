const API_KEY = "pk_0b8abc6f834b444f949f727e88a728e0";
const STATION_ID = "cutters-choice-radio";
const BASE_URL = "https://api.radiocult.fm/api";
const FALLBACK_ART = "https://i.imgur.com/qWOfxOS.png";
const MIXCLOUD_PASSWORD = "cutters44";

// Google Calendar link generator
function createGoogleCalLink(title, startUtc, endUtc) {
  if (!startUtc || !endUtc) return "#";
  const fmt = dt => new Date(dt).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const startStr = fmt(startUtc);
  const endStr = fmt(endUtc);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("dates", `${startStr}/${endStr}`);
  url.searchParams.set("details", "Cutters Choice Radio");
  url.searchParams.set("location", "https://cutterschoiceradio.com");
  return url.toString();
}

// Fetch helper
async function rcFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-api-key": API_KEY }
  });
  if (!res.ok) throw new Error(`rcFetch ${res.status}`);
  return await res.json();
}

// Load current live show
async function fetchLiveNow() {
  try {
    const data = await rcFetch(`/station/${STATION_ID}/schedule/live`);
    const nowDjEl = document.getElementById("now-dj");
    const nowArtEl = document.getElementById("now-art");
    const archiveEl = document.getElementById("now-archive");
    if (data.result?.status === "schedule" && data.result.content) {
      const ev = data.result.content;
      nowDjEl.textContent = ev.title;
      nowDjEl.style.display = "";
      nowArtEl.src = ev.imageUrl || FALLBACK_ART;
      archiveEl.innerHTML = `<a href="${createGoogleCalLink(ev.title, ev.startDateUtc, ev.endDateUtc)}" target="_blank">Add to Calendar</a>`;
    } else {
      nowDjEl.textContent = "Off Air";
      nowDjEl.style.display = "";
      nowArtEl.src = FALLBACK_ART;
      archiveEl.textContent = "No live show";
    }
  } catch (err) {
    console.error("Live now error:", err);
  }
}

// Load weekly schedule
async function fetchWeeklySchedule() {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { schedules } = await rcFetch(`/station/${STATION_ID}/schedule?startDate=${startDate}&endDate=${endDate}`);
    const container = document.getElementById("schedule-container");
    container.innerHTML = "";
    if (schedules && schedules.length) {
      const ul = document.createElement("ul");
      schedules.forEach(ev => {
        const li = document.createElement("li");
        const timeStr = new Date(ev.startDateUtc).toLocaleString();
        li.innerHTML = `<strong>${timeStr}</strong>: ${ev.title} `;
        const link = document.createElement("a");
        link.href = createGoogleCalLink(ev.title, ev.startDateUtc, ev.endDateUtc);
        link.textContent = "Add to Calendar";
        link.target = "_blank";
        li.appendChild(link);
        ul.appendChild(li);
      });
      container.appendChild(ul);
    } else {
      container.innerHTML = "<p>No scheduled shows this week.</p>";
    }
  } catch (err) {
    console.error("Schedule load error:", err);
  }
}

// Shuffle archive iframes once per day
function shuffleIframesDaily() {
  const container = document.getElementById("mixcloud-list");
  if (!container) return;
  const iframes = Array.from(container.querySelectorAll("iframe"));
  const lastShuffle = localStorage.getItem("lastShuffleDate");
  const today = new Date().toISOString().split("T")[0];
  if (lastShuffle === today) return;
  for (let i = iframes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [iframes[i], iframes[j]] = [iframes[j], iframes[i]];
  }
  container.innerHTML = "";
  iframes.forEach(f => container.appendChild(f));
  localStorage.setItem("lastShuffleDate", today);
}

// Initialize on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  fetchLiveNow();
  fetchWeeklySchedule();
  shuffleIframesDaily();
  setInterval(fetchLiveNow, 30000);
  setInterval(fetchWeeklySchedule, 60000);

  const popOutBtn = document.getElementById("popOutBtn");
  if (popOutBtn) {
    popOutBtn.addEventListener("click", () => {
      const src = document.getElementById("inlinePlayer").src;
      const pop = window.open("", "CCRPlayer", "width=400,height=200,resizable=yes");
      pop.document.write(\`
        <!DOCTYPE html>
        <html lang="en">
          <head><title>CCR Player</title></head>
          <body style="margin:0">
            <iframe src="\${src}" allow="autoplay" style="width:100%;height:100%;border:none"></iframe>
          </body>
        </html>
      \`);
      pop.document.close();
    });
  }
});

// Pop-out chat
function openChatPopup() {
  window.open(
    "https://app.radiocult.fm/embed/chat/cutters-choice-radio?theme=midnight&primaryColor=%235A8785&corners=sharp",
    "CuttersChoiceChat",
    "width=400,height=700,resizable=yes,scrollbars=yes"
  );
}

// Add Mixcloud show
function addMixcloud() {
  const url = document.getElementById("mixcloud-url").value.trim();
  if (!url) return alert("Please paste a valid Mixcloud URL.");
  const widget = document.createElement("iframe");
  widget.src = \`https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=\${encodeURIComponent(url)}\`;
  widget.style.width = "100%";
  widget.style.height = "120px";
  document.getElementById("mixcloud-list").appendChild(widget);
  document.getElementById("mixcloud-url").value = "";
  widget.onload = () => widget.scrollIntoView({ behavior: "smooth" });
}
