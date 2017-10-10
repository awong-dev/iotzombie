import App from './components/App'
import React from 'react';
import ReactDOM from 'react-dom'
import firebase from 'firebase'

if (process.env.NODE_ENV === 'development') {
  const { AppContainer } = require('react-hot-loader');
}

require("../sass/style.scss");

function initFirebase() {
  const config = {
    apiKey: "AIzaSyAA2GNBLSctt9fUbzulX9OIW2aMPV4eIO4",
    authDomain: "iotzombie-153122.firebaseapp.com",
    databaseURL: "https://iotzombie-153122.firebaseio.com",
    projectId: "iotzombie-153122",
    storageBucket: "iotzombie-153122.appspot.com",
    messagingSenderId: "51799231223"
  };
  firebase.initializeApp(config);
}

function initReact() {
  if (process.env.NODE_ENV === 'development') {
    const render = Component => {
      ReactDOM.render((
        <AppContainer>
          <Component />
        </AppContainer>
      ), document.getElementById('root'));
    }

    render(App);

    // Hot Module Replacement API
    if (module.hot) {
      module.hot.accept('./components/App', () => { render(App) });
    }
  } else {
    ReactDOM.render((
      <App />
    ), document.getElementById('root'));
  }
}

function init() {
  initFirebase();

  // Ensure login.
  firebase.auth().onAuthStateChanged(function(user) {
    // No user is signed in.
    if (!user) {
	 const provider = new firebase.auth.GoogleAuthProvider();
	 firebase.auth().signInWithRedirect(provider);
    }
  });

  initReact();
}

document.addEventListener('DOMContentLoaded', init);
