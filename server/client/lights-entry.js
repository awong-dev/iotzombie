import setLight from './lights';

require('../sass/style.scss');

function init() {
  const buttons = document.getElementsByClassName('button-light');
  for (let idx = 0; idx < buttons.length; idx++) {
    const btn = buttons[idx];
    btn.addEventListener('click', () => { setLight(btn); });
  }
}

document.addEventListener('DOMContentLoaded', init);
