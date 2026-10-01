/* =========================================================
   HOUSE LTD
   APP.JS — ADMINISTRAÇÃO
   VERSÃO CORRIGIDA
   ========================================================= */


/* =========================================================
   FIREBASE CONFIG
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


/* =========================================================
   CLOUDINARY
   ========================================================= */

const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/gsqmelxb/image/upload";

const CLOUDINARY_UPLOAD_PRESET =
  "House LTD";


/* =========================================================
   ADMINS
   ========================================================= */

const ADMIN_ACCOUNTS = {

  YM7JQ7: {
    name: "Aiko",
    role: "Dono"
  },

  YQ7NM4: {
    name: "Noah",
    role: "Sub-dono"
  },

  JM7XQ8: {
    name: "Shime",
    role: "Líder de ADM"
  },

  Y7KQ2M: {
    name: "Shiro",
    role: "ADM"
  },

  M7IQY5: {
    name: "Isa",
    role: "Staff"
  },

  QY7MH3: {
    name: "Mah",
    role: "ADM"
  },

  Y4JQ7L: {
    name: "Luan",
    role: "ADM"
  },

  K7YQ9M: {
    name: "Ayrken",
    role: "ADM"
  },

  YM4QX7: {
    name: "Evan",
    role: "ADM"
  },

  Q7YTM5: {
    name: "Tamsy",
    role: "ADM"
  },

  JY7QK6: {
    name: "Lucca",
    role: "ADM"
  },

  YQ5M7X: {
    name: "Kally",
    role: "ADM"
  },

  TH1K0L: {
    name: "Lici",
    role: "ADM"
  },

  FB61K5: {
    name: "Belly",
    role: "ADM"
  }

};


/* =========================================================
   FIREBASE
   ========================================================= */

let db = null;
let auth = null;
let firebaseReady = false;
let firebaseError = null;

try {

  if (
    typeof firebase === "undefined"
  ) {

    throw new Error(
      "Firebase não foi carregado pelo navegador."
    );

  }


  if (
    !firebase.apps ||
    !firebase.apps.length
  ) {

    firebase.initializeApp(
      firebaseConfig
    );

  }


  db =
    firebase.firestore();

  auth =
    firebase.auth();

  firebaseReady = true;

} catch (error) {

  firebaseError = error;

  console.error(
    "Erro ao inicializar Firebase:",
    error
  );

}


/* =========================================================
   ESTADO
   ========================================================= */

const state = {

  admin: null,

  editVacancyId: null,

  editVacancyCollection: null,

  requests: [],

  vacancies: [],

  members: [],

  admins: [],

  chat: [],

  logs: []

};


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {

  return document.getElementById(id);

}


function esc(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );

}


function normalizeCode(value) {

  return String(
    value || ""
  )
    .trim()
    .toUpperCase();

}


function toast(message) {

  const element =
    $("toast");

  if (!element) {

    console.log(
      "[LTD]",
      message
    );

    return;

  }


  element.textContent =
    message;

  element.classList.remove(
    "hidden"
  );


  clearTimeout(
    window.__ltdToastTimer
  );


  window.__ltdToastTimer =
    setTimeout(
      () => {

        element.classList.add(
          "hidden"
        );

      },
      3500
    );

}


function setLoginMessage(
  message,
  success = false
) {

  const element =
    $("loginMsg");

  if (!element) {

    alert(message);

    return;

  }


  element.textContent =
    message;


  element.style.color =
    success
      ? "#67e6a7"
      : "#ff9aac";

}


function setVacancyMessage(
  message,
  success = false
) {

  const element =
    $("vacMsg");

  if (!element)
    return;


  element.textContent =
    message;


  element.style.color =
    success
      ? "#67e6a7"
      : "#ff9aac";

}


/* =========================================================
   SESSÃO
   ========================================================= */

function getStoredAdmin() {

  try {

    const raw =
      sessionStorage.getItem(
        "houseLTDAdmin"
      );


    if (!raw)
      return null;


    return JSON.parse(
      raw
    );

  } catch (error) {

    console.warn(
      "Sessão inválida:",
      error
    );

    return null;

  }

}


function saveStoredAdmin(
  admin
) {

  sessionStorage.setItem(
    "houseLTDAdmin",
    JSON.stringify(admin)
  );

}


function clearStoredAdmin() {

  sessionStorage.removeItem(
    "houseLTDAdmin"
  );

}


/* =========================================================
   LOGIN
   ========================================================= */

