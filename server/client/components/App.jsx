import React from 'react';
import { Provider } from 'react-redux';

import DeviceList from './DeviceList'

const store = {
  devices: [
    {
      name: 'Parlor',
      type: 'light',
      id: 1
    },
    {
      name: 'Recirc Pump',
      type: 'button',
      id: 2
    },
    {
      name: 'Entry',
      type: 'light',
      id: 2
    }
  ]
};

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <DeviceList devices={store.devices}/>
      </Provider>
    );
  }
}

export default App;
