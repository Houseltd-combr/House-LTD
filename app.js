/* =========================================================
   HOUSE LTD — APP.JS
   PUBLIC INDEX + ADMIN PANEL
   Firebase + Cloudinary
   ========================================================= */

/* =========================================================
   1. CONFIGURAÇÕES
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCRUNymKVh-UxKkSvNEUZkAjmRi_4_AQU",
  authDomain: "house-ltd.firebaseapp.com",
  projectId: "house-ltd",
  storageBucket: "house-ltd.firebasestorage.app",
  messagingSenderId: "821811124213",
  appId: "1:821811124213:web:c8dd2b2f1e1a41bcd632bc",
  measurementId: "G-P28WHBV9VB"
};

const CLOUDINARY_CLOUD_NAME = "gsqmelxb";
const CLOUDINARY_UPLOAD_PRESET = "House LTD";

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


/* =========================================================
   2. CONTAS ADM
   ========================================================= */

const ADMIN_ACCOUNTS = {
  YM7JQ7: {
    name: "Aiko",
    role: "Dono",
    level: 100
  },

  YQ7NM4: {
    name: "Noah",
    role: "Sub-dono",
    level: 90
  },

  JM7XQ8: {
    name: "Shime",
    role: "Líder de Adm",
    level: 80
  },

  Y7KQ2M: {
    name: "Shiro",
    role: "ADM",
    level: 70
  },

  M7IQY5: {
    name: "Isa",
    role: "Staff",
    level: 60
  },

  QY7MH3: {
    name: "Mah",
    role: "ADM",
    level: 70
  },

  Y4JQ7L: {
    name: "Luan",
    role: "ADM",
    level: 70
  },

  K7YQ9M: {
    name: "Ayrken",
    role: "ADM",
    level: 70
  },

  YM4QX7: {
    name: "Evan",
    role: "ADM",
    level: 70
  },

  Q7YTM5: {
    name: "Tamsy",
    role: "ADM",
    level: 70
  },

  JY7QK6: {
    name: "Lucca",
    role: "ADM",
    level: 70
  },

  YQ5M7X: {
    name: "Kally",
    role: "ADM",
    level: 70
  },

  TH1K0L: {
    name: "Lici",
    role: "ADM",
    level: 70
  },

  FB61K5: {
    name: "Belly",
    role: "ADM",
    level: 70
  }
};


/* =========================================================
   3. FIREBASE
   ========================================================= */

let firebaseReady = false;
let firebaseError = null;

let db = null;
let auth = null;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  db = firebase.firestore();
  auth = firebase.auth();

  firebaseReady = true;

} catch (error) {

  firebaseError = error;

  console.error(
    "Erro ao iniciar Firebase:",
    error
  );
}


/* =========================================================
   4. ESTADO
   ========================================================= */

const state = {
  admin: null,

  requests: [],
  vacancies: [],
  members: [],
  admins: [],
  logs: [],
  chat: [],

  currentView: "home",

  publicVacancies: [],
  publicMembers: []
};


/* =========================================================
   5. HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase();
}


function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function getTimestamp() {
  if (
    typeof firebase !== "undefined" &&
    firebase.firestore &&
    firebase.firestore.FieldValue
  ) {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  return new Date();
}


function formatDateTime(value) {

  if (!value) {
    return "—";
  }

  try {

    if (value.toDate) {
      value = value.toDate();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("pt-BR");

  } catch {

    return "—";
  }
}


function isOpenVacancy(vacancy) {

  if (!vacancy) {
    return false;
  }

  if (typeof vacancy.open === "boolean") {
    return vacancy.open;
  }

  if (typeof vacancy.aberta === "boolean") {
    return vacancy.aberta;
  }

  if (typeof vacancy.status === "string") {

    const status =
      normalizeText(vacancy.status);

    return (
      status === "aberta" ||
      status === "open" ||
      status === "disponivel"
    );
  }

  return true;
}


function vacancyCharacter(vacancy) {

  return (
    vacancy.character ||
    vacancy.personagem ||
    vacancy.name ||
    vacancy.nome ||
    ""
  );
}


function vacancyWork(vacancy) {

  return (
    vacancy.work ||
    vacancy.obra ||
    vacancy.anime ||
    ""
  );
}


function vacancyPhoto(vacancy) {

  return (
    vacancy.photo ||
    vacancy.image ||
    vacancy.imagem ||
    vacancy.imageUrl ||
    ""
  );
}


function memberName(member) {

  return (
    member.name ||
    member.nome ||
    member.nickname ||
    member.apelido ||
    "Membro"
  );
}


function memberCharacter(member) {

  return (
    member.character ||
    member.personagem ||
    ""
  );
}


function memberWork(member) {

  return (
    member.work ||
    member.obra ||
    ""
  );
}


function memberPhoto(member) {

  return (
    member.photo ||
    member.image ||
    member.imageUrl ||
    ""
  );
}


/* =========================================================
   6. LOADING — CORREÇÃO PRINCIPAL
   ========================================================= */

function finishPublicLoading() {

  const loading =
    $("loadingScreen");

  if (!loading) {
    return;
  }

  loading.classList.add("hide");
  loading.classList.add("hidden");

  loading.style.opacity = "0";
  loading.style.visibility = "hidden";
  loading.style.pointerEvents = "none";

  setTimeout(() => {

    if (loading) {
      loading.style.display = "none";
    }

  }, 600);
}


/*
  IMPORTANTE:

  O loading da página pública NÃO pode depender de:
  - Firebase
  - Auth
  - Firestore
  - Cloudinary
  - carregamento das vagas

  A página precisa abrir mesmo que algum desses serviços falhe.
*/

function publicLoadingFailsafe() {

  finishPublicLoading();

  setTimeout(
    finishPublicLoading,
    500
  );

  setTimeout(
    finishPublicLoading,
    1500
  );

  setTimeout(
    finishPublicLoading,
    3000
  );
}


/* =========================================================
   7. SESSION ADM
   ========================================================= */

function getStoredAdmin() {

  try {

    const raw =
      sessionStorage.getItem(
        "house_ltd_admin"
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);

  } catch {

    return null;
  }
}


function storeAdmin(admin) {

  try {

    sessionStorage.setItem(
      "house_ltd_admin",
      JSON.stringify(admin)
    );

  } catch {}
}


function clearStoredAdmin() {

  try {

    sessionStorage.removeItem(
      "house_ltd_admin"
    );

  } catch {}
}


/* =========================================================
   8. LOGIN
   ========================================================= */

function showLogin() {

  const loginView =
    $("loginView");

  const appView =
    $("appView");

  if (loginView) {
    loginView.classList.remove(
      "hidden"
    );
  }

  if (appView) {
    appView.classList.add(
      "hidden"
    );
  }
}


function showApp() {

  const loginView =
    $("loginView");

  const appView =
    $("appView");

  if (loginView) {
    loginView.classList.add(
      "hidden"
    );
  }

  if (appView) {
    appView.classList.remove(
      "hidden"
    );
  }
}


