import React from 'react';

import MomentaryButton from './MomentaryButton';
import Switch from './Switch';

const DeviceList = ({devices, toggleSwitchFunc}) => {
  const elementsByType = {};
  for (const id in devices) {
    const d = devices[id];
    let list = elementsByType[d.type];
    if (!list) {
      list = elementsByType[d.type] = [];
    }
    if (d.type === 'switch') {
      list.push(
        <li className="mdc-list-item" width="100%">
          <Switch
            key={id}
            name={d.name}
            onClick={() => toggleSwitchFunc(id)}
            icon={d.icon}
            isOn={d.isOn}/>
        </li>
      );
    } else {
      list.push(
        <li className="mdc-list-item" width="100%">
          <MomentaryButton
            key={id}
            name={d.name}
            onClick={() => toggleSwitchFunc(id)}
            icon={d.icon}/>
        </li>
      );
    }
  }
  return (
    <div className="device-list">
      <section className="mdc-list-group mdc-theme--primary-bg">
        <h3 className="device-list-header">Switches</h3>
        <ul className="mdc-list">
          {elementsByType['switch']}
        </ul>
      </section>
      <hr className="mdc-list-divider" />
      <section className="mdc-list-group mdc-theme--primary-bg">
        <h3 className="device-list-header">Buttons</h3>
        <ul className="mdc-list">
          {elementsByType['button']}
        </ul>
      </section>
    </div>
  );
}

export default DeviceList;
