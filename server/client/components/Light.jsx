import React from 'react';

const Light = ({onClick, lightName, lightId}) => {
  return (
    <div>
      <button className="mdc-button mdc-button--unelevated" onClick={onClick} data-mdc-auto-init="MDCRipple">
        {lightName}
      </button>
    </div>
  );
}

export default Light;