function loginAdmin() {

  const input =
    $("adminCode");

  const message =
    $("loginMsg");

  if (!input) {
    return;
  }

  const code =
    normalizeCode(
      input.value
    );

  const account =
    ADMIN_ACCOUNTS[code];

  if (!account) {

    if (message) {

      message.textContent =
        "Código inválido.";

      message.classList.add(
        "error"
      );
    }

    input.value = "";

    return;
  }

  state.admin = {
    ...account,
    code
  };

  storeAdmin(
    state.admin
  );

  if (message) {

    message.textContent =
      "";

    message.classList.remove(
      "error"
    );
  }

  showApp();

  startAdminSession();
}


async function logoutAdmin() {

  clearStoredAdmin();

  state.admin = null;

  try {

    if (
      auth &&
      auth.currentUser
    ) {
      await auth.signOut();
    }

  } catch {}

  location.reload();
}


/* =========================================================
   9. AUTH ANÔNIMO
   ========================================================= */

async function ensureAnonymousAuth() {

  if (
    !firebaseReady ||
    !auth
  ) {
    return false;
  }

  try {

    if (!auth.currentUser) {

      await auth.signInAnonymously();
    }

    return true;

  } catch (error) {

    console.warn(
      "Firebase Auth:",
      error
    );

    return false;
  }
}


/* =========================================================
   10. CLOUDINARY
   ========================================================= */

async function uploadToCloudinary(file) {

  if (!file) {
    throw new Error(
      "Nenhuma imagem selecionada."
    );
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "O arquivo precisa ser uma imagem."
    );
  }

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );

  const response =
    await fetch(
      CLOUDINARY_UPLOAD_URL,
      {
        method: "POST",
        body: formData
      }
    );

  if (!response.ok) {

    throw new Error(
      `Erro no Cloudinary: ${response.status}`
    );
  }

  const data =
    await response.json();

  if (!data.secure_url) {

    throw new Error(
      "O Cloudinary não retornou a imagem."
    );
  }

  return data.secure_url;
}


/* =========================================================
   11. PREVIEW DE IMAGEM
   ========================================================= */

function setupImagePreview(
  inputId,
  previewId,
  placeholderId
) {

  const input =
    $(inputId);

  const preview =
    $(previewId);

  const placeholder =
    $(placeholderId);

  if (!input) {
    return;
  }

  input.addEventListener(
    "change",
    () => {

      const file =
        input.files?.[0];

      if (!file) {

        if (preview) {

          preview.style.display =
            "none";

          preview.removeAttribute(
            "src"
          );
        }

        if (placeholder) {

          placeholder.style.display =
            "";
        }

        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        input.value = "";

        if (preview) {
          preview.style.display =
            "none";
        }

        if (placeholder) {
          placeholder.style.display =
            "";
        }

        alert(
          "Selecione uma imagem válida."
        );

        return;
      }

      const url =
        URL.createObjectURL(
          file
        );

      if (preview) {

        preview.src =
          url;

        preview.style.display =
          "block";
      }

      if (placeholder) {

        placeholder.style.display =
          "none";
      }
    }
  );
}


/* =========================================================
   12. COLEÇÃO FIREBASE
   ========================================================= */

async function getCollection(
  collectionName
) {

  if (!db) {
    return [];
  }

  try {

    const snapshot =
      await db
        .collection(
          collectionName
        )
        .get();

    return snapshot.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data()
      })
    );

  } catch (error) {

    console.warn(
      `Erro ao carregar ${collectionName}:`,
      error
    );

    return [];
  }
}


/* =========================================================
   13. VAGAS PÚBLICAS
   ========================================================= */

async function getPublicVacancies() {

  if (!db) {
    return [];
  }

  const result = [];

  const collections = [
    "vagas",
    "occupiedCharacters"
  ];

  for (
    const collectionName
    of collections
  ) {

    try {

      const snapshot =
        await db
          .collection(
            collectionName
          )
          .get();

      snapshot.forEach(
        doc => {

          const data = {
            id: doc.id,
            ...doc.data()
          };

          const alreadyExists =
            result.some(item => {

              const characterA =
                normalizeText(
                  vacancyCharacter(
                    item
                  )
                );

              const characterB =
                normalizeText(
                  vacancyCharacter(
                    data
                  )
                );

              const workA =
                normalizeText(
                  vacancyWork(
                    item
                  )
                );

              const workB =
                normalizeText(
                  vacancyWork(
                    data
                  )
                );

              return (
                characterA ===
                  characterB &&
                workA ===
                  workB
              );
            });

          if (!alreadyExists) {
            result.push(data);
          }
        }
      );

      if (result.length) {
        break;
      }

    } catch (error) {

      console.warn(
        `Erro em ${collectionName}:`,
        error
      );
    }
  }

  return result;
}


function createVacancyCard(
  vacancy,
  closed
) {

  const character =
    vacancyCharacter(
      vacancy
    );

  const work =
    vacancyWork(
      vacancy
    );

  const photo =
    vacancyPhoto(
      vacancy
    );

  const image =
    photo
      ? `
        <img
          src="${escapeHTML(photo)}"
          alt="${escapeHTML(character)}"
          loading="lazy"
        >
      `
      : `
        <div class="vacancy-placeholder">
          LTD
        </div>
      `;

  return `
    <article
      class="vacancy-card ${
        closed
          ? "closed"
          : "open"
      }"
    >

      <div class="vacancy-image">
        ${image}
      </div>

      <div class="vacancy-info">

        <h3>
          ${escapeHTML(
            character ||
            "Personagem"
          )}
        </h3>

        ${
          work
            ? `
              <p>
                ${escapeHTML(work)}
              </p>
            `
            : ""
        }

        <span class="vacancy-status">
          ${
            closed
              ? "Vaga fechada"
              : "Vaga aberta"
          }
        </span>

      </div>

    </article>
  `;
}


function renderPublicVacancies(
  vacancies
) {

  state.publicVacancies =
    vacancies || [];

  const openContainer =
    $("openVacancies");

  const closedContainer =
    $("closedVacancies");

  const open =
    state.publicVacancies.filter(
      vacancy =>
        isOpenVacancy(
          vacancy
        )
    );

  const closed =
    state.publicVacancies.filter(
      vacancy =>
        !isOpenVacancy(
          vacancy
        )
    );

  if (openContainer) {

    openContainer.innerHTML =
      open.length

        ? open
            .map(
              vacancy =>
                createVacancyCard(
                  vacancy,
                  false
                )
            )
            .join("")

        : `
          <div class="empty-card">
            Nenhuma vaga aberta no momento.
          </div>
        `;
  }

  if (closedContainer) {

    closedContainer.innerHTML =
      closed.length

        ? closed
            .map(
              vacancy =>
                createVacancyCard(
                  vacancy,
                  true
                )
            )
            .join("")

        : `
          <div class="empty-card">
            Nenhuma vaga fechada no momento.
          </div>
        `;
  }
}


/* =========================================================
   14. MEMBROS PÚBLICOS
   ========================================================= */

