import { setLight } from "./lights.js";

function init() {
  const buttons = document.getElementsByClassName('light-btn');
  for (let btn of buttons) {
    btn.addEventListener('click', () => { setLight(btn); });
  }
}

document.addEventListener('DOMContentLoaded', init);
