import React from 'react';
import Light from './Light';

const DeviceList = ({devices, toggleSwitchFunc}) => {
  const elementsByType = {};
  for (let i =0; i < devices.length; ++i) {
    const d = devices[i];
    let list = elementsByType[d.type];
    if (!list) {
      list = elementsByType[d.type] = [];
    }
    list.push(
      <li className="mdc-list-item">
        <Light
          lightName={d.name}
          onClick={() => toggleSwitchFunc(i)}
          isOn={d.isOn}/>
      </li>
    )
  }
  return (
    <div class="mdc-list-group">
      <h3 class="mdc-list-group__subheader">Lights</h3>
      <ul className="mdc-list">
        {elementsByType['light']}
      </ul>
      <hr class="mdc-list-divider" />
      <h3 class="mdc-list-group__subheader">Buttons</h3>
      <ul className="mdc-list">
        {elementsByType['button']}
      </ul>
    </div>
  );
}

export default DeviceList;