async function login() {

  const input =
    $("adminCode");

  const button =
    $("loginBtn");


  if (!input) {

    console.error(
      "Campo #adminCode não encontrado."
    );

    return;

  }


  const code =
    normalizeCode(
      input.value
    );


  /* -------------------------
     CAMPO VAZIO
     ------------------------- */

  if (!code) {

    setLoginMessage(
      "Digite seu código de acesso."
    );

    input.focus();

    return;

  }


  /* -------------------------
     CÓDIGO INVÁLIDO
     ------------------------- */

  const account =
    ADMIN_ACCOUNTS[code];


  if (!account) {

    setLoginMessage(
      "Código de acesso inválido."
    );

    input.focus();

    input.select();

    return;

  }


  /* -------------------------
     MOSTRA CARREGAMENTO
     ------------------------- */

  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Entrando...";

  }


  setLoginMessage(
    "Código correto. Entrando...",
    true
  );


  /* -------------------------
     CRIA SESSÃO LOCAL
     ------------------------- */

  state.admin = {

    ...account,

    code

  };


  saveStoredAdmin(
    state.admin
  );


  /*
   * IMPORTANTE:
   * O painel NÃO fica esperando o Firebase
   * para abrir.
   */

  showApp();


  /*
   * Firebase é tratado em segundo plano.
   * Se Anonymous Auth estiver ativado,
   * ele cria a sessão.
   */

  if (
    firebaseReady &&
    auth
  ) {

    try {

      if (
        !auth.currentUser
      ) {

        await auth.signInAnonymously();

      }

    } catch (error) {

      console.warn(
        "Autenticação anônima:",
        error
      );

      /*
       * Não expulsa o ADM.
       * O código já foi validado.
       */

      toast(
        "Painel aberto. Firebase Auth precisa ser ativado para acessar os dados."
      );

    }

  }


  if (button) {

    button.disabled =
      false;

    button.textContent =
      "Entrar";

  }


  /*
   * Carrega os dados depois de entrar.
   */

  try {

    await refreshAll();

  } catch (error) {

    console.error(
      "Erro ao carregar painel:",
      error
    );

    toast(
      "Painel aberto, mas houve um erro ao carregar os dados."
    );

  }


  /*
   * Log não pode impedir o login.
   */

  try {

    await logAction(
      "login",
      "Entrada no painel"
    );

  } catch (error) {

    console.warn(
      "Não foi possível registrar o login:",
      error
    );

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

  clearStoredAdmin();

  state.admin =
    null;


  try {

    if (
      auth &&
      auth.currentUser
    ) {

      auth.signOut()
        .catch(
          error =>
            console.warn(
              "Logout Firebase:",
              error
            )
        );

    }

  } catch {}


  location.reload();

}


/* =========================================================
   MOSTRAR PAINEL
   ========================================================= */

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


  if ($("meName")) {

    $("meName").textContent =
      state.admin?.name ||
      "ADM";

  }


  if ($("meRole")) {

    $("meRole").textContent =
      state.admin?.role ||
      "";

  }


  showView("home");

}


/* =========================================================
   DATAS
   ========================================================= */

function dateValue(data) {

  const raw =
    data?.createdAt ||
    data?.date ||
    data?.updatedAt ||
    data?.approvedAt;


  if (!raw)
    return 0;


  if (
    typeof raw.toMillis ===
    "function"
  ) {

    return raw.toMillis();

  }


  if (
    raw instanceof Date
  ) {

    return raw.getTime();

  }


  const date =
    new Date(raw);


  const value =
    date.getTime();


  return Number.isNaN(value)
    ? 0
    : value;

}


function formatDate(data) {

  const value =
    dateValue(data);


  if (!value)
    return "—";


  return new Date(
    value
  ).toLocaleString(
    "pt-BR"
  );

}


/* =========================================================
   STATUS
   ========================================================= */

function statusIsOpen(
  vacancy
) {

  const status =
    String(
      vacancy?.status ||
      vacancy?.estado ||
      ""
    )
      .trim()
      .toLowerCase();


  return (

    status === "aberta" ||

    status === "aberto" ||

    status === "open" ||

    status === "livre"

  );

}


function statusIsPending(
  request
) {

  const status =
    String(
      request?.status ||
      ""
    )
      .trim()
      .toLowerCase();


  return (

    !status ||

    status === "pendente" ||

    status === "pending"

  );

}


/* =========================================================
   FIRESTORE DISPONÍVEL?
   ========================================================= */

function firestoreAvailable() {

  if (!firebaseReady || !db) {

    toast(
      "Firebase não está disponível."
    );

    return false;

  }

  return true;

}


/* =========================================================
   LER COLEÇÃO
   ========================================================= */

