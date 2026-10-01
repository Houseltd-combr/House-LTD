// 🔥 CARREGAR FIREBASE SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ✅ SUAS CREDENCIAIS DO PROJETO HOUSE-LTD
const firebaseConfig = {
  apiKey: "AIzaSyCRUNymKVh-UxKkSvNEUZkAjmRi_4_AQU",
  authDomain: "house-ltd.firebaseapp.com",
  projectId: "house-ltd",
  storageBucket: "house-ltd.firebasestorage.app",
  messagingSenderId: "821811124213",
  appId: "1:821811124213:web:c8dd2b2f1e1a41bcd632bc"
};

// Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
