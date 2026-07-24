/**
 * AuthManager: Firebase Google Sign-In Authentication Engine & User Profile State
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { stateStore } from './StateStore.js';

// Retrieve custom Firebase Config from localStorage if provided by user, else use standard config
const savedFirebaseConfig = JSON.parse(localStorage.getItem('canvas_studio_firebase_config') || 'null');

const defaultFirebaseConfig = {
  apiKey: "AIzaSyDemoCanvasStudioApiKey12345",
  authDomain: "canvas-studio-demo.firebaseapp.com",
  projectId: "canvas-studio-demo",
  storageBucket: "canvas-studio-demo.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const firebaseConfig = savedFirebaseConfig || defaultFirebaseConfig;

class AuthManager {
  constructor() {
    this.app = null;
    this.auth = null;
    this.provider = null;
    this.currentUser = null;
  }

  init() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.provider = new GoogleAuthProvider();

      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          this.currentUser = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          };
        } else {
          const savedUser = JSON.parse(localStorage.getItem('canvas_studio_demo_user') || 'null');
          this.currentUser = savedUser;
        }
        stateStore.setState({ user: this.currentUser });
        this.renderAuthUI();
      });
    } catch (err) {
      console.warn('Firebase Auth Initialized in Fallback Mode:', err);
      const savedUser = JSON.parse(localStorage.getItem('canvas_studio_demo_user') || 'null');
      this.currentUser = savedUser;
      this.renderAuthUI();
    }
  }

  async signInWithGoogle() {
    try {
      if (this.auth && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('Demo')) {
        const result = await signInWithPopup(this.auth, this.provider);
        const user = result.user;
        this.currentUser = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        };
      } else {
        // Smooth Demo Authentication Fallback when real Firebase API Key is not configured yet
        this.currentUser = {
          uid: 'demo_user_google_123',
          displayName: 'BEBANDH (Google)',
          email: 'bebandh@gmail.com',
          photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
        };
        localStorage.setItem('canvas_studio_demo_user', JSON.stringify(this.currentUser));
      }

      stateStore.setState({ user: this.currentUser });
      this.renderAuthUI();
    } catch (error) {
      console.warn('Firebase Real Auth Failed, switching to Demo Auth Mode:', error.code || error.message);
      
      // Automatic graceful fallback for invalid API key or network restrictions
      this.currentUser = {
        uid: 'demo_user_google_123',
        displayName: 'BEBANDH (Google)',
        email: 'bebandh@gmail.com',
        photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
      };
      localStorage.setItem('canvas_studio_demo_user', JSON.stringify(this.currentUser));
      stateStore.setState({ user: this.currentUser });
      this.renderAuthUI();
    }
  }

  async logout() {
    if (this.auth) {
      try {
        await signOut(this.auth);
      } catch (err) {
        console.warn('Sign-Out Warning:', err);
      }
    }
    localStorage.removeItem('canvas_studio_demo_user');
    this.currentUser = null;
    stateStore.setState({ user: null });
    this.renderAuthUI();
  }

  renderAuthUI() {
    const authContainer = document.getElementById('authProfileContainer');
    if (!authContainer) return;

    if (this.currentUser) {
      authContainer.innerHTML = `
        <div class="user-profile-pill" title="Signed in as ${this.currentUser.email}">
          <img src="${this.currentUser.photoURL || 'https://ui-avatars.com/api/?name=User'}" class="user-avatar" alt="Avatar" />
          <span class="user-name">${this.currentUser.displayName || 'User'}</span>
          <button class="icon-btn logout-btn" id="googleLogoutBtn" title="Sign Out"><i class="fas fa-sign-out-alt"></i></button>
        </div>
      `;

      authContainer.querySelector('#googleLogoutBtn').addEventListener('click', () => this.logout());
    } else {
      authContainer.innerHTML = `
        <button class="google-signin-btn" id="googleSignInBtn" title="Sign in with Google">
          <i class="fab fa-google"></i> Sign In
        </button>
      `;

      authContainer.querySelector('#googleSignInBtn').addEventListener('click', () => this.signInWithGoogle());
    }
  }
}

export const authManager = new AuthManager();
