import setLight from './lights';

require('../sass/style.scss');

function init() {
  const buttons = document.getElementsByClassName('button-light');
  for (const btn of buttons) {
    btn.addEventListener('click', () => { setLight(btn); });
  }
}

document.addEventListener('DOMContentLoaded', init);
