import React from 'react';

import MomentaryButton from './MomentaryButton';
import RgbControl from './RgbControl';
import Switch from './Switch';

const DeviceList = ({devices, toggleSwitchFunc, changeRgbFunc}) => {
  const elementsByType = {};
  for (const id in devices) {
    const d = devices[id];
    // There has to be at type to render a control.
    if (d.type === undefined)
      continue;
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
    } else if (d.type === 'button') {
      element = (
        <MomentaryButton
          name={d.name}
          onClick={() => toggleSwitchFunc(id)}
          icon={d.icon}/>
      );
    } else if (d.type === 'rgb') {
      element = (
        <RgbControl
          name={d.name}
          icon={d.icon}
          color={{r: d.r, g: d.g, b: d.b}}
          onChange={(r, g, b) => changeRgbFunc(id, r, g, b)}/>
      );
    }

    if (element !== null) {
      list.push(
        <li key={id} className={`mdc-list-item ${d.type}-list-item`} width="100%">
          {element}
        </li>);
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

      <hr className="mdc-list-divider" />
      <section className="mdc-list-group mdc-theme--primary-bg">
        <h3 className="device-list-header">RGB Lights</h3>
        <ul className="mdc-list">
          {elementsByType['rgb']}
        </ul>
      </section>
    </div>
  );
}

export default DeviceList;