async function getPublicMembers() {

  if (!db) {
    return [];
  }

  return getCollection(
    "members"
  );
}


function createPublicMemberCard(
  member
) {

  const name =
    memberName(
      member
    );

  const character =
    memberCharacter(
      member
    );

  const work =
    memberWork(
      member
    );

  const photo =
    memberPhoto(
      member
    );

  return `
    <article
      class="member-card"
      data-member-search="${escapeHTML(
        `${name} ${character} ${work}`
      )}"
    >

      <div class="member-photo">

        ${
          photo

            ? `
              <img
                src="${escapeHTML(photo)}"
                alt="${escapeHTML(name)}"
                loading="lazy"
              >
            `

            : `
              <div class="member-placeholder">
                ${escapeHTML(
                  name
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
            `
        }

      </div>

      <div class="member-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        ${
          character
            ? `
              <p>
                ${escapeHTML(character)}
              </p>
            `
            : ""
        }

        ${
          work
            ? `
              <small>
                ${escapeHTML(work)}
              </small>
            `
            : ""
        }

      </div>

    </article>
  `;
}


function renderPublicMembers(
  members
) {

  state.publicMembers =
    members || [];

  const container =
    $("membersList");

  if (!container) {
    return;
  }

  if (
    !state.publicMembers.length
  ) {

    container.innerHTML = `
      <div class="empty-card">
        Nenhum membro cadastrado ainda.
      </div>
    `;

    return;
  }

  container.innerHTML =
    state.publicMembers
      .map(
        createPublicMemberCard
      )
      .join("");
}


function filterPublicMembers() {

  const input =
    $("memberSearch");

  const container =
    $("membersList");

  if (
    !input ||
    !container
  ) {
    return;
  }

  const query =
    normalizeText(
      input.value
    );

  container
    .querySelectorAll(
      ".member-card"
    )
    .forEach(card => {

      const text =
        normalizeText(
          card.dataset
            .memberSearch ||
            ""
        );

      card.style.display =
        !query ||
        text.includes(query)
          ? ""
          : "none";
    });
}


/* =========================================================
   15. FORMULÁRIO DE FICHA
   ========================================================= */

async function submitRequestForm(
  event
) {

  event.preventDefault();

  const form =
    event.currentTarget;

  const status =
    $("requestStatus");

  const file =
    $("requestPhoto")
      ?.files?.[0];

  const name =
    $("requestName")
      ?.value
      .trim() || "";

  const age =
    $("requestAge")
      ?.value
      .trim() || "";

  const phone =
    $("requestPhone")
      ?.value
      .trim() || "";

  const character =
    $("requestCharacter")
      ?.value
      .trim() || "";

  const work =
    $("requestWork")
      ?.value
      .trim() || "";

  const message =
    $("requestMessage")
      ?.value
      .trim() || "";

  if (
    !age ||
    phone.length !== 4 ||
    !character ||
    !work
  ) {

    if (status) {

      status.textContent =
        "Preencha corretamente todos os campos obrigatórios.";
    }

    return;
  }

  if (!file) {

    if (status) {

      status.textContent =
        "Envie a foto do personagem.";
    }

    return;
  }

  if (!db) {

    if (status) {

      status.textContent =
        "O banco de dados não está disponível.";
    }

    return;
  }

  const button =
    form.querySelector(
      'button[type="submit"]'
    );

  const originalText =
    button?.textContent ||
    "";

  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "Enviando...";
    }

    if (status) {

      status.textContent =
        "Enviando imagem...";
    }

    const photo =
      await uploadToCloudinary(
        file
      );

    await db
      .collection(
        "characterRequests"
      )
      .add({

        name,
        age,

        phone:
          phone.slice(-4),

        character,
        work,
        photo,
        message,

        type:
          "request",

        status:
          "pending",

        createdAt:
          getTimestamp(),

        updatedAt:
          getTimestamp()
      });

    form.reset();

    const preview =
      $("requestPhotoPreview");

    const placeholder =
      $("requestPhotoPlaceholder");

    if (preview) {

      preview.removeAttribute(
        "src"
      );

      preview.style.display =
        "none";
    }

    if (placeholder) {

      placeholder.style.display =
        "";
    }

    if (status) {

      status.textContent =
        "Ficha enviada com sucesso! Aguarde a aprovação.";
    }

  } catch (error) {

    console.error(
      "Erro ao enviar ficha:",
      error
    );

    if (status) {

      status.textContent =
        "Não foi possível enviar a ficha. Tente novamente.";
    }

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText;
    }
  }
}


/* =========================================================
   16. TROCA
   ========================================================= */

async function submitExchangeForm(
  event
) {

  event.preventDefault();

  const form =
    event.currentTarget;

  const status =
    $("exchangeStatus");

  const phone =
    $("exchangePhone")
      ?.value
      .trim() || "";

  const oldCharacter =
    $("exchangeOldCharacter")
      ?.value
      .trim() || "";

  const oldWork =
    $("exchangeOldWork")
      ?.value
      .trim() || "";

  const newCharacter =
    $("exchangeNewCharacter")
      ?.value
      .trim() || "";

  const newWork =
    $("exchangeNewWork")
      ?.value
      .trim() || "";

  const file =
    $("exchangePhoto")
      ?.files?.[0];

  if (
    phone.length !== 4 ||
    !oldCharacter ||
    !oldWork ||
    !newCharacter ||
    !newWork
  ) {

    if (status) {

      status.textContent =
        "Preencha corretamente todos os campos obrigatórios.";
    }

    return;
  }

  if (!file) {

    if (status) {

      status.textContent =
        "Envie a foto do novo personagem.";
    }

    return;
  }

  if (!db) {

    if (status) {

      status.textContent =
        "O banco de dados não está disponível.";
    }

    return;
  }

  const button =
    form.querySelector(
      'button[type="submit"]'
    );

  const originalText =
    button?.textContent ||
    "";

  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "Enviando...";
    }

    if (status) {

      status.textContent =
        "Enviando imagem...";
    }

    const photo =
      await uploadToCloudinary(
        file
      );

    await db
      .collection(
        "characterRequests"
      )
      .add({

        type:
          "exchange",

        status:
          "pending",

        phone:
          phone.slice(-4),

        oldCharacter,
        oldWork,

        character:
          newCharacter,

        work:
          newWork,

        photo,

        createdAt:
          getTimestamp(),

        updatedAt:
          getTimestamp()
      });

    form.reset();

    const preview =
      $("exchangePhotoPreview");

    const placeholder =
      $("exchangePhotoPlaceholder");

    if (preview) {

      preview.removeAttribute(
        "src"
      );

      preview.style.display =
        "none";
    }

    if (placeholder) {

      placeholder.style.display =
        "";
    }

    if (status) {

      status.textContent =
        "Solicitação de troca enviada com sucesso!";
    }

  } catch (error) {

    console.error(
      "Erro na troca:",
      error
    );

    if (status) {

      status.textContent =
        "Não foi possível enviar a troca.";
    }

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText;
    }
  }
}


