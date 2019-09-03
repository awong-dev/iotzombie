import React from 'react'
import update from 'immutability-helper'

import DeviceList from './DeviceList'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { devices: { } };
    this.onDbChange = this.onDbChange.bind(this);
    this.toggleSwitch = this.toggleSwitch.bind(this);
  }

  toggleSwitch(id) {
    this.props.devicesDbRef.update(
      {
        'devicesdev': null
      }
    );
    this.props.devicesDbRef.transaction((devices) => {
      if (devices) {
        // Avoid racing other UIs.
        if (devices[id].isOn === this.state.devices[id].isOn) {
          devices[id].isOn = !devices[id].isOn;
          devices.count = (devices.count || 0) + 1;
        }
      }
      return devices;
    });
  }

  onDbChange(snapshot) {
    if (snapshot.val()) {
      this.setState({devices: snapshot.val()});
    } else {
      // TODO(ajwong): Uh oh. Show error.
    }
  }

  componentDidMount() {
    this.props.devicesDbRef.on('value', this.onDbChange);
  }

  componentWillUnmount() {
    this.props.devicesDbRef.off('value', this.onDbChange);
  }

  render() {
    return (
	 <DeviceList devices={this.state.devices} toggleSwitchFunc={this.toggleSwitch}/>
    );
  }
}

export default App;
