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
    this.devicesDbRef.on('value', (snapshot) => {
      this.setState({devices: snapshot.val()});
    });
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
    this.devicesDbRef.once('value').then(snapshot => {
      this.setState({devices: snapshot.val()});
    }).catch(error => {
      console.error('Error getting state devices', error.message);
      // TODO(awong): Show error on UI.
    });
  }

  render() {
    return (
	 <DeviceList devices={this.state.devices} toggleSwitchFunc={this.toggleSwitch}/>
    );
  }
}

export default App;