/* =========================================================
   17. DADOS PÚBLICOS
   ========================================================= */

async function loadPublicData() {

  try {

    const vacancies =
      await getPublicVacancies();

    renderPublicVacancies(
      vacancies
    );

  } catch (error) {

    console.warn(
      "Vagas públicas:",
      error
    );

    renderPublicVacancies([]);
  }


  try {

    const members =
      await getPublicMembers();

    renderPublicMembers(
      members
    );

  } catch (error) {

    console.warn(
      "Membros públicos:",
      error
    );

    renderPublicMembers([]);
  }
}


/* =========================================================
   18. ADMIN — STATS
   ========================================================= */

function renderStats() {

  const pending =
    state.requests.filter(
      request =>
        !request.status ||
        normalizeText(
          request.status
        ) === "pending"
    ).length;

  const open =
    state.vacancies.filter(
      isOpenVacancy
    ).length;

  const closed =
    state.vacancies.filter(
      vacancy =>
        !isOpenVacancy(vacancy)
    ).length;

  const members =
    state.members.length;

  const values = {
    pending,
    open,
    closed,
    members
  };

  Object.entries(
    values
  ).forEach(
    ([key, value]) => {

      document
        .querySelectorAll(
          `[data-stat="${key}"]`
        )
        .forEach(
          element => {
            element.textContent =
              value;
          }
        );
    }
  );


  const ids = {

    pending: [
      "statRequests",
      "statPending",
      "pendingCount"
    ],

    open: [
      "statOpen",
      "openCount"
    ],

    closed: [
      "statClosed",
      "closedCount"
    ],

    members: [
      "statMembers",
      "membersCount"
    ]
  };


  Object.entries(
    ids
  ).forEach(
    ([key, list]) => {

      list.forEach(
        id => {

          const element =
            $(id);

          if (element) {

            element.textContent =
              values[key];
          }
        }
      );
    }
  );
}


/* =========================================================
   19. ADMIN — SOLICITAÇÕES
   ========================================================= */

