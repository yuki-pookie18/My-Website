const root = document.documentElement;
const windows = [...document.querySelectorAll("[data-window-panel]")];
const launchers = [...document.querySelectorAll("[data-window]")];
const closeButtons = [...document.querySelectorAll("[data-close]")];
const themeToggle = document.querySelector("#themeToggle");
const soundToggle = document.querySelector("#soundToggle");
const soundStatus = soundToggle.querySelector(".sfx-status");

let topZ = 30;
let soundOn = false;
let audioContext;

const storedTheme = localStorage.getItem("portfolio-theme");
setTheme(storedTheme || "light");
setSoundState(false);

themeToggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  chirp(520);
});

soundToggle.addEventListener("click", () => {
  setSoundState(!soundOn);
  chirp(soundOn ? 720 : 280);
});

launchers.forEach((launcher) => {
  launcher.addEventListener("click", () => {
    const key = launcher.dataset.window;
    openWindow(key);
    chirp(460);
  });
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeWindow(button.dataset.close);
    chirp(240);
  });
});

windows.forEach((panel) => {
  const titlebar = panel.querySelector(".window-titlebar");

  panel.addEventListener("pointerdown", () => bringToFront(panel));
  titlebar.addEventListener("pointerdown", (event) => startDrag(event, panel));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  const openPanels = windows.filter((panel) => panel.classList.contains("is-open"));
  const highest = openPanels.sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0))[0];
  if (highest) highest.classList.remove("is-open");
});

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("portfolio-theme", theme);
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
}

function setSoundState(isOn) {
  soundOn = isOn;
  soundToggle.setAttribute("aria-pressed", String(soundOn));
  soundToggle.setAttribute("aria-label", `Sound effects ${soundOn ? "on" : "off"}`);
  soundToggle.classList.toggle("is-active", soundOn);
  soundStatus.textContent = soundOn ? "on" : "off";
}

function openWindow(key) {
  const panel = document.querySelector(`[data-window-panel="${key}"]`);
  if (!panel) return;

  panel.classList.add("is-open");
  bringToFront(panel);
}

function closeWindow(key) {
  const panel = document.querySelector(`[data-window-panel="${key}"]`);
  if (!panel) return;

  panel.classList.remove("is-open");
}

function bringToFront(panel) {
  topZ += 1;
  panel.style.zIndex = topZ;
}

function startDrag(event, panel) {
  if (event.target.closest("button")) return;
  if (window.matchMedia("(max-width: 900px)").matches) return;

  bringToFront(panel);

  const startX = event.clientX;
  const startY = event.clientY;
  const rect = panel.getBoundingClientRect();
  const desktopRect = document.querySelector("#desktop").getBoundingClientRect();
  const offsetX = startX - rect.left;
  const offsetY = startY - rect.top;

  panel.setPointerCapture(event.pointerId);
  document.body.classList.add("dragging");

  const move = (moveEvent) => {
    const maxX = desktopRect.width - rect.width - 20;
    const maxY = Math.max(window.innerHeight, desktopRect.height) - rect.height - 20;
    const x = clamp(moveEvent.clientX - offsetX, 20, maxX);
    const y = clamp(moveEvent.clientY - offsetY, 70, maxY);

    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
  };

  const stop = () => {
    panel.removeEventListener("pointermove", move);
    panel.removeEventListener("pointerup", stop);
    panel.removeEventListener("pointercancel", stop);
    document.body.classList.remove("dragging");
  };

  panel.addEventListener("pointermove", move);
  panel.addEventListener("pointerup", stop);
  panel.addEventListener("pointercancel", stop);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function chirp(frequency) {
  if (!soundOn) return;

  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.frequency.value = frequency;
  oscillator.type = "square";
  gain.gain.setValueAtTime(0.0525, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.08);

  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.08);
}
