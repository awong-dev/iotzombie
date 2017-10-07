import { AppContainer } from 'react-hot-loader'
import React from 'react';
import ReactDOM from 'react-dom'
import App from './components/App'

import mdcAutoInit from '@material/auto-init';
import { MDCRipple } from '@material/ripple';

require("../sass/style.scss");

function init() {
  const render = Component => {
    ReactDOM.render((
	 <AppContainer>
	   <Component />
	 </AppContainer>
    ), document.getElementById('root'));
  }

  render(App);

  // Hot Module Replacement API
  if (module.hot) {
    module.hot.accept('./components/App', () => { render(App) });
  }

  mdcAutoInit.register('MDCRipple', MDCRipple);
  mdcAutoInit();
}

document.addEventListener('DOMContentLoaded', init);
