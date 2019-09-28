import React from 'react'
import update from 'immutability-helper'

import DeviceList from './DeviceList'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { devices: { } };
    this.onDbChange = this.onDbChange.bind(this);
    this.toggleSwitch = this.toggleSwitch.bind(this);
    this.changeRgb = this.changeRgb.bind(this);
  }

  // Flips the switch state.
  toggleSwitch(id) {
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

  // Sets new rgb values.
  changeRgb(id, r, g, b) {
    this.props.devicesDbRef.transaction((devices) => {
      if (devices) {
        const d = devices[id];
        const local_d = this.state.devices[id];
        // Avoid racing another update.
        if (d &&
            d.r === local_d.r &&
            d.g === local_d.g &&
            d.b === local_d.b) {
          d.r = r;
          d.g = g;
          d.b = b;
        }
      }
      return devices;
    });
  }

  onDbChange(snapshot) {
    if (snapshot.val()) {
      this.setState({devices: snapshot.val()});
    } else {
      console.error("Something wrong with DB update");
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
      <DeviceList
        devices={this.state.devices}
        toggleSwitchFunc={this.toggleSwitch}
        changeRgbFunc={this.changeRgb}/>
    );
  }
}

export default App;
