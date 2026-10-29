import { db, auth, firebaseConfigIsReady, ensureAnonymousAuth } from "./firebase.js";
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Shared code chosen by the owner. WARNING: client-side codes are visible to site visitors.
// The Firestore rules still require an authorized adminProfiles/{uid} record.
const SHARED_ADMIN_CODE = "006LTD";
const $ = s => document.querySelector(s);
const loginPanel = $("#loginPanel"), dashboard = $("#dashboard");
let adminName = "";
let isAuthorized = false;

$("#loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const enteredCode = String(form.get("accessCode") || "").replace(/\s+/g, "").toUpperCase();
  adminName = String(form.get("adminName") || "").trim();
  const message = $("#loginMessage");
  message.hidden = false; message.className = "message error";
  if (enteredCode !== SHARED_ADMIN_CODE) { message.textContent = "Código incorreto. Confira e tente novamente."; return; }
  if (!adminName) { message.textContent = "Informe seu nome para continuar."; return; }
  try {
    if (!firebaseConfigIsReady()) throw new Error("Configure a apiKey no firebase.js antes de entrar.");
    await ensureAnonymousAuth();
    const profile = await getDoc(doc(db, "adminProfiles", auth.currentUser.uid));
    if (!profile.exists() || profile.data().active !== true) {
      message.textContent = `O código confere, mas este dispositivo ainda não está autorizado no Firestore. UID para configurar: ${auth.currentUser.uid}`;
      return;
    }
    isAuthorized = true;
    loginPanel.hidden = true; dashboard.hidden = false;
    $("#adminNameDisplay").textContent = adminName;
    await loadAll();
  } catch (error) {
    console.error(error); message.textContent = error.message || "Não foi possível validar o acesso.";
  }
});

$("#logoutButton").addEventListener("click", async () => {
  try { await signOut(auth); } catch {}
  isAuthorized = false; adminName = ""; dashboard.hidden = true; loginPanel.hidden = false;
  $("#loginForm").reset();
});
document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("active", b === button));
  document.querySelectorAll(".admin-panel").forEach(panel => panel.hidden = panel.id !== `tab-${button.dataset.tab}`);
}));
document.querySelectorAll("[data-refresh]").forEach(button => button.addEventListener("click", loadAll));

