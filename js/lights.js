function updateButton(button, state) {
  if (state === null) {
    button.classList.remove('btn-light-on');
    button.classList.remove('btn-light-off');
    button.classList.add('btn-light-unknown');
  } else if (state.isOn === true) {
    button.classList.remove('btn-light-unknown');
    button.classList.remove('btn-light-off');
    button.classList.add('btn-light-on');
  } else if (state.isOn === false) {
    button.classList.remove('btn-light-unknown');
    button.classList.remove('btn-light-on');
    button.classList.add('btn-light-off');
  }
}

export function setLight(button) {
  button.disabled = true;
  const isOn = button.classList.contains('btn-light-on');

  fetch(`/lights/${button.dataset.lightid}`, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({isOn: !isOn})
  }).then((res) => {
    if (res.status === 200) {
      res.json().then((json) => {
        updateButton(button, json);
      });
    } else {
      updateButton(button, null);
    }
  }).catch(() => {
    updateButton(button, null);
  }).then((res) => {
    setTimeout(() => {button.disabled = false;}, 1000);
  });
}
