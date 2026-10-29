import { db, firebaseConfigIsReady, ensureAnonymousAuth } from "./firebase.js";
import {
  addDoc, collection, getDocs, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = (selector) => document.querySelector(selector);
const loader = $("#loader");
const formSection = $("#formSection");
const receptionForm = $("#receptionForm");
const exchangeForm = $("#exchangeForm");
const formMessage = $("#formMessage");
let currentForm = null;
let vacancyFilter = "all";

window.addEventListener("load", () => setTimeout(() => loader?.classList.add("hide"), 650));
$("#menuToggle")?.addEventListener("click", () => $("#mainNav")?.classList.toggle("open"));
$("#mainNav")?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => $("#mainNav")?.classList.remove("open")));

document.querySelectorAll("[data-open]").forEach(button => button.addEventListener("click", () => openForm(button.dataset.open)));
$("#closeForm")?.addEventListener("click", () => { formSection.hidden = true; currentForm = null; });
$("#refreshVacancies")?.addEventListener("click", loadVacancies);
document.querySelectorAll("[data-vacancy-filter]").forEach(button => button.addEventListener("click", () => {
  vacancyFilter = button.dataset.vacancyFilter;
  document.querySelectorAll("[data-vacancy-filter]").forEach(b => b.classList.toggle("active", b === button));
  loadVacancies();
}));

function openForm(type) {
  currentForm = type;
  formSection.hidden = false;
  formMessage.hidden = true;
  receptionForm.hidden = type !== "reception";
  exchangeForm.hidden = type !== "exchange";
  $("#formEyebrow").textContent = type === "reception" ? "BEM-VINDO À LTD" : "MUDANÇA DE PERSONAGEM";
  $("#formTitle").textContent = type === "reception" ? "Ficha de recepção" : "Ficha de troca";
  formSection.scrollIntoView({ behavior: "smooth", block: "start" });
}
function showMessage(message, kind = "error") {
  formMessage.textContent = message;
  formMessage.className = `message ${kind}`;
  formMessage.hidden = false;
}
async function getFields(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.agree;
  if (data.age !== undefined && data.age !== "") data.age = Number(data.age);
  if (data.phoneLast4 && !/^\d{4}$/.test(data.phoneLast4)) throw new Error("Informe exatamente os quatro últimos dígitos do telefone.");
  const photoFields = { photoFile: "photoUrl", oldPhotoFile: "oldPhotoUrl", newPhotoFile: "newPhotoUrl" };
  for (const [fileKey, urlKey] of Object.entries(photoFields)) {
    const file = data[fileKey];
    delete data[fileKey];
    if (file instanceof File && file.size > 0) data[urlKey] = await uploadPhoto(file);
    else delete data[urlKey];
  }
  return data;
}
async function uploadPhoto(file) {
  // Upload direto para Cloudinary (preset unsigned da House LTD).
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", "house-ltd");
  const response = await fetch("https://api.cloudinary.com/v1_1/gsqmelxb/image/upload", { method: "POST", body });
  const result = await response.json();
  if (!response.ok || !result.secure_url) throw new Error("Não foi possível enviar a foto. Confira o preset de upload house-ltd no Cloudinary.");
  return result.secure_url;
}
function validUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}
async function submitForm(form, type) {
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";
  try {
    if (!firebaseConfigIsReady()) throw new Error("Falta configurar a apiKey do Firebase no arquivo firebase.js.");
    await ensureAnonymousAuth();
    const data = await getFields(form);
    const collectionName = type === "reception" ? "characterRequests" : "exchangeRequests";
    await addDoc(collection(db, collectionName), {
      ...data,
      type,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    form.reset();
    showMessage(type === "reception" ? "Ficha enviada! Aguarde a análise da administração." : "Solicitação enviada! A troca só será concluída após aprovação.", "success");
  } catch (error) {
    console.error(error);
    showMessage(explainError(error));
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = type === "reception" ? "Enviar ficha 🍊" : "Enviar solicitação ↗";
  }
}
function explainError(error) {
  if (error?.code === "permission-denied") return "O Firebase recusou a operação. Confira se a configuração e as regras do Firestore foram publicadas.";
  if (error?.code === "auth/operation-not-allowed") return "Ative o método de autenticação anônima em Firebase → Authentication → Sign-in method.";
  if (error?.code === "unavailable") return "O Firebase está temporariamente indisponível. Tente novamente.";
  return error?.message || "Não foi possível enviar. Confira sua conexão e tente novamente.";
}
receptionForm.addEventListener("submit", event => { event.preventDefault(); submitForm(receptionForm, "reception"); });
exchangeForm.addEventListener("submit", event => { event.preventDefault(); submitForm(exchangeForm, "exchange"); });

async function loadVacancies() {
  const container = $("#vacancyList");
  container.innerHTML = '<div class="empty-state">Carregando vagas...</div>';
  try {
    if (!firebaseConfigIsReady()) throw new Error("Falta configurar a apiKey real do Firebase no arquivo firebase.js.");
    await ensureAnonymousAuth();
    const snapshot = await getDocs(collection(db, "vagas"));
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const filtered = items.filter(item => {
      const open = item.open === true || item.status === "open" || item.status === "aberta" || item.status === "aberta / livre";
      if (vacancyFilter === "open") return open;
      if (vacancyFilter === "closed") return !open;
      return true;
    });
    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">Nenhuma vaga cadastrada nesta categoria ainda. A administração poderá adicionar vagas pelo painel.</div>';
      return;
    }
    container.replaceChildren(...filtered.map(item => {
      const open = item.open === true || item.status === "open" || item.status === "aberta" || item.status === "aberta / livre";
      const card = document.createElement("div"); card.className = "vacancy-item";
      const info = document.createElement("div");
      const name = document.createElement("strong"); name.textContent = item.character || item.personagem || item.name || "Personagem";
      const work = document.createElement("small"); work.textContent = item.work || item.obra || "Obra não informada";
      info.append(name, work);
      const badge = document.createElement("span"); badge.className = `status ${open ? "open" : "closed"}`; badge.textContent = open ? "Aberta" : "Fechada / ocupada";
      card.append(info, badge); return card;
    }));
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="empty-state">Não foi possível carregar as vagas. Confira a configuração do Firebase e as regras de leitura da coleção <b>vagas</b>.</div>';
  }
}
loadVacancies();