async function getCollectionSafe(
  collectionName,
  orderField = null
) {

  if (!db)
    return [];


  try {

    let reference =
      db.collection(
        collectionName
      );


    if (orderField) {

      try {

        reference =
          reference.orderBy(
            orderField,
            "desc"
          );

      } catch {}

    }


    const snapshot =
      await reference.get();


    return snapshot.docs.map(
      document => ({

        id:
          document.id,

        ref:
          document.ref,

        collection:
          collectionName,

        ...document.data()

      })
    );


  } catch (error) {

    console.warn(
      `Coleção ${collectionName}:`,
      error
    );

    return [];

  }

}


/* =========================================================
   SOLICITAÇÕES
   ========================================================= */

async function loadRequests() {

  let rows =
    await getCollectionSafe(
      "characterRequests",
      "createdAt"
    );


  if (!rows.length) {

    rows =
      await getCollectionSafe(
        "requests",
        "createdAt"
      );

  }


  state.requests =
    rows.filter(
      statusIsPending
    );

}


/* =========================================================
   VAGAS
   ========================================================= */

async function loadVacancies() {

  let rows =
    await getCollectionSafe(
      "vagas",
      "createdAt"
    );


  /*
   * Se vagas estiver vazia,
   * tenta a coleção antiga.
   */

  if (!rows.length) {

    rows =
      await getCollectionSafe(
        "occupiedCharacters",
        "createdAt"
      );

  }


  state.vacancies =
    rows;

}


/* =========================================================
   MEMBROS
   ========================================================= */

async function loadMembers() {

  state.members =
    await getCollectionSafe(
      "members",
      "createdAt"
    );

}


/* =========================================================
   ADMINS
   ========================================================= */

async function loadAdmins() {

  const rows =
    await getCollectionSafe(
      "adminProfiles",
      "createdAt"
    );


  const byName =
    new Map();


  rows.forEach(
    item => {

      const name =
        String(
          item.name || ""
        )
          .trim()
          .toLowerCase();


      if (name) {

        byName.set(
          name,
          item
        );

      }

    }
  );


  state.admins =
    Object.entries(
      ADMIN_ACCOUNTS
    ).map(
      ([code, base]) => {

        const saved =
          byName.get(
            base.name
              .toLowerCase()
          ) || {};


        return {

          ...base,

          ...saved,

          code

        };

      }
    );

}


/* =========================================================
   CHAT
   ========================================================= */

async function loadChat() {

  state.chat =
    await getCollectionSafe(
      "adminChat",
      "createdAt"
    );

}


/* =========================================================
   LOGS
   ========================================================= */

async function loadLogs() {

  state.logs =
    await getCollectionSafe(
      "accessLogs",
      "createdAt"
    );

}


/* =========================================================
   ATUALIZAR TUDO
   ========================================================= */

async function refreshAll() {

  if (!firebaseReady) {

    renderAll();

    return;

  }


  await Promise.allSettled([

    loadRequests(),

    loadVacancies(),

    loadMembers(),

    loadAdmins(),

    loadChat(),

    loadLogs()

  ]);


  renderAll();

}


/* =========================================================
   RENDER GERAL
   ========================================================= */

function renderAll() {

  renderStats();

  renderHome();

  renderRequests();

  renderVacancies();

  renderMembers();

  renderAdmins();

  renderChat();

  renderLogs();

}


/* =========================================================
   ESTATÍSTICAS
   ========================================================= */

function renderStats() {

  const open =
    state.vacancies
      .filter(
        statusIsOpen
      )
      .length;


  const closed =
    Math.max(
      0,
      state.vacancies.length -
      open
    );


  if ($("statRequests")) {

    $("statRequests")
      .textContent =
      state.requests.length;

  }


  if ($("statOpen")) {

    $("statOpen")
      .textContent =
      open;

  }


  if ($("statClosed")) {

    $("statClosed")
      .textContent =
      closed;

  }


  if ($("statMembers")) {

    $("statMembers")
      .textContent =
      state.members.length;

  }

}


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

  const element =
    $("homeSummary");


  if (!element)
    return;


  element.innerHTML = `

    <div class="card">

      <span class="pill">
        Solicitações
      </span>

      <h3>
        ${state.requests.length}
      </h3>

      <span class="muted">
        aguardando análise
      </span>

    </div>


    <div class="card">

      <span class="pill">
        Vagas
      </span>

      <h3>
        ${
          state.vacancies
            .filter(statusIsOpen)
            .length
        }
      </h3>

      <span class="muted">
        disponíveis agora
      </span>

    </div>


    <div class="card">

      <span class="pill">
        Equipe
      </span>

      <h3>
        ${state.admins.length}
      </h3>

      <span class="muted">
        administradores cadastrados
      </span>

    </div>

  `;

}


/* =========================================================
   SOLICITAÇÕES
   ========================================================= */