function renderRequests() {

  const container =
    $("requestsList");

  if (!container) {
    return;
  }

  const pending =
    state.requests.filter(
      request =>
        !request.status ||
        normalizeText(
          request.status
        ) === "pending"
    );


  if (!pending.length) {

    container.innerHTML = `
      <div class="empty-state">
        Nenhuma solicitação pendente.
      </div>
    `;

    return;
  }


  container.innerHTML =
    pending
      .map(
        request => {

          const character =
            request.character ||
            request.personagem ||
            "";

          const work =
            request.work ||
            request.obra ||
            "";

          const image =
            request.photo ||
            request.image ||
            "";

          return `
            <article
              class="request-card"
              data-request-id="${escapeHTML(
                request.id
              )}"
            >

              <div class="request-photo">

                ${
                  image

                    ? `
                      <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(character)}"
                      >
                    `

                    : `
                      <div class="member-placeholder">
                        LTD
                      </div>
                    `
                }

              </div>


              <div class="request-info">

                <h3>
                  ${escapeHTML(
                    character ||
                    "Sem personagem"
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    work
                  )}
                </p>

                ${
                  request.name
                    ? `
                      <p>
                        <strong>Nome:</strong>
                        ${escapeHTML(
                          request.name
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  request.age
                    ? `
                      <p>
                        <strong>Idade:</strong>
                        ${escapeHTML(
                          request.age
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  request.phone
                    ? `
                      <p>
                        <strong>Final:</strong>
                        ${escapeHTML(
                          request.phone
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  request.type ===
                  "exchange"

                    ? `
                      <p>
                        <strong>Troca:</strong>
                        ${escapeHTML(
                          request.oldCharacter ||
                          ""
                        )}
                        —
                        ${escapeHTML(
                          request.oldWork ||
                          ""
                        )}
                      </p>
                    `

                    : ""
                }

                <small>
                  ${formatDateTime(
                    request.createdAt
                  )}
                </small>

              </div>


              <div class="request-actions">

                <button
                  type="button"
                  data-approve="${escapeHTML(
                    request.id
                  )}"
                >
                  Aprovar
                </button>

                <button
                  type="button"
                  data-reject="${escapeHTML(
                    request.id
                  )}"
                >
                  Recusar
                </button>

              </div>

            </article>
          `;
        }
      )
      .join("");
}


/* =========================================================
   20. ADMIN — VAGAS
   ========================================================= */

function renderVacancies() {

  const container =
    $("vacanciesList");

  if (!container) {
    return;
  }


  if (!state.vacancies.length) {

    container.innerHTML = `
      <div class="empty-state">
        Nenhuma vaga cadastrada.
      </div>
    `;

    return;
  }


  container.innerHTML =
    state.vacancies
      .map(
        vacancy => {

          const character =
            vacancyCharacter(
              vacancy
            );

          const work =
            vacancyWork(
              vacancy
            );

          const image =
            vacancyPhoto(
              vacancy
            );

          const open =
            isOpenVacancy(
              vacancy
            );


          return `
            <article
              class="admin-vacancy-card"
              data-vacancy-id="${escapeHTML(
                vacancy.id
              )}"
            >

              <div class="vacancy-image">

                ${
                  image

                    ? `
                      <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(character)}"
                      >
                    `

                    : `
                      <div class="vacancy-placeholder">
                        LTD
                      </div>
                    `
                }

              </div>


              <div class="vacancy-info">

                <h3>
                  ${escapeHTML(
                    character ||
                    "Sem nome"
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    work
                  )}
                </p>

                <span>
                  ${
                    open
                      ? "Vaga aberta"
                      : "Vaga fechada"
                  }
                </span>

              </div>


              <div class="vacancy-actions">

                <button
                  type="button"
                  data-edit-vacancy="${escapeHTML(
                    vacancy.id
                  )}"
                >
                  Editar
                </button>

                <button
                  type="button"
                  data-toggle-vacancy="${escapeHTML(
                    vacancy.id
                  )}"
                >
                  ${
                    open
                      ? "Fechar"
                      : "Abrir"
                  }
                </button>

                <button
                  type="button"
                  data-delete-vacancy="${escapeHTML(
                    vacancy.id
                  )}"
                >
                  Excluir
                </button>

              </div>

            </article>
          `;
        }
      )
      .join("");
}


/* =========================================================
   21. ADMIN — MEMBROS
   ========================================================= */

function renderMembers() {

  if (
    document.body.dataset.page !==
    "admin"
  ) {
    return;
  }

  const container =
    $("adminMembersList") ||
    $("membersAdminList") ||
    $("membersListAdmin") ||
    $("membersList");

  if (!container) {
    return;
  }


  if (!state.members.length) {

    container.innerHTML = `
      <div class="empty-state">
        Nenhum membro cadastrado.
      </div>
    `;

    return;
  }


  container.innerHTML =
    state.members
      .map(
        member => {

          const name =
            memberName(
              member
            );

          const character =
            memberCharacter(
              member
            );

          const work =
            memberWork(
              member
            );

          const image =
            memberPhoto(
              member
            );


          return `
            <article class="member-card">

              <div class="member-photo">

                ${
                  image

                    ? `
                      <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(name)}"
                      >
                    `

                    : `
                      <div class="member-placeholder">
                        ${escapeHTML(
                          name
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>
                    `
                }

              </div>


              <div class="member-info">

                <h3>
                  ${escapeHTML(name)}
                </h3>

                <p>
                  ${escapeHTML(
                    character
                  )}
                </p>

                <small>
                  ${escapeHTML(
                    work
                  )}
                </small>

              </div>

            </article>
          `;
        }
      )
      .join("");
}


/* =========================================================
   22. ADMIN — ADMS
   ========================================================= */

function renderAdmins() {

  const container =
    $("adminsList") ||
    $("adminList");

  if (!container) {
    return;
  }


  container.innerHTML =
    Object.values(
      ADMIN_ACCOUNTS
    )
      .map(
        account => `
          <article class="admin-card">

            <div class="admin-photo">

              <div class="member-placeholder">
                ${escapeHTML(
                  account.name
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

            </div>

            <div>

              <h3>
                ${escapeHTML(
                  account.name
                )}
              </h3>

              <p>
                ${escapeHTML(
                  account.role
                )}
              </p>

            </div>

          </article>
        `
      )
      .join("");
}


/* =========================================================
   23. ADMIN — CHAT
   ========================================================= */

function renderChat() {

  const container =
    $("chatList") ||
    $("chatMessages") ||
    $("adminChatMessages");

  if (!container) {
    return;
  }


  if (!state.chat.length) {

    container.innerHTML = `
      <div class="empty-state">
        Nenhuma mensagem ainda.
      </div>
    `;

    return;
  }


  const sorted =
    [...state.chat].sort(
      (a, b) => {

        const ad =
          a.createdAt?.toDate?.() ||
          new Date(
            a.createdAt || 0
          );

        const bd =
          b.createdAt?.toDate?.() ||
          new Date(
            b.createdAt || 0
          );

        return ad - bd;
      }
    );


  container.innerHTML =
    sorted
      .map(
        message => `
          <div class="chat-message">

            <strong>
              ${escapeHTML(
                message.adminName ||
                message.name ||
                "ADM"
              )}
            </strong>

            <p>
              ${escapeHTML(
                message.message ||
                message.text ||
                ""
              )}
            </p>

            <small>
              ${formatDateTime(
                message.createdAt
              )}
            </small>

          </div>
        `
      )
      .join("");
}


/* =========================================================
   24. ADMIN — LOGS
   ========================================================= */

function renderLogs() {

  const container =
    $("logsList") ||
    $("accessLogsList");

  if (!container) {
    return;
  }


  if (!state.logs.length) {

    container.innerHTML = `
      <div class="empty-state">
        Nenhum registro.
      </div>
    `;

    return;
  }


  const sorted =
    [...state.logs].sort(
      (a, b) => {

        const ad =
          b.createdAt?.toDate?.() ||
          new Date(
            b.createdAt || 0
          );

        const bd =
          a.createdAt?.toDate?.() ||
          new Date(
            a.createdAt || 0
          );

        return ad - bd;
      }
    );


  container.innerHTML =
    sorted
      .map(
        log => `
          <div class="log-item">

            <strong>
              ${escapeHTML(
                log.action ||
                log.type ||
                "Ação"
              )}
            </strong>

            <p>
              ${escapeHTML(
                log.description ||
                log.message ||
                ""
              )}
            </p>

            <small>
              ${escapeHTML(
                log.adminName ||
                "Sistema"
              )}
              —
              ${formatDateTime(
                log.createdAt
              )}
            </small>

          </div>
        `
      )
      .join("");
}


/* =========================================================
   25. LOG
   ========================================================= */

async function createLog(
  action,
  description
) {

  if (!db) {
    return;
  }

  try {

    await db
      .collection(
        "accessLogs"
      )
      .add({

        action,
        description,

        adminName:
          state.admin?.name ||
          "Sistema",

        adminCode:
          state.admin?.code ||
          null,

        createdAt:
          getTimestamp()
      });

  } catch (error) {

    console.warn(
      "Erro ao criar log:",
      error
    );
  }
}


/* =========================================================
   26. VAGA — ENCONTRAR
   ========================================================= */

function findMatchingVacancy(
  character,
  work
) {

  const c =
    normalizeText(
      character
    );

  const w =
    normalizeText(
      work
    );

  return state.vacancies.find(
    vacancy =>

      normalizeText(
        vacancyCharacter(
          vacancy
        )
      ) === c &&

      normalizeText(
        vacancyWork(
          vacancy
        )
      ) === w
  );
}


async function findVacancyInFirestore(
  character,
  work
) {

  const local =
    findMatchingVacancy(
      character,
      work
    );

  if (local) {
    return local;
  }

  if (!db) {
    return null;
  }

  try {

    const vacancies =
      await getCollection(
        "vagas"
      );

    return (
      vacancies.find(
        vacancy =>

          normalizeText(
            vacancyCharacter(
              vacancy
            )
          ) ===
          normalizeText(
            character
          ) &&

          normalizeText(
            vacancyWork(
              vacancy
            )
          ) ===
          normalizeText(
            work
          )
      ) || null
    );

  } catch {

    return null;
  }
}


/* =========================================================
   27. APROVAÇÃO — CRIAR MEMBRO
   ========================================================= */

async function createMemberFromRequest(
  request
) {

  if (!db) {
    throw new Error(
      "Firebase não disponível."
    );
  }


  const phone =
    String(
      request.phone ||
      ""
    ).slice(-4);


  const existing =
    state.members.find(
      member => {

        const memberPhone =
          String(
            member.phone ||
            member.phoneLast4 ||
            ""
          ).slice(-4);

        return (
          normalizeText(
            memberCharacter(
              member
            )
          ) ===
          normalizeText(
            request.character ||
            request.personagem
          ) &&

          memberPhone ===
          phone
        );
      }
    );


  if (existing) {
    return existing.id;
  }


  const data = {

    name:
      request.name ||
      request.nome ||
      request.nickname ||
      request.apelido ||
      "",

    age:
      request.age ||
      request.idade ||
      "",

    phone,

    character:
      request.character ||
      request.personagem ||
      "",

    work:
      request.work ||
      request.obra ||
      "",

    photo:
      request.photo ||
      request.image ||
      "",

    createdAt:
      getTimestamp(),

    updatedAt:
      getTimestamp()
  };


  const ref =
    await db
      .collection(
        "members"
      )
      .add(data);


  return ref.id;
}


/* =========================================================
   28. APROVAÇÃO — FECHAR VAGA
   ========================================================= */

async function closeVacancyFromApproval(
  request
) {

  const character =
    request.character ||
    request.personagem ||
    "";

  const work =
    request.work ||
    request.obra ||
    "";


  let vacancy =
    await findVacancyInFirestore(
      character,
      work
    );


  if (vacancy) {

    await db
      .collection(
        "vagas"
      )
      .doc(
        vacancy.id
      )
      .set(
        {

          character:
            character ||
            vacancyCharacter(
              vacancy
            ),

          work:
            work ||
            vacancyWork(
              vacancy
            ),

          photo:
            request.photo ||
            vacancyPhoto(
              vacancy
            ) ||
            "",

          open:
            false,

          status:
            "closed",

          updatedAt:
            getTimestamp()

        },
        {
          merge: true
        }
      );

    return;
  }


  await db
    .collection(
      "vagas"
    )
    .add({

      character,
      work,

      photo:
        request.photo ||
        "",

      open:
        false,

      status:
        "closed",

      createdAt:
        getTimestamp(),

      updatedAt:
        getTimestamp()
    });
}


/* =========================================================
   29. SOLICITAÇÃO
   ========================================================= */

async function findRequestCollection(
  requestId
) {

  if (!db) {
    return null;
  }


  for (
    const collectionName
    of [
      "characterRequests",
      "requests"
    ]
  ) {

    try {

      const doc =
        await db
          .collection(
            collectionName
          )
          .doc(
            requestId
          )
          .get();

      if (doc.exists) {

        return {

          collection:
            collectionName,

          id:
            requestId,

          data:
            doc.data()
        };
      }

    } catch {}
  }


  return null;
}


/* =========================================================
   30. APROVAR
   ========================================================= */

async function approveRequest(
  requestId
) {

  if (!db) {

    alert(
      "O Firebase não está disponível."
    );

    return;
  }


  const requestInfo =
    await findRequestCollection(
      requestId
    );


  if (!requestInfo) {

    alert(
      "Solicitação não encontrada."
    );

    return;
  }


  const request =
    requestInfo.data;


  try {

    /*
      FICHA NORMAL
    */

    if (
      request.type !==
      "exchange"
    ) {

      await createMemberFromRequest(
        request
      );

      await closeVacancyFromApproval(
        request
      );

    }

    /*
      TROCA
    */

    else {

      const oldCharacter =
        request.oldCharacter ||
        "";

      const oldWork =
        request.oldWork ||
        "";

      const newCharacter =
        request.character ||
        "";

      const newWork =
        request.work ||
        "";


      const members =
        await getCollection(
          "members"
        );


      const member =
        members.find(
          item =>

            String(
              item.phone ||
              item.phoneLast4 ||
              ""
            ).slice(-4) ===
            String(
              request.phone ||
              ""
            ).slice(-4) &&

            normalizeText(
              memberCharacter(
                item
              )
            ) ===
            normalizeText(
              oldCharacter
            )
        );


      if (!member) {

        throw new Error(
          "Membro da troca não foi encontrado."
        );
      }


      const oldVacancy =
        await findVacancyInFirestore(
          oldCharacter,
          oldWork
        );


      if (oldVacancy) {

        await db
          .collection(
            "vagas"
          )
          .doc(
            oldVacancy.id
          )
          .set(
            {

              open:
                true,

              status:
                "open",

              updatedAt:
                getTimestamp()

            },
            {
              merge: true
            }
          );
      }


      const newVacancy =
        await findVacancyInFirestore(
          newCharacter,
          newWork
        );


      if (newVacancy) {

        await db
          .collection(
            "vagas"
          )
          .doc(
            newVacancy.id
          )
          .set(
            {

              open:
                false,

              status:
                "closed",

              photo:
                request.photo ||
                vacancyPhoto(
                  newVacancy
                ),

              updatedAt:
                getTimestamp()

            },
            {
              merge: true
            }
          );

      } else {

        await db
          .collection(
            "vagas"
          )
          .add({

            character:
              newCharacter,

            work:
              newWork,

            photo:
              request.photo ||
              "",

            open:
              false,

            status:
              "closed",

            createdAt:
              getTimestamp(),

            updatedAt:
              getTimestamp()
          });
      }


      await db
        .collection(
          "members"
        )
        .doc(
          member.id
        )
        .set(
          {

            character:
              newCharacter,

            work:
              newWork,

            photo:
              request.photo ||
              memberPhoto(
                member
              ),

            updatedAt:
              getTimestamp()

          },
          {
            merge: true
          }
        );
    }


    /*
      MARCA SOLICITAÇÃO COMO APROVADA
    */

    await db
      .collection(
        requestInfo.collection
      )
      .doc(
        requestInfo.id
      )
      .set(
        {

          status:
            "approved",

          approvedAt:
            getTimestamp(),

          approvedBy:
            state.admin?.name ||
            "ADM",

          updatedAt:
            getTimestamp()

        },
        {
          merge: true
        }
      );


    await createLog(
      "Aprovação de solicitação",
      `Solicitação de ${
        request.character ||
        request.personagem ||
        "personagem"
      } aprovada.`
    );


    await refreshAll();


    alert(
      "Solicitação aprovada!"
    );

  } catch (error) {

    console.error(
      "Erro ao aprovar:",
      error
    );

    alert(
      "Não foi possível aprovar a solicitação.\n\n" +
      (
        error.message ||
        error
      )
    );
  }
}


/* =========================================================
   31. RECUSAR
   ========================================================= */

async function rejectRequest(
  requestId
) {

  if (!db) {
    return;
  }


  const requestInfo =
    await findRequestCollection(
      requestId
    );


  if (!requestInfo) {
    return;
  }


  try {

    await db
      .collection(
        requestInfo.collection
      )
      .doc(
        requestInfo.id
      )
      .set(
        {

          status:
            "rejected",

          rejectedAt:
            getTimestamp(),

          rejectedBy:
            state.admin?.name ||
            "ADM",

          updatedAt:
            getTimestamp()

        },
        {
          merge: true
        }
      );


    await createLog(
      "Recusa de solicitação",
      `Solicitação de ${
        requestInfo.data.character ||
        "personagem"
      } recusada.`
    );


    await refreshAll();

  } catch (error) {

    console.error(
      "Erro ao recusar:",
      error
    );

    alert(
      "Não foi possível recusar a solicitação."
    );
  }
}


/* =========================================================
   32. SALVAR VAGA
   ========================================================= */

async function saveVacancy(
  vacancyId = null
) {

  if (!db) {
    return;
  }


  const characterInput =
    $("vacCharacter") ||
    $("vacancyCharacter");

  const workInput =
    $("vacWork") ||
    $("vacancyWork");

  const imageInput =
    $("vacImage") ||
    $("vacancyPhoto");


  const character =
    characterInput
      ?.value
      .trim() || "";

  const work =
    workInput
      ?.value
      .trim() || "";

  const file =
    imageInput
      ?.files?.[0];


  if (
    !character ||
    !work
  ) {

    alert(
      "Preencha personagem e obra."
    );

    return;
  }


  try {

    let image = "";


    if (file) {

      image =
        await uploadToCloudinary(
          file
        );
    }


    const data = {

      character,
      work,

      updatedAt:
        getTimestamp()
    };


    if (image) {

      data.photo =
        image;
    }


    if (vacancyId) {

      await db
        .collection(
          "vagas"
        )
        .doc(
          vacancyId
        )
        .set(
          data,
          {
            merge: true
          }
        );

      await createLog(
        "Edição de vaga",
        `${character} — ${work}`
      );

    } else {

      await db
        .collection(
          "vagas"
        )
        .add({

          ...data,

          open:
            true,

          status:
            "open",

          createdAt:
            getTimestamp()
        });

      await createLog(
        "Criação de vaga",
        `${character} — ${work}`
      );
    }


    await refreshAll();

    closeVacancyModal();

  } catch (error) {

    console.error(
      "Erro ao salvar vaga:",
      error
    );

    alert(
      "Não foi possível salvar a vaga."
    );
  }
}


/* =========================================================
   33. EDITAR VAGA
   ========================================================= */

function editVacancy(
  vacancyId
) {

  const vacancy =
    state.vacancies.find(
      item =>
        item.id ===
        vacancyId
    );


  if (!vacancy) {
    return;
  }


  const modal =
    $("modal") ||
    $("vacancyModal");


  if (!modal) {
    return;
  }


  const characterInput =
    $("vacCharacter") ||
    $("vacancyCharacter");

  const workInput =
    $("vacWork") ||
    $("vacancyWork");


  if (characterInput) {

    characterInput.value =
      vacancyCharacter(
        vacancy
      );
  }


  if (workInput) {

    workInput.value =
      vacancyWork(
        vacancy
      );
  }


  modal.dataset.editing =
    vacancyId;

  modal.classList.remove(
    "hidden"
  );
}


/* =========================================================
   34. ABRIR / FECHAR VAGA
   ========================================================= */

async function toggleVacancy(
  vacancyId
) {

  if (!db) {
    return;
  }


  const vacancy =
    state.vacancies.find(
      item =>
        item.id ===
        vacancyId
    );


  if (!vacancy) {
    return;
  }


  const next =
    !isOpenVacancy(
      vacancy
    );


  try {

    await db
      .collection(
        "vagas"
      )
      .doc(
        vacancyId
      )
      .set(
        {

          open:
            next,

          status:
            next
              ? "open"
              : "closed",

          updatedAt:
            getTimestamp()

        },
        {
          merge: true
        }
      );


    await createLog(
      next
        ? "Abertura de vaga"
        : "Fechamento de vaga",

      `${vacancyCharacter(
        vacancy
      )} — ${vacancyWork(
        vacancy
      )}`
    );


    await refreshAll();

  } catch (error) {

    console.error(
      "Erro alterando vaga:",
      error
    );

    alert(
      "Não foi possível alterar a vaga."
    );
  }
}


/* =========================================================
   35. EXCLUIR VAGA
   ========================================================= */

async function deleteVacancy(
  vacancyId
) {

  if (!db) {
    return;
  }


  const vacancy =
    state.vacancies.find(
      item =>
        item.id ===
        vacancyId
    );


  if (!vacancy) {
    return;
  }


  const confirmed =
    confirm(
      `Excluir a vaga "${vacancyCharacter(
        vacancy
      )}"?`
    );


  if (!confirmed) {
    return;
  }


  try {

    await db
      .collection(
        "vagas"
      )
      .doc(
        vacancyId
      )
      .delete();


    await createLog(
      "Exclusão de vaga",
      `${vacancyCharacter(
        vacancy
      )} — ${vacancyWork(
        vacancy
      )}`
    );


    await refreshAll();

  } catch (error) {

    console.error(
      "Erro excluindo vaga:",
      error
    );

    alert(
      "Não foi possível excluir a vaga."
    );
  }
}


