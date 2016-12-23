function updateButton(button, state) {
  if (state === null) {
    button.classList.remove('secondary');
    button.classList.add('alert');
  } else if (state.isOn === true) {
    button.classList.remove('secondary');
    button.classList.remove('alert');
  } else if (state.isOn === false) {
    button.classList.remove('alert');
    button.classList.add('secondary');
  }
}

export default function setLight(button) {
  button.disabled = true;
  const isOn = !button.classList.contains('secondary') && !button.classList.contains('alert');

  fetch(`/api/lights/ui/${button.dataset.lightid}`, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isOn: !isOn }),
    credentials: 'include'
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
  }).then(() => {
    button.disabled = false;
  });
}