async function requireAdmin() {
  if (!isAuthorized || !auth.currentUser) throw new Error("A sessão administrativa não está autorizada.");
  const profile = await getDoc(doc(db, "adminProfiles", auth.currentUser.uid));
  if (!profile.exists() || profile.data().active !== true) { isAuthorized = false; throw new Error("A autorização administrativa não foi encontrada."); }
}
function showAdminMessage(message, kind = "error") {
  const el = $("#adminMessage"); el.textContent = message; el.className = `message ${kind}`; el.hidden = false;
}
async function loadAll() {
  if (!isAuthorized) return;
  try { await requireAdmin(); await Promise.all([loadRequests(), loadExchanges(), loadVacancies()]); }
  catch (error) { showAdminMessage(error.message || "Falha ao carregar os dados."); }
}
async function loadCollection(name, target, emptyText, kind) {
  const el = $(target); el.innerHTML = '<div class="empty-state">Carregando...</div>';
  const snap = await getDocs(collection(db, name));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  if (!rows.length) { el.innerHTML = `<div class="empty-state">${emptyText}</div>`; return; }
  el.replaceChildren(...rows.map(item => makeRequestCard(item, kind)));
}
async function loadRequests() { await loadCollection("characterRequests", "#requestsList", "Nenhuma ficha recebida ainda.", "request"); }
async function loadExchanges() { await loadCollection("exchangeRequests", "#exchangesList", "Nenhuma solicitação de troca ainda.", "exchange"); }
function makeRequestCard(item, kind) {
  const card = document.createElement("article"); card.className = "request-card";
  const heading = document.createElement("div"); heading.className = "request-heading";
  const title = document.createElement("h3"); title.textContent = item.name || "Sem nome";
  const status = document.createElement("span"); status.className = `status ${item.status === "approved" ? "open" : item.status === "rejected" ? "closed" : ""}`; status.textContent = statusLabel(item.status);
  heading.append(title, status);
  const details = document.createElement("div"); details.className = "request-details";
  const fields = kind === "exchange"
    ? [["Personagem atual", item.oldCharacter], ["Obra atual", item.oldWork], ["Novo personagem", item.newCharacter], ["Nova obra", item.newWork], ["Telefone (4 dígitos)", item.phoneLast4], ["Foto atual", item.oldPhotoUrl], ["Nova foto", item.newPhotoUrl]]
    : [["Idade", item.age], ["Personagem", item.character], ["Obra", item.work], ["Telefone (4 dígitos)", item.phoneLast4], ["Foto", item.photoUrl]];
  fields.forEach(([label, value]) => { if (value !== undefined && value !== "") { const p = document.createElement("p"); const b = document.createElement("b"); b.textContent = `${label}: `; p.append(b, document.createTextNode(String(value))); details.append(p); } });
  const actions = document.createElement("div"); actions.className = "request-actions";
  if (item.status === "pending" || !item.status) {
    const approve = document.createElement("button"); approve.className = "btn btn-primary btn-small"; approve.textContent = kind === "exchange" ? "Aprovar troca" : "Aprovar ficha";
    approve.addEventListener("click", () => updateRequest(item, kind, "approved"));
    const reject = document.createElement("button"); reject.className = "btn btn-light btn-small"; reject.textContent = "Recusar";
    reject.addEventListener("click", () => updateRequest(item, kind, "rejected"));
    actions.append(approve, reject);
  }
  card.append(heading, details, actions); return card;
}
function statusLabel(status) { return ({ pending: "Pendente", approved: "Aprovada", rejected: "Recusada" })[status] || "Pendente"; }
async function updateRequest(item, kind, status) {
  try {
    await requireAdmin();
    const collectionName = kind === "exchange" ? "exchangeRequests" : "characterRequests";
    await updateDoc(doc(db, collectionName, item.id), { status, reviewedBy: adminName, updatedAt: serverTimestamp() });
    if (status === "approved") {
      if (kind === "request") {
        await addDoc(collection(db, "members"), { name: item.name || "", age: item.age || "", phoneLast4: item.phoneLast4 || "", character: item.character || "", work: item.work || "", photoUrl: item.photoUrl || "", status: "active", approvedAt: serverTimestamp(), approvedBy: adminName });
        await upsertVacancy(item.character, item.work, false);
      } else {
        await upsertVacancy(item.oldCharacter, item.oldWork, true);
        await upsertVacancy(item.newCharacter, item.newWork, false);
        await addDoc(collection(db, "members"), { name: item.name || "", phoneLast4: item.phoneLast4 || "", character: item.newCharacter || "", work: item.newWork || "", photoUrl: item.newPhotoUrl || "", status: "active", approvedAt: serverTimestamp(), approvedBy: adminName, updatedFromExchange: item.id });
      }
    }
    showAdminMessage(status === "approved" ? "Solicitação atualizada como aprovada." : "Solicitação recusada.", "success");
    await loadAll();
  } catch (error) { console.error(error); showAdminMessage(error.message || "Não foi possível atualizar a solicitação."); }
}
async function upsertVacancy(character, work, open) {
  if (!character) return;
  const snap = await getDocs(collection(db, "vagas"));
  const existing = snap.docs.find(d => String(d.data().character || "").toLowerCase() === String(character).toLowerCase() && String(d.data().work || "").toLowerCase() === String(work || "").toLowerCase());
  const data = { character, work: work || "", open, status: open ? "open" : "closed", updatedAt: serverTimestamp() };
  if (existing) await updateDoc(doc(db, "vagas", existing.id), data);
  else await addDoc(collection(db, "vagas"), { ...data, createdAt: serverTimestamp() });
}
$("#vacancyForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    await requireAdmin();
    const form = new FormData(event.currentTarget);
    await addDoc(collection(db, "vagas"), { character: String(form.get("character")).trim(), work: String(form.get("work")).trim(), open: form.get("open") === "true", status: form.get("open") === "true" ? "open" : "closed", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    event.currentTarget.reset(); showAdminMessage("Vaga adicionada.", "success"); await loadVacancies();
  } catch (error) { showAdminMessage(error.message || "Não foi possível adicionar a vaga."); }
});
async function loadVacancies() {
  if (!isAuthorized) return;
  const el = $("#adminVacanciesList");
  try {
    await requireAdmin();
    const snap = await getDocs(collection(db, "vagas"));
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!rows.length) { el.innerHTML = '<div class="empty-state">Nenhuma vaga cadastrada.</div>'; return; }
    el.replaceChildren(...rows.map(item => {
      const card = document.createElement("article"); card.className = "request-card";
      const title = document.createElement("h3"); title.textContent = item.character || "Personagem";
      const work = document.createElement("p"); work.textContent = item.work || "Obra não informada";
      const badge = document.createElement("span"); const open = item.open === true || item.status === "open"; badge.className = `status ${open ? "open" : "closed"}`; badge.textContent = open ? "Aberta" : "Fechada / ocupada";
      const actions = document.createElement("div"); actions.className = "request-actions";
      const toggle = document.createElement("button"); toggle.className = "btn btn-light btn-small"; toggle.textContent = open ? "Fechar vaga" : "Abrir vaga";
      toggle.addEventListener("click", async () => { try { await requireAdmin(); await updateDoc(doc(db, "vagas", item.id), { open: !open, status: !open ? "open" : "closed", updatedAt: serverTimestamp() }); await loadVacancies(); } catch (e) { showAdminMessage(e.message); } });
      const remove = document.createElement("button"); remove.className = "btn btn-light btn-small"; remove.textContent = "Excluir";
      remove.addEventListener("click", async () => { if (!confirm(`Excluir a vaga ${item.character || ""}?`)) return; try { await requireAdmin(); await deleteDoc(doc(db, "vagas", item.id)); await loadVacancies(); } catch (e) { showAdminMessage(e.message); } });
      actions.append(toggle, remove); card.append(title, work, badge, actions); return card;
    }));
  } catch (error) { el.innerHTML = '<div class="empty-state">Não foi possível carregar vagas. Confira as regras do Firestore.</div>'; }
}
