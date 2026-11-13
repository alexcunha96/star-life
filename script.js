"use strict";

const SAVE_KEY = "starlife_save_v3";
const $ = id => document.getElementById(id);

const COUNTRIES = [
  ["Portugal", "PT", "EUR", "€"],
  ["Brasil", "BR", "BRL", "R$"],
  ["Estados Unidos", "US", "USD", "$"],
  ["Reino Unido", "GB", "GBP", "£"],
  ["Alemanha", "DE", "EUR", "€"],
  ["França", "FR", "EUR", "€"],
  ["Espanha", "ES", "EUR", "€"],
  ["Canadá", "CA", "CAD", "CA$"],
  ["Japão", "JP", "JPY", "¥"],
  ["Suíça", "CH", "CHF", "CHF"],
  ["Austrália", "AU", "AUD", "A$"],
  ["Angola", "AO", "AOA", "Kz"],
  ["Moçambique", "MZ", "MZN", "MT"]
];

const RELATIONS = [
  "Pai", "Mãe", "Padrasto", "Madrasta",
  "Irmão", "Irmã", "Meio-irmão", "Meia-irmã",
  "Filho", "Filha", "Avô", "Avó",
  "Tio", "Tia", "Primo", "Prima",
  "Companheiro/a", "Outro"
];

let game = null;
let initialPeople = [];

function id() {
  return "p_" + Math.random().toString(36).slice(2, 11);
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function newPerson(relation = "Irmão") {
  return {
    id: id(),
    name: "",
    gender: "Masculino",
    age: 0,
    relation,
    parents: [],
    alive: true,
    deathYear: null,
    deathCause: null
  };
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  $(screenId).classList.add("active");
  window.scrollTo(0, 0);
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2400);
}

function saveGame() {
  if (!game) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
}

function notify(message, type = "normal") {
  game.notifications = game.notifications || [];

  game.notifications.unshift({
    id: id(),
    year: game.year,
    message,
    type,
    date: new Date().toISOString()
  });

  game.notifications = game.notifications.slice(0, 150);
}

function renderNotifications() {
  const notifications = game.notifications || [];

  $("notificationCount").textContent = notifications.length;

  if (!notifications.length) {
    $("notifications").innerHTML =
      '<p class="muted">Ainda não existem acontecimentos.</p>';
    return;
  }

  $("notifications").innerHTML = notifications.slice(0, 25).map(item => `
    <div class="notice">
      <span class="date">${item.year}</span>
      · ${safe(item.message)}
    </div>
  `).join("");
}

function currencyFormat(value) {
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: game.currency || "EUR",
      maximumFractionDigits: 0
    }).format(value || 0);
  } catch {
    return `${value || 0} ${game.currency || "EUR"}`;
  }
}

function getPersonName(person) {
  return person.name.trim() || person.relation || "Pessoa sem nome";
}

/* --------------------------------
   FAMÍLIA E ÁRVORE GENEALÓGICA
--------------------------------- */

function parentOptions(person, people) {
  return people
    .filter(other => other.id !== person.id)
    .map(other => `
      <option value="${other.id}"
        ${(person.parents || []).includes(other.id) ? "selected" : ""}>
        ${safe(getPersonName(other))}
      </option>
    `).join("");
}

function renderFamilyEditor(containerId, people) {
  const container = $(containerId);

  if (!people.length) {
    container.innerHTML = '<p class="muted">Ainda não existem familiares.</p>';
    return;
  }

  container.innerHTML = people.map(person => `
    <div class="person-card ${person.alive ? "" : "dead"}">
      <div class="person-name">${safe(getPersonName(person))}</div>
      <div class="person-meta">
        ${safe(person.relation)} · ${person.age} anos ·
        ${person.alive ? "Vivo/a" : "Falecido/a"}
      </div>

      <div class="person-fields">
        <label>Nome
          <input data-person="${person.id}" data-field="name"
            value="${safe(person.name)}">
        </label>

        <label>Parentesco
          <select data-person="${person.id}" data-field="relation">
            ${RELATIONS.map(relation => `
              <option ${person.relation === relation ? "selected" : ""}>
                ${relation}
              </option>
            `).join("")}
          </select>
        </label>

        <label>Sexo
          <select data-person="${person.id}" data-field="gender">
            <option ${person.gender === "Masculino" ? "selected" : ""}>
              Masculino
            </option>
            <option ${person.gender === "Feminino" ? "selected" : ""}>
              Feminino
            </option>
          </select>
        </label>

        <label>Idade
          <input type="number" min="0" max="120"
            data-person="${person.id}" data-field="age"
            value="${person.age}">
        </label>

        <label class="parent-label">
          Pais biológicos / ligações de descendência
          <select multiple size="3"
            data-person="${person.id}" data-field="parents">
            ${parentOptions(person, people)}
          </select>
        </label>
      </div>

      ${person.alive ? `
        <button class="remove-person"
          data-delete="${person.id}">Remover pessoa</button>
      ` : `
        <button class="remove-person"
          data-delete="${person.id}">Remover registo</button>
      `}
    </div>
  `).join("");

  container.querySelectorAll("[data-person]").forEach(control => {
    control.addEventListener("change", () => {
      const person = people.find(p => p.id === control.dataset.person);
      if (!person) return;

      const field = control.dataset.field;

      if (field === "age") {
        person.age = Math.max(0, Math.min(120, Number(control.value)));
      } else if (field === "parents") {
        person.parents = Array.from(control.selectedOptions)
          .map(option => option.value);
      } else {
        person[field] = control.value;
      }

      if (field === "name" || field === "relation" || field === "parents") {
        renderFamilyEditor(containerId, people);
      }
    });
  });

  container.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      const deletedId = button.dataset.delete;

      const index = people.findIndex(p => p.id === deletedId);
      if (index < 0) return;

      people.splice(index, 1);

      people.forEach(person => {
        person.parents = (person.parents || [])
          .filter(parentId => parentId !== deletedId);
      });

      renderFamilyEditor(containerId, people);
    });
  });
}