/* =========================================================
   36. MODAL
   ========================================================= */

function closeVacancyModal() {

  const modal =
    $("modal") ||
    $("vacancyModal");


  if (!modal) {
    return;
  }


  modal.classList.add(
    "hidden"
  );

  modal.removeAttribute(
    "data-editing"
  );
}


function openNewVacancyModal() {

  const modal =
    $("modal") ||
    $("vacancyModal");


  if (!modal) {
    return;
  }


  modal.removeAttribute(
    "data-editing"
  );


  const characterInput =
    $("vacCharacter") ||
    $("vacancyCharacter");

  const workInput =
    $("vacWork") ||
    $("vacancyWork");


  if (characterInput) {
    characterInput.value =
      "";
  }

  if (workInput) {
    workInput.value =
      "";
  }


  modal.classList.remove(
    "hidden"
  );
}


/* =========================================================
   37. CHAT
   ========================================================= */

async function sendAdminChat() {

  if (!db) {
    return;
  }


  const input =
    $("chatInput") ||
    $("adminChatInput");


  if (!input) {
    return;
  }


  const message =
    input.value.trim();


  if (!message) {
    return;
  }


  try {

    await db
      .collection(
        "adminChat"
      )
      .add({

        message,

        adminName:
          state.admin?.name ||
          "ADM",

        adminCode:
          state.admin?.code ||
          null,

        createdAt:
          getTimestamp()
      });


    input.value =
      "";


    state.chat =
      await getCollection(
        "adminChat"
      );


    renderChat();

  } catch (error) {

    console.error(
      "Erro no chat:",
      error
    );

    alert(
      "Não foi possível enviar a mensagem."
    );
  }
}


