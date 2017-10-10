import React from 'react';

const Switch = ({onClick, lightName, lightId, isOn}) => {
  const classes = `mdc-button mdc-button--unelevated ${isOn ? 'device-on' : 'device-off'}`;
  return (
    <div>
      <button className={classes} onClick={onClick} data-mdc-auto-init="MDCRipple">
        {lightName}
      </button>
    </div>
  );
}

export default Switch;