function renderRequests() {

  const element =
    $("requestsList");


  if (!element)
    return;


  if (!state.requests.length) {

    element.innerHTML = `

      <div class="empty">
        Nenhuma solicitação pendente.
      </div>

    `;

    return;

  }


  element.innerHTML =
    state.requests
      .map(
        request => `

        <div
          class="card"
          style="margin-bottom:10px"
        >

          <div class="row">

            <div>

              <h3>
                ${esc(
                  request.name ||
                  request.nickname ||
                  "Sem nome"
                )}
              </h3>

              <span class="muted">

                ${esc(
                  request.character ||
                  request.personagem ||
                  "—"
                )}

                •

                ${esc(
                  request.work ||
                  request.obra ||
                  "—"
                )}

              </span>

            </div>


            ${
              request.photo
                ? `

                  <img
                    class="avatar"
                    src="${esc(request.photo)}"
                    alt=""
                  >

                `
                : ""
            }

          </div>


          <p class="muted">

            Idade:
            ${esc(
              request.age ||
              request.idade ||
              "—"
            )}

            •

            Últimos 4 dígitos:
            ${esc(
              request.phoneLast4 ||
              request.last4 ||
              request.ultimos4 ||
              "—"
            )}

          </p>


          <p class="muted">

            Enviado:
            ${formatDate(request)}

          </p>


          <div class="actions">

            <button
              class="btn"
              data-approve="${esc(request.id)}"
            >
              Aceitar
            </button>


            <button
              class="btn danger"
              data-reject="${esc(request.id)}"
            >
              Recusar
            </button>

          </div>

        </div>

      `
      )
      .join("");

}


/* =========================================================
   VAGAS
   ========================================================= */

function renderVacancies() {

  const element =
    $("vacanciesList");


  if (!element)
    return;


  if (!state.vacancies.length) {

    element.innerHTML = `

      <div class="empty">
        Nenhuma vaga cadastrada.
      </div>

    `;

    return;

  }


  element.innerHTML =
    state.vacancies
      .map(
        vacancy => {

          const open =
            statusIsOpen(
              vacancy
            );


          const character =
            vacancy.character ||
            vacancy.personagem ||
            vacancy.name ||
            "Sem personagem";


          const work =
            vacancy.work ||
            vacancy.obra ||
            "Sem obra";


          const image =
            vacancy.image ||
            vacancy.photo ||
            vacancy.characterPhoto ||
            "";


          return `

            <div class="card">

              ${
                image
                  ? `

                    <img
                      class="cover"
                      src="${esc(image)}"
                      alt=""
                    >

                  `
                  : ""
              }


              <div class="row">

                <h3>
                  ${esc(character)}
                </h3>

                <span class="pill">
                  ${
                    open
                      ? "Aberta"
                      : "Fechada"
                  }
                </span>

              </div>


              <div class="muted">
                ${esc(work)}
              </div>


              <div class="actions">

                <button
                  class="btn ghost"
                  data-edit-vac="${esc(vacancy.id)}"
                >
                  Editar
                </button>


                <button
                  class="btn ghost"
                  data-toggle-vac="${esc(vacancy.id)}"
                >
                  ${
                    open
                      ? "Fechar"
                      : "Abrir"
                  }
                </button>


                <button
                  class="btn danger"
                  data-delete-vac="${esc(vacancy.id)}"
                >
                  Excluir
                </button>

              </div>

            </div>

          `;

        }
      )
      .join("");

}


/* =========================================================
   MEMBROS
   ========================================================= */

function renderMembers() {

  const element =
    $("membersList");


  if (!element)
    return;


  if (!state.members.length) {

    element.innerHTML = `

      <tr>

        <td
          colspan="5"
          class="empty"
        >
          Nenhum membro aprovado.
        </td>

      </tr>

    `;

    return;

  }


  element.innerHTML =
    state.members
      .map(
        member => `

        <tr>

          <td>
            ${esc(
              member.name ||
              member.nickname ||
              "—"
            )}
          </td>

          <td>
            ${esc(
              member.age ||
              member.idade ||
              "—"
            )}
          </td>

          <td>
            ${esc(
              member.character ||
              member.personagem ||
              "—"
            )}
          </td>

          <td>
            ${esc(
              member.work ||
              member.obra ||
              "—"
            )}
          </td>

          <td>
            ${formatDate(member)}
          </td>

        </tr>

      `
      )
      .join("");

}


/* =========================================================
   ADMINS
   ========================================================= */