/* =========================================================
   38. NAVEGAÇÃO ADMIN
   ========================================================= */

function showView(
  view
) {

  state.currentView =
    view ||
    "home";


  document
    .querySelectorAll(
      "[data-view]"
    )
    .forEach(
      element => {

        const active =
          element.dataset.view ===
          state.currentView;


        element.classList.toggle(
          "active",
          active
        );


        element.classList.toggle(
          "hidden",
          !active
        );
      }
    );


  document
    .querySelectorAll(
      "[data-nav]"
    )
    .forEach(
      item => {

        item.classList.toggle(
          "active",
          item.dataset.nav ===
          state.currentView
        );
      }
    );
}


/* =========================================================
   39. ADMIN — ATUALIZAR
   ========================================================= */

async function refreshAll() {

  if (!db) {
    return;
  }


  const [
    requests,
    vacancies,
    members,
    admins,
    logs,
    chat
  ] =
    await Promise.all([

      getCollection(
        "characterRequests"
      ),

      getCollection(
        "vagas"
      ),

      getCollection(
        "members"
      ),

      getCollection(
        "adminProfiles"
      ),

      getCollection(
        "accessLogs"
      ),

      getCollection(
        "adminChat"
      )
    ]);


  state.requests =
    requests;

  state.vacancies =
    vacancies;

  state.members =
    members;

  state.admins =
    admins;

  state.logs =
    logs;

  state.chat =
    chat;


  renderStats();
  renderRequests();
  renderVacancies();
  renderMembers();
  renderAdmins();
  renderChat();
  renderLogs();
}


/* =========================================================
   40. EVENTOS
   ========================================================= */