function addFamilyMember(people, containerId) {
  people.push(newPerson());
  renderFamilyEditor(containerId, people);
}

/* --------------------------------
   CRIAÇÃO DE PERSONAGEM
--------------------------------- */

function setupCountries() {
  const select = $("country");

  COUNTRIES.forEach(country => {
    select.add(new Option(country[0], country[1]));
  });

  select.value = "PT";

  select.addEventListener("change", updateCurrency);
  updateCurrency();
}

function updateCurrency() {
  const selected = COUNTRIES.find(c => c[1] === $("country").value);
  if (!selected) return;

  $("currencyPreview").textContent =
    `${selected[2]} (${selected[3]})`;
}

function startNewGame() {
  const firstName = $("firstName").value.trim();
  const city = $("city").value.trim();

  if (!firstName || !city) {
    toast("Preenche o nome e a cidade.");
    return;
  }

  const country = COUNTRIES.find(c => c[1] === $("country").value)
    || COUNTRIES[0];

  game = {
    firstName,
    lastName: $("lastName").value.trim(),
    gender: $("gender").value,
    age: Number($("initialAge").value),
    city,
    country: country[0],
    currency: country[2],
    currencySymbol: country[3],
    money: 0,
    year: new Date().getFullYear(),
    people: initialPeople.map(person => ({
      ...person,
      parents: [...(person.parents || [])]
    })),
    notifications: [],
    alive: true,
    deathYear: null,
    deathCause: null
  };

  notify("A tua vida começou. Uma nova história está à tua espera.");

  saveGame();
  renderGame();
  showScreen("gameScreen");
}

/* --------------------------------
   CARREGAR E ATUALIZAR GRAVAÇÕES
--------------------------------- */

function normalizeGame() {
  game.people = Array.isArray(game.people) ? game.people : [];
  game.notifications = Array.isArray(game.notifications)
    ? game.notifications : [];

  game.people.forEach(person => {
    person.id = person.id || id();
    person.name = person.name || "";
    person.relation = person.relation || "Outro";
    person.gender = person.gender || "Masculino";
    person.age = Number(person.age) || 0;
    person.parents = Array.isArray(person.parents) ? person.parents : [];
    person.alive = person.alive !== false;
  });

  game.age = Number(game.age) || 18;
  game.year = Number(game.year) || new Date().getFullYear();
  game.money = Number(game.money) || 0;
  game.alive = game.alive !== false;

  if (!game.currency) game.currency = "EUR";
  if (!game.country) game.country = "Portugal";
  if (!game.city) game.city = "Cidade não definida";

  // Corrige ligações para pessoas que já não existem.
  const validIds = new Set(game.people.map(p => p.id));

  game.people.forEach(person => {
    person.parents = person.parents.filter(parentId =>
      validIds.has(parentId) && parentId !== person.id
    );
  });

  // Importação da estrutura familiar simples da versão anterior.
  if (!game.people.length && game.family) {
    const family = game.family;

    if (family.father) {
      game.people.push({
        ...newPerson("Pai"),
        ...family.father,
        id: id(),
        relation: "Pai"
      });
    }

    if (family.mother) {
      game.people.push({
        ...newPerson("Mãe"),
        ...family.mother,
        id: id(),
        relation: "Mãe"
      });
    }

    if (Array.isArray(family.siblings)) {
      family.siblings.forEach(sibling => {
        game.people.push({
          ...newPerson("Irmão"),
          ...sibling,
          id: id(),
          relation: sibling.relation || "Irmão"
        });
      });
    }
  }
}

