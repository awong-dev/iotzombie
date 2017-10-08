import React from 'react';
import update from 'immutability-helper';

import DeviceList from './DeviceList'


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      devices: [
        {
          name: 'Parlor',
          type: 'light',
          isOn: true,
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
          isOn: true,
          id: 2
        }
      ]
    };

    this.toggleSwitch = this.toggleSwitch.bind(this);
  }

  toggleSwitch(id) {
    const foo = update(this.state, {devices: {[id]: {$toggle: ['isOn']}}});
    this.setState(foo);
  }

  render() {
    return (
	 <DeviceList devices={this.state.devices} toggleSwitchFunc={this.toggleSwitch}/>
    );
  }
}

export default App;
