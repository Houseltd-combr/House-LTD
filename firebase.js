// House LTD — Firebase configuration
// Este arquivo contém apenas a configuração pública do projeto web.
// A segurança real deve ser feita nas regras do Firestore e na autenticação.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRUNymKVh-UxKkSvNEUZkzAjmRi_4_AQU",
  authDomain: "house-ltd.firebaseapp.com",
  projectId: "house-ltd",
  storageBucket: "house-ltd.firebasestorage.app",
  messagingSenderId: "821811124213",
  appId: "1:821811124213:web:c8dd2b2f1e1a41bcd632bc",
  measurementId: "G-P28WHBV9VB"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export async function ensureAnonymousAuth() {
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
}
export function firebaseConfigIsReady() {
  return Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("COLE_AQUI"));
}
