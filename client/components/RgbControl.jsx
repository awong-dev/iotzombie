import React from 'react';
import { ChromePicker } from 'react-color';

const RgbControl = ({name, icon, color, onChange}) => {
  const handleChangeComplete = (new_color) => {
    const new_rgb = new_color.rgb;
    onChange(new_rgb.r, new_rgb.g, new_rgb.b);
  }
  return (
    <div className="rgb-control">
      <div className="rgb-control-name" ><i className="material-icons device-entry-icon">{icon}</i> {name}</div>
      <ChromePicker
        color={color}
        disableAlpha={true}
        onChange={ handleChangeComplete }
      />
    </div>
  );
}

export default RgbControl;