function bindEvents() {

  /*
    LOGIN
  */

  const loginButton =
    $("loginBtn");

  if (loginButton) {

    loginButton.addEventListener(
      "click",
      loginAdmin
    );
  }


  const adminCode =
    $("adminCode");

  if (adminCode) {

    adminCode.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          loginAdmin();
        }
      }
    );
  }


  /*
    LOGOUT
  */

  const logout =
    $("logoutBtn") ||
    $("logoutButton");

  if (logout) {

    logout.addEventListener(
      "click",
      logoutAdmin
    );
  }


  /*
    FICHA
  */

  const requestForm =
    $("requestForm");

  if (requestForm) {

    requestForm.addEventListener(
      "submit",
      submitRequestForm
    );
  }


  /*
    TROCA
  */

  const exchangeForm =
    $("exchangeForm");

  if (exchangeForm) {

    exchangeForm.addEventListener(
      "submit",
      submitExchangeForm
    );
  }


  /*
    PREVIEWS
  */

  setupImagePreview(
    "requestPhoto",
    "requestPhotoPreview",
    "requestPhotoPlaceholder"
  );

  setupImagePreview(
    "exchangePhoto",
    "exchangePhotoPreview",
    "exchangePhotoPlaceholder"
  );

  setupImagePreview(
    "vacancyPhoto",
    "vacancyPhotoPreview",
    "vacancyPhotoPlaceholder"
  );

  setupImagePreview(
    "vacImage",
    "vacImagePreview",
    "vacImagePlaceholder"
  );


  /*
    BUSCA
  */

  const memberSearch =
    $("memberSearch");

  if (memberSearch) {

    memberSearch.addEventListener(
      "input",
      filterPublicMembers
    );
  }


  /*
    NAVEGAÇÃO
  */

  document
    .querySelectorAll(
      "[data-nav]"
    )
    .forEach(
      item => {

        item.addEventListener(
          "click",
          event => {

            event.preventDefault();

            showView(
              item.dataset.nav
            );
          }
        );
      }
    );


  /*
    NOVA VAGA
  */

  const newVacancy =
    $("newVacancyBtn") ||
    $("addVacancyBtn") ||
    $("openVacancyModal");

  if (newVacancy) {

    newVacancy.addEventListener(
      "click",
      openNewVacancyModal
    );
  }


  /*
    SALVAR VAGA
  */

  const saveButton =
    $("saveVacancyBtn") ||
    $("saveVacancy");

  if (saveButton) {

    saveButton.addEventListener(
      "click",
      () => {

        const modal =
          $("modal") ||
          $("vacancyModal");

        const editing =
          modal?.dataset.editing ||
          null;

        saveVacancy(
          editing
        );
      }
    );
  }


  /*
    FECHAR MODAL
  */

  const closeModal =
    $("closeModal") ||
    $("closeVacancyModal") ||
    $("cancelVacancyBtn");

  if (closeModal) {

    closeModal.addEventListener(
      "click",
      closeVacancyModal
    );
  }


  /*
    CHAT
  */

  const sendChat =
    $("sendChatBtn") ||
    $("sendAdminChat");

  if (sendChat) {

    sendChat.addEventListener(
      "click",
      sendAdminChat
    );
  }


  const chatInput =
    $("chatInput") ||
    $("adminChatInput");

  if (chatInput) {

    chatInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
            "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendAdminChat();
        }
      }
    );
  }


  /*
    BOTÕES DINÂMICOS
  */

  document.addEventListener(
    "click",
    event => {

      const approve =
        event.target.closest(
          "[data-approve]"
        );

      if (approve) {

        approveRequest(
          approve.dataset.approve
        );

        return;
      }


      const reject =
        event.target.closest(
          "[data-reject]"
        );

      if (reject) {

        rejectRequest(
          reject.dataset.reject
        );

        return;
      }


      const edit =
        event.target.closest(
          "[data-edit-vacancy]"
        );

      if (edit) {

        editVacancy(
          edit.dataset.editVacancy
        );

        return;
      }


      const toggle =
        event.target.closest(
          "[data-toggle-vacancy]"
        );

      if (toggle) {

        toggleVacancy(
          toggle.dataset.toggleVacancy
        );

        return;
      }


      const remove =
        event.target.closest(
          "[data-delete-vacancy]"
        );

      if (remove) {

        deleteVacancy(
          remove.dataset.deleteVacancy
        );

        return;
      }
    }
  );
}


/* =========================================================
   41. SESSÃO ADMIN
   ========================================================= */

async function startAdminSession() {

  if (!state.admin) {
    return;
  }


  try {

    await ensureAnonymousAuth();

  } catch {}


  try {

    await createLog(
      "Entrada no painel",
      `${state.admin.name} entrou no painel ADM.`
    );

  } catch {}


  await refreshAll();

  showView(
    "home"
  );
}


/* =========================================================
   42. BOOT PÚBLICO
   ========================================================= */

async function bootPublic() {

  /*
    PRIMEIRO:
    liga os eventos.
  */

  bindEvents();


  /*
    SEGUNDO:
    libera o loading IMEDIATAMENTE.

    Não espera Firebase.
    Não espera Auth.
    Não espera Firestore.
  */

  publicLoadingFailsafe();


  /*
    TERCEIRO:
    tenta Firebase em segundo plano.
  */

  ensureAnonymousAuth()
    .catch(
      error =>
        console.warn(
          "Auth público:",
          error
        )
    );


  /*
    QUARTO:
    carrega vagas e membros.

    Mesmo que isso dê erro,
    a página continua aberta.
  */

  loadPublicData()
    .catch(
      error =>
        console.warn(
          "Dados públicos:",
          error
        )
    );
}


/* =========================================================
   43. BOOT ADMIN
   ========================================================= */

async function bootAdmin() {

  bindEvents();


  const saved =
    getStoredAdmin();


  if (
    saved &&
    saved.code &&
    ADMIN_ACCOUNTS[
      saved.code
    ]
  ) {

    state.admin =
      saved;

    showApp();


    try {

      await startAdminSession();

    } catch (error) {

      console.error(
        "Erro no painel:",
        error
      );

      showApp();
    }

  } else {

    showLogin();
  }
}


/* =========================================================
   44. BOOT GERAL
   ========================================================= */

function boot() {

  const page =
    document.body?.dataset?.page;


  /*
    INDEX
  */

  if (
    page ===
    "public"
  ) {

    bootPublic();

    return;
  }


  /*
    ADMIN
  */

  if (
    page ===
    "admin"
  ) {

    bootAdmin();

    return;
  }


  /*
    FALLBACK:
    se não tiver data-page,
    ainda garante que o loading
    não fique preso.
  */

  publicLoadingFailsafe();
}


/* =========================================================
   45. INICIALIZAÇÃO
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    boot,
    {
      once: true
    }
  );

} else {

  boot();
}


/* =========================================================
   46. ÚLTIMO FALLBACK DO INDEX
   ========================================================= */

window.addEventListener(
  "load",
  () => {

    if (
      document.body?.dataset?.page ===
      "public"
    ) {

      publicLoadingFailsafe();
    }
  }
);


/* =========================================================
   FIM
   ========================================================= */
