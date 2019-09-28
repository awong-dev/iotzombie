import App from './components/App';
import React from 'react';
import ReactDOM from 'react-dom';
import firebase from '@firebase/app';
import '@firebase/auth';
import '@firebase/database';

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
    const { AppContainer } = require('react-hot-loader');
    const devicesDbRef = firebase.database().ref('/devicesdev');
    const render = Component => {
      ReactDOM.render((
        <AppContainer>
          <Component devicesDbRef={devicesDbRef}/>
        </AppContainer>
      ), document.getElementById('root'));
    }

    render(App);

    // Hot Module Replacement API
    if (module.hot) {
      module.hot.accept('./components/App', () => { render(App) });
    }
  } else {
    const devicesDbRef = firebase.database().ref('/devices');
    ReactDOM.render((
      <App devicesDbRef={devicesDbRef}/>
    ), document.getElementById('root'));
  }
}

function init() {
  initFirebase();

  // Ensure login.
  firebase.auth().onAuthStateChanged(function(user) {
    // No user is signed in.
    if (!user) {
      console.warn("Not logged in!");
	 const provider = new firebase.auth.GoogleAuthProvider();
	 firebase.auth().signInWithRedirect(provider);
    }
    console.warn(`user authenticated: ${user.uid}, ${user.tenantId}, ${user.email}, ${user.displayName}`);
    console.warn(user);
  });

  initReact();
}

document.addEventListener('DOMContentLoaded', init);