function continueGame() {
  const stored = localStorage.getItem(SAVE_KEY);

  if (!stored) {
    toast("Não existe uma gravação StarLife v3 neste dispositivo.");
    return;
  }

  try {
    game = JSON.parse(stored);
    normalizeGame();
    saveGame();
    renderGame();
    showScreen("gameScreen");
  } catch (error) {
    console.error(error);
    toast("Não foi possível abrir a gravação.");
  }
}

/* --------------------------------
   ENVELHECIMENTO E MORTE
--------------------------------- */

function mortalityRisk(age) {
  if (age < 1) return 0.003;
  if (age < 15) return 0.0004;
  if (age < 40) return 0.001;
  if (age < 60) return 0.003;
  if (age < 70) return 0.008;
  if (age < 80) return 0.018;
  if (age < 90) return 0.055;
  if (age < 100) return 0.13;
  if (age < 110) return 0.30;
  return 0.55;
}

function deathCauseFor(person) {
  const age = person.age;
  const roll = Math.random();

  if (age >= 85 && roll < 0.65) return "velhice";
  if (roll < 0.55) return "doença";
  return "acidente";
}

function die(person, cause) {
  person.alive = false;
  person.deathYear = game.year;
  person.deathCause = cause;

  const name = getPersonName(person);

  notify(
    `${name} faleceu aos ${person.age} anos. Causa: ${cause}.`,
    "death"
  );

  if (person.isPlayer) {
    game.alive = false;
    game.deathYear = game.year;
    game.deathCause = cause;
    notify("A tua vida terminou. A tua história ficou registada.", "death");
  }
}

function advanceYear() {
  if (!game || !game.alive) return;

  game.year += 1;
  game.age += 1;

  // O jogador também está sujeito ao envelhecimento e à mortalidade.
  const playerRisk = mortalityRisk(game.age);

  if (Math.random() < playerRisk) {
    const player = {
      name: `${game.firstName} ${game.lastName}`.trim(),
      age: game.age,
      isPlayer: true
    };

    die(player, deathCauseFor(player));
  }

  // Cada pessoa tem um registo independente.
  game.people.forEach(person => {
    if (!person.alive) return;

    person.age += 1;

    let risk = mortalityRisk(person.age);

    // Risco adicional aleatório de doença ou acidente.
    if (Math.random() < 0.003) risk += 0.012;
    if (Math.random() < 0.0015) risk += 0.018;

    if (Math.random() < Math.min(risk, 0.95)) {
      die(person, deathCauseFor(person));
    }
  });

  if (game.alive) {
    notify(`Completaste ${game.age} anos. Começou o ano ${game.year}.`);
  }

  saveGame();
  renderGame();

  if (!game.alive) {
    $("lifeStatus").textContent =
      "A tua vida terminou. Podes consultar o percurso e a família.";
    $("ageButton").disabled = true;
    $("ageButton").textContent = "Vida terminada";
  }
}

/* --------------------------------
   ÁRVORE GENEALÓGICA
--------------------------------- */

function renderFamilyTree() {
  if (!game.people.length) {
    return '<p class="muted">Ainda não tens familiares registados.</p>';
  }

  return game.people.map(person => {
    const parents = (person.parents || [])
      .map(parentId => game.people.find(p => p.id === parentId))
      .filter(Boolean);

    const parentText = parents.length
      ? parents.map(getPersonName).join(" e ")
      : "Ligação parental não definida";

    return `
      <div class="tree-node ${person.alive ? "" : "dead"}">
        <strong>${safe(getPersonName(person))}</strong>
        <small>${safe(person.relation)} · ${person.age} anos</small>
        <small>${safe(parentText)}</small>
        <small>${person.alive ? "Vivo/a" :
          `Falecido/a em ${person.deathYear} · ${safe(person.deathCause)}`}</small>
      </div>
    `;
  }).join("");
}

/* --------------------------------
   NAVEGAÇÃO INFERIOR
--------------------------------- */

