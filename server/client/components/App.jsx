import React from 'react'
import firebase from 'firebase'
import update from 'immutability-helper'

import DeviceList from './DeviceList'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { devices: { } };
    this.toggleSwitch = this.toggleSwitch.bind(this);
    this.devicesDbRef = firebase.database().ref('/devices');
  }

  toggleSwitch(id) {
    this.devicesDbRef.transaction((devices) => {
      if (devices) {
        // Avoid racing other UIs.
        if (devices[id].isOn === this.state.devices[id].isOn) {
          devices[id].isOn = !devices[id].isOn;
        }
      }
      return devices;
    });
  }

  componentDidMount() {
    this.devicesDbRef.on('value', (snapshot) => {
      if (snapshot.val()) {
        this.setState({devices: snapshot.val()});
      } else {
        // TODO(ajwong): Uh oh. Show error.
      }
    })
  }

  render() {
    return (
	 <DeviceList devices={this.state.devices} toggleSwitchFunc={this.toggleSwitch}/>
    );
  }
}

export default App;
