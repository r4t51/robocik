const frames = Array.from(document.querySelectorAll("main [data-frame]"));
const links = Array.from(document.querySelectorAll(".sprocket a"));
const counter = document.querySelector(".counter");
const numeral = document.getElementById("frame-num");
const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

function setFrame(frame) {
  if (!frame) return;
  const changed = numeral.textContent !== frame;
  numeral.textContent = frame;
  if (changed && motionOk) {
    counter.classList.remove("is-advancing");
    void counter.offsetWidth;
    counter.classList.add("is-advancing");
  }
  links.forEach((link) => {
    const on = link.dataset.frame === frame;
    if (on) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}

function currentFrame() {
  const line = window.innerHeight * 0.33;
  let chosen = frames[0];
  frames.forEach((el) => {
    if (el.getBoundingClientRect().top <= line) chosen = el;
  });
  setFrame(chosen.dataset.frame);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (target?.dataset.frame) setFrame(target.dataset.frame);
  });
});

window.addEventListener("scroll", currentFrame, { passive: true });
window.addEventListener("scrollend", currentFrame);
currentFrame();
