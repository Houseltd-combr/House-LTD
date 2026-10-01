// ==================================================
// 🔥 FIREBASE + ☁️ CLOUDINARY — HOUSE LTD
// Configuração completa em um só arquivo
// ==================================================

// ------------------------------
// ☁️ CLOUDINARY CONFIG
// ------------------------------
window.cloudinaryConfig = {
  cloudName: "gsqmelxb",
  uploadPreset: "House LTD",
  uploadUrl: "https://api.cloudinary.com/v1_1/gsqmelxb/image/upload"
};

// ------------------------------
// 🔥 CARREGAR FIREBASE SDK
// ------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ CREDENCIAIS DO PROJETO HOUSE-LTD
const firebaseConfig = {
  apiKey: "AIzaSyCRUNymKVh-UxKkSvNEUZkAjmRi_4_AQU",
  authDomain: "house-ltd.firebaseapp.com",
  projectId: "house-ltd",
  storageBucket: "house-ltd.firebasestorage.app",
  messagingSenderId: "821811124213",
  appId: "1:821811124213:web:c8dd2b2f1e1a41bcd632bc"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ------------------------------
// ☁️ FUNÇÃO DE UPLOAD — CLOUDINARY
// ------------------------------
async function uploadImagem(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", window.cloudinaryConfig.uploadPreset);

  try {
    const resposta = await fetch(window.cloudinaryConfig.uploadUrl, {
      method: "POST",
      body: formData
    });
    
    const dados = await resposta.json();
    if (dados.secure_url) {
      return { sucesso: true, url: dados.secure_url };
    } else {
      return { sucesso: false, erro: "Resposta inválida do Cloudinary" };
    }
  } catch (erro) {
    console.error("❌ Erro no upload:", erro);
    return { sucesso: false, erro: erro.message };
  }
}

// ------------------------------
// 📤 EXPORTAÇÕES
// ------------------------------
export { db, uploadImagem };
