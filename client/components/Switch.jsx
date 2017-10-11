import React from 'react';

const Switch = ({onClick, lightName, icon, isOn}) => {
  const classes = `mdc-button mdc-button--unelevated ${isOn ? 'device-on' : 'device-off'} device-entry`;
  return (
    <button className={classes} onClick={onClick} data-mdc-auto-init="MDCRipple">
      <i class="material-icons device-entry-icon">{icon}</i> {lightName}
    </button>
  );
}

export default Switch;