function renderAdmins() {

  const element =
    $("adminsList");


  if (!element)
    return;


  element.innerHTML =
    state.admins
      .map(
        admin => `

        <div class="card">

          ${
            admin.cover
              ? `

                <img
                  class="cover"
                  src="${esc(admin.cover)}"
                  alt=""
                >

              `
              : ""
          }


          <div class="row">

            ${
              admin.photo
                ? `

                  <img
                    class="avatar"
                    src="${esc(admin.photo)}"
                    alt=""
                  >

                `
                : `

                  <div class="avatar"></div>

                `
            }


            <div style="flex:1">

              <h3>
                ${esc(admin.name)}
              </h3>

              <span class="muted">
                ${esc(admin.role)}
              </span>

            </div>

          </div>


          <div
            style="margin-top:12px"
            class="${
              admin.online
                ? "online"
                : "offline"
            }"
          >

            ${
              admin.online
                ? "● Online"
                : "● Offline"
            }

          </div>

        </div>

      `
      )
      .join("");

}


/* =========================================================
   CHAT
   ========================================================= */

function renderChat() {

  const element =
    $("chatList");


  if (!element)
    return;


  if (!state.chat.length) {

    element.innerHTML = `

      <div class="empty">
        Nenhuma mensagem ainda.
      </div>

    `;

    return;

  }


  element.innerHTML =
    state.chat
      .map(
        message => `

        <div
          class="card"
          style="margin-bottom:8px"
        >

          <div class="row">

            <strong>
              ${esc(
                message.adminName ||
                message.admin ||
                "ADM"
              )}
            </strong>

            <span class="muted">
              ${formatDate(message)}
            </span>

          </div>


          <div style="margin-top:7px">

            ${esc(
              message.message ||
              ""
            )}

          </div>

        </div>

      `
      )
      .join("");


  element.scrollTop =
    element.scrollHeight;

}


/* =========================================================
   LOGS
   ========================================================= */

function renderLogs() {

  const element =
    $("logsList");


  if (!element)
    return;


  if (!state.logs.length) {

    element.innerHTML = `

      <tr>

        <td
          colspan="4"
          class="empty"
        >
          Nenhum log.
        </td>

      </tr>

    `;

    return;

  }


  element.innerHTML =
    state.logs
      .slice(0, 100)
      .map(
        log => `

        <tr>

          <td>
            ${formatDate(log)}
          </td>

          <td>
            ${esc(
              log.admin ||
              "—"
            )}
          </td>

          <td>
            ${esc(
              log.action ||
              "—"
            )}
          </td>

          <td>
            ${esc(
              log.details ||
              "—"
            )}
          </td>

        </tr>

      `
      )
      .join("");

}


/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function showView(name) {

  document
    .querySelectorAll(".view")
    .forEach(
      view => {

        view.classList.remove(
          "active"
        );

      }
    );


  document
    .querySelectorAll(".nav button")
    .forEach(
      button => {

        button.classList.remove(
          "active"
        );

      }
    );


  const view =
    $("view-" + name);


  if (view) {

    view.classList.add(
      "active"
    );

  }


  const navButton =
    document.querySelector(
      `.nav button[data-view="${name}"]`
    );


  if (navButton) {

    navButton.classList.add(
      "active"
    );

  }


  const titles = {

    home: [
      "Início",
      "Visão geral da House LTD"
    ],

    requests: [
      "Solicitações",
      "Analise as fichas recebidas"
    ],

    vacancies: [
      "Vagas",
      "Controle de vagas abertas e fechadas"
    ],

    members: [
      "Membros",
      "Membros aprovados"
    ],

    admins: [
      "Administradores",
      "Equipe da House LTD"
    ],

    chat: [
      "Chat ADM",
      "Comunicação interna"
    ],

    logs: [
      "Logs",
      "Histórico de ações"
    ]

  };


  const title =
    titles[name] ||
    titles.home;


  if ($("pageTitle")) {

    $("pageTitle").textContent =
      title[0];

  }


  if ($("pageSubtitle")) {

    $("pageSubtitle").textContent =
      title[1];

  }

}


/* =========================================================
   LOCALIZAR VAGA
   ========================================================= */

function findVacancy(
  id
) {

  return state.vacancies.find(
    item =>
      item.id === id
  ) || null;

}


/* =========================================================
   APROVAR SOLICITAÇÃO
   ========================================================= */

