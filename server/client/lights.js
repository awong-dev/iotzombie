import 'whatwg-fetch';

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

function refreshButton(button, scheduleNext) {
  // This can race a light state change, but whatever. It should roughly
  // be idempotent.
  //
  // TODO(awong): Facetor out with the setLight call.
  fetch(`/api/lights/ui/${button.dataset.lightid}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  }).then((res) =>  {
    if (res.status === 200) {
      res.json().then((json) => {
        updateButton(button, json);
      });
    } else {
      console.error(JSON.stringify(res.status));
      updateButton(button, null);
    }
  }).catch((err) => {
    console.error(JSON.stringify(err));
    updateButton(button, null);
  }).then(() => {
    scheduleNext(button);
  });
}

const refreshPeriod = 5000;
export function startRefresh(button) {
  // TODO(awong): Make it only start refresh after one has succeeded.
  setTimeout(() => { refreshButton(button, startRefresh); }, (refreshPeriod / 2) + (Math.random() * refreshPeriod));
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
