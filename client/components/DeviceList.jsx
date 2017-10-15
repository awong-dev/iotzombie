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
    let element = null;
    if (d.type === 'switch') {
      element = (
        <Switch
          name={d.name}
          onClick={() => toggleSwitchFunc(id)}
          icon={d.icon}
          isOn={d.isOn}/>
      );
    } else {
      element = (
        <MomentaryButton
          name={d.name}
          onClick={() => toggleSwitchFunc(id)}
          icon={d.icon}/>
      );
    }
    list.push(
      <li key={id} className="mdc-list-item" width="100%">
        {element}
      </li>);
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
