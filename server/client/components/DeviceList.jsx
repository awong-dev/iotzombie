import React from 'react';
import Light from './Light';

class DeviceList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total: null,
      next: null,
      operation: null,
    };
  }

  render() {
    return (
      <div className="component-app">
	   <p> Hi mom hi</p>
	   <Light />
	   <Light />
        <p>d</p>
	   <Light />
      </div>
    );
  }
}

export default DeviceList;