async function approveRequest(
  id
) {

  const request =
    state.requests.find(
      item =>
        item.id === id
    );


  if (!request) {

    toast(
      "Solicitação não encontrada."
    );

    return;

  }


  const character =
    request.character ||
    request.personagem;


  const work =
    request.work ||
    request.obra;


  if (!character || !work) {

    toast(
      "A solicitação não possui personagem ou obra."
    );

    return;

  }


  const vacancy =
    state.vacancies.find(
      item => {

        const itemCharacter =
          String(
            item.character ||
            item.personagem ||
            item.name ||
            ""
          )
            .trim()
            .toLowerCase();


        const itemWork =
          String(
            item.work ||
            item.obra ||
            ""
          )
            .trim()
            .toLowerCase();


        return (

          itemCharacter ===
          String(character)
            .trim()
            .toLowerCase()

          &&

          itemWork ===
          String(work)
            .trim()
            .toLowerCase()

          &&

          statusIsOpen(item)

        );

      }
    );


  try {

    if (!firestoreAvailable())
      return;


    /*
     * CRIA MEMBRO
     */

    await db
      .collection("members")
      .add({

        name:
          request.name ||
          request.nickname ||
          "",

        age:
          request.age ||
          request.idade ||
          "",

        phoneLast4:
          request.phoneLast4 ||
          request.last4 ||
          request.ultimos4 ||
          "",

        character,

        work,

        photo:
          request.photo ||
          "",

        approvedBy:
          state.admin?.name ||
          "",

        approvedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    /*
     * FECHA A VAGA ENCONTRADA
     */

    if (vacancy?.ref) {

      await vacancy.ref.update({

        status:
          "fechada",

        occupiedBy:
          request.name ||
          request.nickname ||
          "",

        occupiedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp(),

        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

    }


    /*
     * ATUALIZA SOLICITAÇÃO
     */

    const collection =
      request.collection ||
      await findRequestCollection(
        id
      );


    if (collection) {

      await db
        .collection(collection)
        .doc(id)
        .update({

          status:
            "aprovado",

          approvedBy:
            state.admin?.name ||
            "",

          approvedAt:
            firebase.firestore
              .FieldValue
              .serverTimestamp()

        });

    }


    await logAction(
      "aprovar_solicitacao",
      `${character} • ${work}`
    );


    toast(
      "Solicitação aprovada."
    );


    await refreshAll();

  } catch (error) {

    console.error(
      "Erro ao aprovar:",
      error
    );


    toast(
      "Não foi possível aprovar a solicitação."
    );

  }

}


/* =========================================================
   RECUSAR SOLICITAÇÃO
   ========================================================= */

async function rejectRequest(
  id
) {

  try {

    if (!firestoreAvailable())
      return;


    const request =
      state.requests.find(
        item =>
          item.id === id
      );


    const collection =
      request?.collection ||
      await findRequestCollection(
        id
      );


    if (!collection) {

      toast(
        "Solicitação não encontrada."
      );

      return;

    }


    await db
      .collection(collection)
      .doc(id)
      .update({

        status:
          "recusado",

        rejectedBy:
          state.admin?.name ||
          "",

        rejectedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    await logAction(
      "recusar_solicitacao",
      id
    );


    toast(
      "Solicitação recusada."
    );


    await refreshAll();

  } catch (error) {

    console.error(
      "Erro ao recusar:",
      error
    );


    toast(
      "Não foi possível recusar a solicitação."
    );

  }

}


/* =========================================================
   ENCONTRAR SOLICITAÇÃO
   ========================================================= */

async function findRequestCollection(
  id
) {

  if (!db)
    return null;


  try {

    const first =
      await db
        .collection(
          "characterRequests"
        )
        .doc(id)
        .get();


    if (first.exists)
      return "characterRequests";

  } catch {}


  try {

    const second =
      await db
        .collection(
          "requests"
        )
        .doc(id)
        .get();


    if (second.exists)
      return "requests";

  } catch {}


  return null;

}


/* =========================================================
   MODAL DE VAGA
   ========================================================= */

function openVacancyModal(
  id = null
) {

  state.editVacancyId =
    id;


  const vacancy =
    id
      ? findVacancy(id)
      : null;


  state.editVacancyCollection =
    vacancy?.collection ||
    "vagas";


  if ($("modalTitle")) {

    $("modalTitle")
      .textContent =
      vacancy
        ? "Editar vaga"
        : "Nova vaga";

  }


  if ($("vacCharacter")) {

    $("vacCharacter").value =
      vacancy?.character ||
      vacancy?.personagem ||
      vacancy?.name ||
      "";

  }


  if ($("vacWork")) {

    $("vacWork").value =
      vacancy?.work ||
      vacancy?.obra ||
      "";

  }


  if ($("vacImage")) {

    $("vacImage").value =
      vacancy?.image ||
      vacancy?.photo ||
      "";

  }


  if ($("vacStatus")) {

    $("vacStatus").value =
      statusIsOpen(vacancy)
        ? "aberta"
        : "fechada";

  }


  setVacancyMessage("");


  $("modal")
    ?.classList
    .add("open");

}


/* =========================================================
   FECHAR MODAL
   ========================================================= */

function closeVacancyModal() {

  $("modal")
    ?.classList
    .remove("open");


  state.editVacancyId =
    null;


  state.editVacancyCollection =
    null;

}


/* =========================================================
   SALVAR VAGA
   ========================================================= */

async function saveVacancy() {

  const character =
    $("vacCharacter")
      ?.value
      .trim() || "";


  const work =
    $("vacWork")
      ?.value
      .trim() || "";


  const image =
    $("vacImage")
      ?.value
      .trim() || "";


  const status =
    $("vacStatus")
      ?.value ||
      "aberta";


  if (!character || !work) {

    setVacancyMessage(
      "Personagem e obra são obrigatórios."
    );

    return;

  }


  if (!firestoreAvailable())
    return;


  try {

    const data = {

      character,

      work,

      image,

      status,

      updatedAt:
        firebase.firestore
          .FieldValue
          .serverTimestamp()

    };


    /*
     * EDITAR
     */

    if (state.editVacancyId) {

      const collection =
        state.editVacancyCollection ||
        "vagas";


      await db
        .collection(collection)
        .doc(
          state.editVacancyId
        )
        .update(data);


      await logAction(
        "editar_vaga",
        `${character} • ${work}`
      );


      toast(
        "Vaga atualizada."
      );

    }


    /*
     * CRIAR
     */

    else {

      await db
        .collection("vagas")
        .add({

          ...data,

          createdAt:
            firebase.firestore
              .FieldValue
              .serverTimestamp()

        });


      await logAction(
        "criar_vaga",
        `${character} • ${work}`
      );


      toast(
        "Vaga criada."
      );

    }


    closeVacancyModal();

    await refreshAll();

  } catch (error) {

    console.error(
      "Erro ao salvar vaga:",
      error
    );


    setVacancyMessage(
      "Não foi possível salvar a vaga."
    );

  }

}


/* =========================================================
   ABRIR / FECHAR VAGA
   ========================================================= */

async function toggleVacancy(
  id
) {

  const vacancy =
    findVacancy(id);


  if (!vacancy) {

    toast(
      "Vaga não encontrada."
    );

    return;

  }


  if (!firestoreAvailable())
    return;


  const nextStatus =
    statusIsOpen(vacancy)
      ? "fechada"
      : "aberta";


  try {

    const collection =
      vacancy.collection ||
      "vagas";


    await db
      .collection(collection)
      .doc(id)
      .update({

        status:
          nextStatus,

        updatedAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    await logAction(

      nextStatus === "aberta"
        ? "abrir_vaga"
        : "fechar_vaga",

      `${
        vacancy.character ||
        vacancy.personagem ||
        vacancy.name ||
        "Sem personagem"
      } • ${
        vacancy.work ||
        vacancy.obra ||
        "Sem obra"
      }`

    );


    toast(

      nextStatus === "aberta"
        ? "Vaga aberta."
        : "Vaga fechada."

    );


    await refreshAll();

  } catch (error) {

    console.error(
      "Erro ao alterar vaga:",
      error
    );


    toast(
      "Não foi possível alterar a vaga."
    );

  }

}


/* =========================================================
   EXCLUIR VAGA
   ========================================================= */

async function deleteVacancy(
  id
) {

  const vacancy =
    findVacancy(id);


  if (!vacancy) {

    toast(
      "Vaga não encontrada."
    );

    return;

  }


  const name =
    vacancy.character ||
    vacancy.personagem ||
    vacancy.name ||
    "esta vaga";


  if (
    !confirm(
      `Excluir a vaga "${name}"?`
    )
  ) {

    return;

  }


  if (!firestoreAvailable())
    return;


  try {

    const collection =
      vacancy.collection ||
      "vagas";


    await db
      .collection(collection)
      .doc(id)
      .delete();


    await logAction(
      "excluir_vaga",
      name
    );


    toast(
      "Vaga excluída."
    );


    await refreshAll();

  } catch (error) {

    console.error(
      "Erro ao excluir vaga:",
      error
    );


    toast(
      "Não foi possível excluir a vaga."
    );

  }

}


/* =========================================================
   CHAT
   ========================================================= */

async function sendChat() {

  const input =
    $("chatInput");


  if (!input)
    return;


  const message =
    input.value.trim();


  if (!message)
    return;


  if (!firestoreAvailable())
    return;


  try {

    await db
      .collection("adminChat")
      .add({

        adminName:
          state.admin?.name ||
          "ADM",

        adminRole:
          state.admin?.role ||
          "",

        message,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });


    input.value =
      "";


    await loadChat();

    renderChat();

  } catch (error) {

    console.error(
      "Erro no chat:",
      error
    );


    toast(
      "Não foi possível enviar a mensagem."
    );

  }

}


/* =========================================================
   LOG ACTION
   ========================================================= */

async function logAction(
  action,
  details
) {

  if (!db)
    return;


  try {

    await db
      .collection("accessLogs")
      .add({

        admin:
          state.admin?.name ||
          "Desconhecido",

        role:
          state.admin?.role ||
          "",

        action,

        details,

        createdAt:
          firebase.firestore
            .FieldValue
            .serverTimestamp()

      });

  } catch (error) {

    console.warn(
      "Não foi possível registrar log:",
      error
    );

  }

}


/* =========================================================
   CLOUDINARY
   ========================================================= */

async function uploadToCloudinary(
  file
) {

  if (!file)
    return "";


  const form =
    new FormData();


  form.append(
    "file",
    file
  );


  form.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );


  const response =
    await fetch(
      CLOUDINARY_UPLOAD_URL,
      {
        method: "POST",
        body: form
      }
    );


  if (!response.ok) {

    throw new Error(
      "Falha no upload para o Cloudinary."
    );

  }


  const data =
    await response.json();


  return (
    data.secure_url ||
    data.url ||
    ""
  );

}


/* =========================================================
   EVENTOS DE NAVEGAÇÃO E CARDS
   ========================================================= */

document.addEventListener(
  "click",
  async event => {

    const navigation =
      event.target.closest(
        "[data-view]"
      );


    if (navigation) {

      showView(
        navigation.dataset.view
      );

      return;

    }


    const approve =
      event.target.closest(
        "[data-approve]"
      );


    if (approve) {

      await approveRequest(
        approve.dataset.approve
      );

      return;

    }


    const reject =
      event.target.closest(
        "[data-reject]"
      );


    if (reject) {

      await rejectRequest(
        reject.dataset.reject
      );

      return;

    }


    const edit =
      event.target.closest(
        "[data-edit-vac]"
      );


    if (edit) {

      openVacancyModal(
        edit.dataset.editVac
      );

      return;

    }


    const toggle =
      event.target.closest(
        "[data-toggle-vac]"
      );


    if (toggle) {

      await toggleVacancy(
        toggle.dataset.toggleVac
      );

      return;

    }


    const deleteButton =
      event.target.closest(
        "[data-delete-vac]"
      );


    if (deleteButton) {

      await deleteVacancy(
        deleteButton.dataset.deleteVac
      );

      return;

    }


    const refresh =
      event.target.closest(
        "[data-refresh-section]"
      );


    if (refresh) {

      await refreshAll();

    }

  }
);


/* =========================================================
   BOTÕES
   ========================================================= */

function bindEvents() {

  const loginButton =
    $("loginBtn");


  if (loginButton) {

    loginButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        login();

      }
    );

  }


  const codeInput =
    $("adminCode");


  if (codeInput) {

    codeInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          login();

        }

      }
    );

  }


  $("logoutBtn")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        logout();

      }
    );


  $("refreshBtn")
    ?.addEventListener(
      "click",
      async event => {

        event.preventDefault();

        await refreshAll();

        toast(
          "Painel atualizado."
        );

      }
    );


  $("newVacancyBtn")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openVacancyModal();

      }
    );


  $("closeModal")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        closeVacancyModal();

      }
    );


  $("saveVacancyBtn")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        saveVacancy();

      }
    );


  $("sendChatBtn")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        sendChat();

      }
    );


  $("chatInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          sendChat();

        }

      }
    );


  $("modal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("modal")
        ) {

          closeVacancyModal();

        }

      }
    );

}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function boot() {

  /*
   * Primeiro garante que os eventos existem.
   */

  bindEvents();


  /*
   * Verifica sessão salva.
   */

  const saved =
    getStoredAdmin();


  if (
    saved &&
    saved.code &&
    ADMIN_ACCOUNTS[
      normalizeCode(saved.code)
    ]
  ) {

    const realAccount =
      ADMIN_ACCOUNTS[
        normalizeCode(saved.code)
      ];


    state.admin = {

      ...realAccount,

      code:
        normalizeCode(
          saved.code
        )

    };


    showApp();


    /*
     * Firebase em segundo plano.
     */

    if (
      firebaseReady &&
      auth
    ) {

      try {

        if (
          !auth.currentUser
        ) {

          await auth.signInAnonymously();

        }

      } catch (error) {

        console.warn(
          "Firebase Auth:",
          error
        );

      }

    }


    try {

      await refreshAll();

    } catch (error) {

      console.error(
        "Erro no carregamento inicial:",
        error
      );

    }

    return;

  }


  /*
   * Sem sessão:
   * permanece na tela de login.
   */

  if ($("loginView")) {

    $("loginView")
      .classList
      .remove("hidden");

  }


  if ($("appView")) {

    $("appView")
      .classList
      .add("hidden");

  }


  if (firebaseError) {

    console.warn(
      "Firebase ainda não está disponível:",
      firebaseError
    );

  }

}


/* =========================================================
   INICIAR
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    boot
  );

} else {

  boot();

     }
