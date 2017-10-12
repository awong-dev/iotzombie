import React from 'react';

const Switch = ({onClick, name, icon, isOn}) => {
  const classes = `mdc-button mdc-button--unelevated ${isOn ? 'device-on' : 'device-off'} device-entry`;
  return (
    <button className={classes} onClick={onClick}>
      <i class="material-icons device-entry-icon">{icon}</i> {name}
    </button>
  );
}

export default Switch;
