require ('../sass/style.scss');

import { setLight } from "./lights.js";

function init() {
  const buttons = document.getElementsByClassName('button-light');
  for (let btn of buttons) {
    btn.addEventListener('click', () => { setLight(btn); });
  }
}

document.addEventListener('DOMContentLoaded', init);
