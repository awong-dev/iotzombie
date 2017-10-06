import { AppContainer } from 'react-hot-loader'
import React from 'react';
import ReactDOM from 'react-dom'
import DeviceList from './components/DeviceList'

function init() {
  /*
  const buttons = document.getElementsByClassName('button-light');
  for (let idx = 0; idx < buttons.length; idx++) {
    const btn = buttons[idx];
    btn.addEventListener('click', () => { setLight(btn); });
    startRefresh(btn);
  }
 */
  const render = Component => {
    ReactDOM.render((
	 <AppContainer>
	   <Component />
	 </AppContainer>
    ), document.getElementById('root'));
  }

  render(DeviceList);

  // Hot Module Replacement API
  if (module.hot) {
    module.hot.accept('./components/DeviceList', () => { render(DeviceList) });
  }
}

document.addEventListener('DOMContentLoaded', init);
