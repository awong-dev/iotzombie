import { MDCRipple } from '@material/ripple';
import React from 'react';

class MomentaryButton extends React.Component {
  componentDidMount() {
    MDCRipple.attachTo(this.button);
  }

  render() {
    return (
      <button
        ref={c => this.button = c}
        className="mdc-button mdc-button--unelevated mdc-ripple-surface device-entry momentary-button"
        onClick={this.props.onClick}
        data-mdc-auto-init="MDCRipple">
        <i class="material-icons device-entry-icon">{this.props.icon}</i> {this.props.name}
      </button>
    );
  }
}

export default MomentaryButton;