function renderTab(tab) {
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });

  const titles = {
    home: "Início",
    money: "Dinheiro",
    career: "Carreira",
    business: "Negócios",
    people: "Pessoas",
    shop: "Loja",
    profile: "Perfil"
  };

  $("tabTitle").textContent = titles[tab] || "Início";

  const content = {
    home: `
      <p>Bem-vindo/a, <strong>${safe(game.firstName)}</strong>.</p>
      <p>A tua vida está a decorrer em ${safe(game.city)}, ${safe(game.country)}.</p>
      <p>Consulta as notificações para acompanhares os acontecimentos.</p>
    `,

    money: `
      <h3>Património atual</h3>
      <p class="large-value">${currencyFormat(game.money)}</p>
      <p class="muted">O sistema de salários, despesas, impostos, bancos e investimentos será desenvolvido nas próximas fases.</p>
    `,

    career: `
      <h3>Educação e carreira</h3>
      <p>Esta área será utilizada para estudar, procurar emprego, receber propostas e construir uma carreira profissional.</p>
      <p class="muted">Sistema de carreira ainda em desenvolvimento.</p>
    `,

    business: `
      <h3>Os teus negócios</h3>
      <p>Criação de empresas, contratação de funcionários e gestão empresarial.</p>
      <p class="muted">Sistema de negócios ainda em desenvolvimento.</p>
    `,

    people: `
      <h3>Árvore genealógica</h3>
      <p class="muted">Cada pessoa é um personagem independente.</p>
      ${renderFamilyTree()}
      <button class="secondary wide" id="openFamilyFromPeople">Editar família nas definições</button>
    `,

    shop: `
      <h3>Loja</h3>
      <p>Objetos pessoais, roupa, veículos, casas e outras compras.</p>
      <p class="muted">Loja ainda em desenvolvimento.</p>
    `,

    profile: `
      <h3>${safe(game.firstName)} ${safe(game.lastName)}</h3>
      <p>${game.age} anos · ${safe(game.gender)}</p>
      <p>${safe(game.city)}, ${safe(game.country)}</p>
      <p>Estado: ${game.alive ? "Vivo/a" : "Falecido/a"}</p>
    `
  };

  $("tabContent").innerHTML = content[tab] || content.home;

  $("openFamilyFromPeople")?.addEventListener("click", openSettings);
}

function renderGame() {
  $("playerName").textContent =
    `${game.firstName} ${game.lastName}`.trim();

  $("playerLocation").textContent =
    `${game.city}, ${game.country}`;

  $("playerAge").textContent = game.age;
  $("playerMoney").textContent = currencyFormat(game.money);
  $("currentYear").textContent = game.year;

  renderNotifications();
  renderTab("home");

  $("ageButton").disabled = !game.alive;
  $("ageButton").textContent =
    game.alive ? "🎂 Avançar um ano" : "Vida terminada";

  $("lifeStatus").textContent = game.alive
    ? "A tua história continua."
    : `Faleceste em ${game.deathYear}. Causa: ${game.deathCause}.`;
}

/* --------------------------------
   DEFINIÇÕES
--------------------------------- */

function openSettings() {
  if (!game) return;

  renderFamilyEditor("familyEditor", game.people);
  $("settingsModal").classList.add("open");
}

function closeSettings() {
  $("settingsModal").classList.remove("open");
}

function exportSave() {
  if (!game) return;

  const file = new Blob(
    [JSON.stringify(game, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = "StarLife_gravacao.json";
  link.click();

  URL.revokeObjectURL(url);
  toast("Gravação preparada para exportação.");
}

/* --------------------------------
   INICIALIZAÇÃO
--------------------------------- */

function init() {
  setupCountries();

  initialPeople = [
    newPerson("Pai"),
    newPerson("Mãe"),
    newPerson("Irmão")
  ];

  renderFamilyEditor("initialFamily", initialPeople);

  $("newGameBtn").addEventListener("click", () => {
    showScreen("createScreen");
  });

  $("continueBtn").addEventListener("click", continueGame);

  $("addInitialPerson").addEventListener("click", () => {
    addFamilyMember(initialPeople, "initialFamily");
  });

  $("startGameBtn").addEventListener("click", startNewGame);

  $("ageButton").addEventListener("click", advanceYear);

  $("settingsBtn").addEventListener("click", openSettings);
  $("closeSettings").addEventListener("click", closeSettings);

  $("addFamilyPerson").addEventListener("click", () => {
    addFamilyMember(game.people, "familyEditor");
  });

  $("saveFamily").addEventListener("click", () => {
    saveGame();
    renderGame();
    closeSettings();
    toast("Árvore genealógica guardada.");
  });

  $("saveGame").addEventListener("click", () => {
    saveGame();
    toast("Jogo guardado.");
  });

  $("exportGame").addEventListener("click", exportSave);

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      renderTab(button.dataset.tab);
    });
  });

  if (localStorage.getItem(SAVE_KEY)) {
    $("saveMessage").textContent =
      "Existe uma gravação StarLife neste dispositivo.";
  }
}

document.addEventListener("DOMContentLoaded", init);
