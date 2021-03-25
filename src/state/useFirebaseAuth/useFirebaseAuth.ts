import { useCallback, useEffect, useState } from 'react';
import * as firebase from 'firebase/app';
import 'firebase/auth';

const environment = process.env.REACT_APP_ENVIRONMENT || 'prod';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
};

export default function useFirebaseAuth() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const getToken = useCallback(
    async (identity: string, roomName: string) => {
      const headers = new window.Headers();

      const idToken = await user!.getIdToken();
      headers.set('Authorization', idToken);

      const endpoint = process.env.REACT_APP_TOKEN_ENDPOINT || '/token';
      const params = new window.URLSearchParams({ identity, roomName });

      if (environment === 'stage') {
        params.set('environment', 'stage');
        params.set('appEnvironment', 'production');
      }

      return fetch(`${endpoint}?${params}`, { headers }).then(res => res.text());
    },
    [user]
  );

  useEffect(() => {
    firebase.initializeApp(firebaseConfig);
    firebase.auth().onAuthStateChanged(newUser => {
      setUser(newUser);
      setIsAuthReady(true);
    });
  }, []);

  const signIn = useCallback(() => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/plus.login');

    return firebase
      .auth()
      .signInWithPopup(provider)
      .then(newUser => {
        setUser(newUser.user);
      });
  }, []);

  const signOut = useCallback(() => {
    return firebase
      .auth()
      .signOut()
      .then(() => {
        setUser(null);
      });
  }, []);

  return { user, signIn, signOut, isAuthReady, getToken };
}
