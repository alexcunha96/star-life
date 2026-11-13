"use strict";

/* =========================================
   STARLIFE - SISTEMA PRINCIPAL
========================================= */

const SAVE_KEY = "starlife_save_v1";

let game = null;
let initialFamily = [];
let toastTimer = null;

const $ = (id) => document.getElementById(id);

function createId() {
  return "person_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

function money(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function saveGame() {
  if (!game) return;

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    updateContinuePanel();
  } catch (error) {
    console.error("Erro ao guardar o jogo:", error);
    showToast("Não foi possível guardar o jogo.");
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;

    const loaded = JSON.parse(saved);

    if (!loaded || !loaded.player || !Array.isArray(loaded.family)) {
      return null;
    }

    return loaded;
  } catch (error) {
    console.error("Erro ao carregar gravação:", error);
    return null;
  }
}

function updateContinuePanel() {
  const saved = loadGame();
  $("continuePanel").classList.toggle("hidden", !saved);
}

function addEvent(message, type = "neutral") {
  if (!game) return;

  game.events.unshift({
    message,
    type,
    age: game.player.age
  });

  game.events = game.events.slice(0, 40);
}

function addFinanceEvent(message) {
  if (!game) return;

  game.financeHistory.unshift({
    message,
    age: game.player.age
  });

  game.financeHistory = game.financeHistory.slice(0, 30);
}

/* =========================================
   FAMÍLIA
========================================= */

function createFamilyMember(data) {
  return {
    id: createId(),
    name: data.name || "Sem nome",
    surname: data.surname || "",
    relation: data.relation || "Outro",
    age: Number(data.age) || 0,
    sex: data.sex || "Outro",
    alive: true,
    job: "",
    salary: 0,
    biologicalParentIds: [],
    adoptiveParentIds: [],
    socialParentIds: [],
    relationship: 70
  };
}

function relationIsMother(relation) {
  return ["mãe", "mae"].includes(String(relation).toLowerCase());
}

function relationIsFather(relation) {
  return String(relation).toLowerCase() === "pai";
}

function createAutomaticFamily() {
  const mother = createFamilyMember({
    name: "Mãe",
    surname: game.player.surname,
    relation: "Mãe",
    age: 28,
    sex: "Feminino"
  });

  const father = createFamilyMember({
    name: "Pai",
    surname: game.player.surname,
    relation: "Pai",
    age: 30,
    sex: "Masculino"
  });

  game.family.push(mother, father);

  game.player.biologicalParentIds = [mother.id, father.id];
}

function connectInitialParents() {
  const mother = game.family.find(person => relationIsMother(person.relation));
  const father = game.family.find(person => relationIsFather(person.relation));

  game.player.biologicalParentIds = [];

  if (mother) {
    game.player.biologicalParentIds.push(mother.id);
  }

  if (father) {
    game.player.biologicalParentIds.push(father.id);
  }
}

function getPersonFullName(person) {
  return `${person.name} ${person.surname || ""}`.trim();
}

function getRelationLabel(person) {
  return person.relation || "Familiar";
}

function getParentNames(person) {
  const ids = [
    ...(person.biologicalParentIds || []),
    ...(person.adoptiveParentIds || []),
    ...(person.socialParentIds || [])
  ];

  const names = ids
    .map(id => game.family.find(member => member.id === id))
    .filter(Boolean)
    .map(getPersonFullName);

  return names.length ? names.join(", ") : "Não definido";
}

function addFamilyMember(data, linkType = "biological") {
  if (!game) return;

  const person = createFamilyMember(data);

  if (linkType === "biological") {
    person.biologicalParentIds = [];
  } else if (linkType === "adoptive") {
    person.adoptiveParentIds = [];
  } else {
    person.socialParentIds = [];
  }

  game.family.push(person);

  // Se for filho ou filha, a personagem atual é considerada progenitor.
  if (["Filho", "Filha"].includes(person.relation)) {
    person.biologicalParentIds = [game.player.id];
  }

  addEvent(`${getPersonFullName(person)} passou a fazer parte da tua família.`);
  saveGame();
  renderGame();
  renderFamilyEditor();
}

function removeFamilyMember(id) {
  const person = game.family.find(member => member.id === id);
  if (!person) return;

  if (!confirm(`Queres mesmo remover ${getPersonFullName(person)} da família?`)) {
    return;
  }

  game.family = game.family.filter(member => member.id !== id);

  // Retira ligações a familiares que já não existem.
  const remainingIds = new Set(game.family.map(member => member.id));

  game.player.biologicalParentIds =
    (game.player.biologicalParentIds || []).filter(id => remainingIds.has(id));

  game.family.forEach(member => {
    member.biologicalParentIds =
      (member.biologicalParentIds || []).filter(id => remainingIds.has(id));

    member.adoptiveParentIds =
      (member.adoptiveParentIds || []).filter(id => remainingIds.has(id));

    member.socialParentIds =
      (member.socialParentIds || []).filter(id => remainingIds.has(id));
  });

  addEvent(`${getPersonFullName(person)} deixou de fazer parte da tua família.`);
  saveGame();
  renderGame();
  renderFamilyEditor();
}

function editFamilyMember(id) {
  const person = game.family.find(member => member.id === id);
  if (!person) return;

  const newName = prompt("Nome:", person.name);
  if (newName === null) return;

  const newSurname = prompt("Apelido:", person.surname || "");
  if (newSurname === null) return;

  const newAge = prompt("Idade:", String(person.age));
  if (newAge === null) return;

  const age = Number(newAge);

  if (!newName.trim() || !Number.isFinite(age) || age < 0 || age > 110) {
    showToast("Verifica o nome e a idade.");
    return;
  }

  const newRelation = prompt("Parentesco:", person.relation);
  if (newRelation === null) return;

  person.name = newName.trim();
  person.surname = newSurname.trim();
  person.age = Math.floor(age);
  person.relation = newRelation.trim() || "Outro";

  addEvent(`Atualizaste os dados de ${getPersonFullName(person)}.`);
  saveGame();
  renderGame();
  renderFamilyEditor();
}

function renderPeople() {
  const container = $("peopleList");
  container.innerHTML = "";

  if (!game.family.length) {
    container.innerHTML = "<p class='muted'>Ainda não tens familiares registados.</p>";
    return;
  }

  game.family.forEach(person => {
    const card = document.createElement("div");
    card.className = "person-card";

    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>
          ${escapeHTML(getRelationLabel(person))} ·
          ${person.age} anos ·
          ${person.alive ? "Vivo/a" : "Falecido/a"}
        </small>
        <small>Relação: ${person.relationship ?? 70}%</small>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderFamilyEditor() {
  const container = $("familyEditorList");
  if (!container || !game) return;

  container.innerHTML = "";

  if (!game.family.length) {
    container.innerHTML = "<p class='muted'>Ainda não tens familiares. Podes adicionar abaixo.</p>";
    return;
  }

  game.family.forEach(person => {
    const card = document.createElement("div");
    card.className = "person-card";

    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>${escapeHTML(person.relation)} · ${person.age} anos</small>
        <small>Progenitores: ${escapeHTML(getParentNames(person))}</small>
      </div>
      <div class="person-actions">
        <button class="small-btn" data-edit-person="${person.id}">Editar</button>
        <button class="small-btn" data-remove-person="${person.id}">Remover</button>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll("[data-edit-person]").forEach(button => {
    button.addEventListener("click", () => {
      editFamilyMember(button.dataset.editPerson);
    });
  });

  container.querySelectorAll("[data-remove-person]").forEach(button => {
    button.addEventListener("click", () => {
      removeFamilyMember(button.dataset.removePerson);
    });
  });
}

function renderFamilyTree() {
  const container = $("familyTree");
  container.innerHTML = "";

  const parents = game.family.filter(person =>
    (game.player.biologicalParentIds || []).includes(person.id) ||
    (game.player.adoptiveParentIds || []).includes(person.id) ||
    (game.player.socialParentIds || []).includes(person.id)
  );

  const children = game.family.filter(person =>
    [
      ...(person.biologicalParentIds || []),
      ...(person.adoptiveParentIds || []),
      ...(person.socialParentIds || [])
    ].includes(game.player.id)
  );

  const siblings = game.family.filter(person => {
    const personParents = [
      ...(person.biologicalParentIds || []),
      ...(person.adoptiveParentIds || []),
      ...(person.socialParentIds || [])
    ];

    const playerParents = [
      ...(game.player.biologicalParentIds || []),
      ...(game.player.adoptiveParentIds || []),
      ...(game.player.socialParentIds || [])
    ];

    return personParents.some(id => playerParents.includes(id)) &&
      !children.some(child => child.id === person.id);
  });

  function personBox(person, current = false) {
    return `
      <div class="tree-person ${current ? "current" : ""}">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>${current ? "Tu" : escapeHTML(person.relation)}</small>
        <small>${person.age} anos</small>
      </div>
    `;
  }

  if (parents.length) {
    const parentSection = document.createElement("div");
    parentSection.innerHTML = `
      <div class="tree-generation">
        ${parents.map(person => personBox(person)).join("")}
      </div>
      <div class="tree-connector">↓</div>
    `;
    container.appendChild(parentSection);
  }

  const currentSection = document.createElement("div");
  currentSection.innerHTML = `
    <div class="tree-generation">
      ${personBox(game.player, true)}
    </div>
  `;
  container.appendChild(currentSection);

  if (siblings.length) {
    const siblingSection = document.createElement("div");
    siblingSection.innerHTML = `
      <div class="tree-connector">↔</div>
      <div class="tree-generation">
        ${siblings.map(person => personBox(person)).join("")}
      </div>
    `;
    container.appendChild(siblingSection);
  }

  if (children.length) {
    const childrenSection = document.createElement("div");
    childrenSection.innerHTML = `
      <div class="tree-connector">↓</div>
      <div class="tree-generation">
        ${children.map(person => personBox(person)).join("")}
      </div>
    `;
    container.appendChild(childrenSection);
  }

  if (!parents.length && !siblings.length && !children.length) {
    container.innerHTML = "<p class='muted'>A tua árvore genealógica começa contigo. Adiciona familiares nas Definições.</p>";
  }
}

/* =========================================
   CRIAR E INICIAR JOGO
========================================= */

function validateStart() {
  const name = $("playerName").value.trim();
  const surname = $("playerSurname").value.trim();
  const sex = $("playerSex").value;
  const country = $("playerCountry").value.trim();
  const city = $("playerCity").value.trim();

  if (!name || !surname || !sex || !country || !city) {
    showToast("Preenche todos os campos para começares a jogar.");
    return false;
  }

  return true;
}

function startGame() {
  if (!validateStart()) return;

  const player = {
    id: createId(),
    name: $("playerName").value.trim(),
    surname: $("playerSurname").value.trim(),
    sex: $("playerSex").value,
    country: $("playerCountry").value.trim(),
    city: $("playerCity").value.trim(),

    // Todas as personagens começam como recém-nascidas.
    age: 0,

    alive: true,
    health: 100,
    happiness: 80,
    education: "Sem escolaridade",
    educationLevel: 0,
    job: "",
    salary: 0,
    bank: 1000,
    debt: 0,
    expenses: 0,

    biologicalParentIds: [],
    adoptiveParentIds: [],
    socialParentIds: []
  };

  game = {
    player,
    family: [],
    events: [],
    financeHistory: [],
    businesses: [],
    year: new Date().getFullYear(),
    started: true
  };

  if (initialFamily.length === 0) {
    createAutomaticFamily();
    addEvent("Nasceste! A tua mãe tem 28 anos e o teu pai tem 30 anos.");
  } else {
    game.family = initialFamily.map(person => ({
      ...person,
      id: createId()
    }));

    connectInitialParents();

    addEvent("Nasceste! A tua família foi criada com os familiares que adicionaste.");
  }

  addFinanceEvent(`Começaste a vida com ${money(player.bank)} na conta bancária.`);

  saveGame();
  showGame();
  renderGame();
  showToast("A tua vida no StarLife começou!");
}

function showGame() {
  $("setupScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("bottomNav").classList.remove("hidden");
  $("gameStatus").textContent = "Em jogo";
  showTab("homeTab");
}

function showSetup() {
  $("gameScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");
  $("setupScreen").classList.remove("hidden");
  $("gameStatus").textContent = "Nova vida";
  updateContinuePanel();
}

/* =========================================
   PASSAGEM DO TEMPO
========================================= */

function advanceYear() {
  if (!game || !game.player.alive) return;

  const player = game.player;

  player.age += 1;
  game.year += 1;

  // Envelhecimento dos familiares vivos.
  game.family.forEach(person => {
    if (person.alive) {
      person.age += 1;
      person.relationship = clamp(
        (person.relationship ?? 70) + (Math.random() < 0.5 ? 1 : -1)
      );

      // Possibilidade simplificada de falecimento.
      const risk = person.age < 60
        ? 0.001
        : person.age < 75
          ? 0.008
          : person.age < 85
            ? 0.025
            : person.age < 95
              ? 0.07
              : 0.16;

      if (Math.random() < risk) {
        person.alive = false;
        addEvent(`${getPersonFullName(person)} faleceu aos ${person.age} anos.`, "negative");
        player.happiness = clamp(player.happiness - 12);
      }
    }
  });

  // Saúde e felicidade variam ligeiramente com a idade.
  player.health = clamp(player.health + (Math.random() * 4 - 2));
  player.happiness = clamp(player.happiness + (Math.random() * 6 - 3));

  // Infância e escolaridade.
  if (player.age === 3) {
    addEvent("Começaste a descobrir o mundo e a desenvolver novas capacidades.");
  }

  if (player.age === 6) {
    player.education = "Ensino básico";
    player.educationLevel = 1;
    addEvent("Começaste a escola primária! 🎒");
  }

  if (player.age === 10) {
    addEvent("Estás a crescer e a aprender cada vez mais.");
  }

  if (player.age === 15) {
    addEvent("Estás a aproximar-te de uma nova fase da tua vida.");
  }

  if (player.age === 18) {
    player.education = "Ensino secundário";
    player.educationLevel = Math.max(player.educationLevel, 2);
    addEvent("Fizeste 18 anos! Entraste na idade adulta. 🎉");
  }

  if (player.age === 16) {
    addEvent("Já tens idade para procurar algumas oportunidades de trabalho.");
  }

  // Rendimentos e despesas.
  let income = player.salary || 0;

  game.businesses.forEach(business => {
    income += business.yearlyProfit || 0;
  });

  if (player.age >= 18) {
    const livingCosts = 1200 + (player.age * 15);
    player.expenses = livingCosts;

    const balance = income - livingCosts;
    player.bank += balance;

    if (balance >= 0) {
      addFinanceEvent(`Recebeste ${money(income)} e gastaste ${money(livingCosts)}. Saldo positivo: ${money(balance)}.`);
    } else {
      addFinanceEvent(`Recebeste ${money(income)} e gastaste ${money(livingCosts)}. Saldo negativo: ${money(balance)}.`);
    }

    if (player.bank < 0) {
      player.debt += Math.abs(player.bank);
      player.bank = 0;
      addEvent("Ficaste sem dinheiro e começaste a acumular dívidas.", "negative");
    }
  } else {
    player.expenses = 0;
  }

  // Eventos gerais.
  if (player.age === 1) {
    addEvent("Completaste o teu primeiro ano de vida! 🎂");
  } else if (player.age > 1 && player.age % 5 === 0) {
    addEvent(`Fizeste ${player.age} anos. Mais um capítulo da tua história! 🎂`);
  }

  if (player.age >= 110) {
    player.alive = false;
    addEvent("A tua vida chegou ao fim. A tua história ficará para sempre registada.", "negative");
    showToast("A tua personagem faleceu.");
  }

  saveGame();
  renderGame();
}

/* =========================================
   CARREIRA E EDUCAÇÃO
========================================= */

const jobs = [
  {
    name: "Empregado de supermercado",
    minimumAge: 16,
    salary: 950,
    education: 0
  },
  {
    name: "Assistente de loja",
    minimumAge: 16,
    salary: 1000,
    education: 0
  },
  {
    name: "Barbeiro",
    minimumAge: 18,
    salary: 14000,
    education: 1
  },
  {
    name: "Cozinheiro",
    minimumAge: 18,
    salary: 15000,
    education: 1
  },
  {
    name: "Técnico especializado",
    minimumAge: 20,
    salary: 22000,
    education: 2
  },
  {
    name: "Professor",
    minimumAge: 22,
    salary: 26000,
    education: 3
  }
];

function applyForJob(index) {
  const job = jobs[index];
  const player = game.player;

  if (player.age < job.minimumAge) {
    showToast(`Precisas de ter pelo menos ${job.minimumAge} anos.`);
    return;
  }

  if (player.educationLevel < job.education) {
    showToast("Ainda não tens a escolaridade necessária.");
    return;
  }

  player.job = job.name;
  player.salary = job.salary;

  addEvent(`Conseguiste um emprego como ${job.name}!`);
  addFinanceEvent(`Começaste a trabalhar como ${job.name}, com um salário anual de ${money(job.salary)}.`);

  saveGame();
  renderGame();
  showToast("Conseguiste um novo emprego!");
}

function startEducation(level, name, minimumAge) {
  const player = game.player;

  if (player.age < minimumAge) {
    showToast(`Esta opção está disponível a partir dos ${minimumAge} anos.`);
    return;
  }

  if (player.educationLevel >= level) {
    showToast("Já tens este nível de escolaridade ou superior.");
    return;
  }

  player.education = name;
  player.educationLevel = level;

  addEvent(`Concluíste uma etapa de educação: ${name}.`);

  saveGame();
  renderGame();
  showToast("Educação atualizada!");
}

function renderCareer() {
  const player = game.player;

  $("careerJob").textContent = player.job || "Nenhuma";
  $("careerSalary").textContent = money(player.salary || 0);
  $("careerEducation").textContent = player.education;

  $("careerDescription").textContent = player.job
    ? `Trabalhas como ${player.job}. Continua a desenvolver a tua carreira.`
    : "Ainda não tens uma profissão. Podes procurar oportunidades quando tiveres idade.";

  const jobContainer = $("jobOptions");
  jobContainer.innerHTML = "";

  jobs.forEach((job, index) => {
    const button = document.createElement("button");
    button.className = "secondary-btn";
    button.textContent = `${job.name} · ${money(job.salary)}/ano · ${job.minimumAge}+`;
    button.disabled = player.age < job.minimumAge ||
      player.educationLevel < job.education;

    button.addEventListener("click", () => applyForJob(index));
    jobContainer.appendChild(button);
  });

  const educationContainer = $("educationOptions");
  educationContainer.innerHTML = "";

  const educationChoices = [
    { level: 1, name: "Ensino básico", age: 6 },
    { level: 2, name: "Ensino secundário", age: 15 },
    { level: 3, name: "Ensino superior", age: 18 }
  ];

  educationChoices.forEach(choice => {
    const button = document.createElement("button");
    button.className = "secondary-btn";
    button.textContent = `${choice.name} · ${choice.age}+ anos`;
    button.disabled = player.age < choice.age ||
      player.educationLevel >= choice.level;

    button.addEventListener("click", () => {
      startEducation(choice.level, choice.name, choice.age);
    });

    educationContainer.appendChild(button);
  });
}

/* =========================================
   NEGÓCIOS
========================================= */

function createBusiness() {
  if (game.player.age < 18) {
    showToast("Tens de ter pelo menos 18 anos para criar um negócio.");
    return;
  }

  const name = prompt("Qual será o nome do teu negócio?");
  if (!name || !name.trim()) return;

  const investmentText = prompt("Quanto queres investir inicialmente? (mínimo 500 €)");
  if (investmentText === null) return;

  const investment = Number(investmentText);

  if (!Number.isFinite(investment) || investment < 500) {
    showToast("O investimento mínimo é de 500 €.");
    return;
  }

  if (game.player.bank < investment) {
    showToast("Não tens dinheiro suficiente na conta bancária.");
    return;
  }

  game.player.bank -= investment;

  const business = {
    id: createId(),
    name: name.trim(),
    investment,
    yearlyProfit: Math.round(investment * 0.15),
    createdAtAge: game.player.age
  };

  game.businesses.push(business);

  addEvent(`Abriste o negócio "${business.name}"!`);
  addFinanceEvent(`Investiste ${money(investment)} na criação de "${business.name}".`);

  saveGame();
  renderGame();
  showToast("Negócio criado!");
}

function renderBusinesses() {
  const container = $("businessList");
  container.innerHTML = "";

  if (!game.businesses.length) {
    container.innerHTML = "<p class='muted'>Ainda não tens negócios. Cria o teu primeiro negócio!</p>";
    return;
  }

  game.businesses.forEach(business => {
    const card = document.createElement("div");
    card.className = "business-card";

    card.innerHTML = `
      <strong>${escapeHTML(business.name)}</strong>
      <p>Investimento inicial: ${money(business.investment)}</p>
      <p>Lucro anual estimado: <strong>${money(business.yearlyProfit)}</strong></p>
    `;

    container.appendChild(card);
  });
}

/* =========================================
   PATRIMÓNIO E PERFIL
========================================= */

function calculateWealth() {
  const businessValue = game.businesses.reduce(
    (total, business) => total + business.investment,
    0
  );

  return game.player.bank + businessValue - game.player.debt;
}

function renderPatrimony() {
  const player = game.player;

  $("totalWealth").textContent = money(calculateWealth());
  $("bankBalance").textContent = money(player.bank);
  $("annualSalary").textContent = money(player.salary);
  $("annualExpenses").textContent = money(player.expenses);
  $("debtValue").textContent = money(player.debt);

  const container = $("financeHistory");
  container.innerHTML = "";

  if (!game.financeHistory.length) {
    container.innerHTML = "<p class='muted'>Ainda não existem movimentos financeiros.</p>";
    return;
  }

  game.financeHistory.forEach(item => {
    const element = document.createElement("div");
    element.className = "event-item neutral";
    element.innerHTML = `
      ${escapeHTML(item.message)}
      <small>Idade: ${item.age} anos</small>
    `;
    container.appendChild(element);
  });
}

function renderProfile() {
  const player = game.player;

  $("profileDetails").innerHTML = `
    <div class="info-row"><span>Nome</span><strong>${escapeHTML(getPersonFullName(player))}</strong></div>
    <div class="info-row"><span>Sexo</span><strong>${escapeHTML(player.sex)}</strong></div>
    <div class="info-row"><span>Idade</span><strong>${player.age} anos</strong></div>
    <div class="info-row"><span>País</span><strong>${escapeHTML(player.country)}</strong></div>
    <div class="info-row"><span>Cidade</span><strong>${escapeHTML(player.city)}</strong></div>
    <div class="info-row"><span>Estado</span><strong>${player.alive ? "Vivo/a" : "Falecido/a"}</strong></div>
    <div class="info-row"><span>Profissão</span><strong>${escapeHTML(player.job || "Nenhuma")}</strong></div>
    <div class="info-row"><span>Património</span><strong>${money(calculateWealth())}</strong></div>
  `;
}

/* =========================================
   ECRÃ INICIAL E ACONTECIMENTOS
========================================= */

function renderHome() {
  const player = game.player;

  $("homePlayerName").textContent = getPersonFullName(player);
  $("homePlayerLocation").textContent = `${player.city}, ${player.country}`;
  $("homeAge").textContent = player.age;

  $("healthValue").textContent = `${Math.round(player.health)}%`;
  $("happinessValue").textContent = `${Math.round(player.happiness)}%`;

  $("healthBar").style.width = `${player.health}%`;
  $("happinessBar").style.width = `${player.happiness}%`;

  $("educationValue").textContent = player.education;
  $("jobValue").textContent = player.job || "Sem profissão";

  if (!player.alive) {
    $("lifeSummary").textContent = "A tua personagem já faleceu. Podes consultar a história e começar uma nova vida nas Definições.";
    $("advanceYearBtn").disabled = true;
  } else {
    $("advanceYearBtn").disabled = false;

    if (player.age === 0) {
      $("lifeSummary").textContent = "Acabaste de nascer. A tua aventura começa agora!";
    } else if (player.age < 6) {
      $("lifeSummary").textContent = "Estás a viver os primeiros anos da tua infância.";
    } else if (player.age < 13) {
      $("lifeSummary").textContent = "Estás na infância, a crescer e a descobrir o mundo.";
    } else if (player.age < 18) {
      $("lifeSummary").textContent = "Estás na adolescência. Muitas decisões importantes aproximam-se.";
    } else if (player.age < 30) {
      $("lifeSummary").textContent = "És adulto/a e estás a construir o teu próprio caminho.";
    } else {
      $("lifeSummary").textContent = "A tua vida continua a evoluir. Cada decisão pode mudar o teu futuro.";
    }
  }

  const eventsContainer = $("recentEvents");
  eventsContainer.innerHTML = "";

  if (!game.events.length) {
    eventsContainer.innerHTML = "<p class='muted'>Ainda não existem acontecimentos.</p>";
  } else {
    game.events.slice(0, 8).forEach(event => {
      const element = document.createElement("div");
      element.className = `event-item ${event.type || "neutral"}`;
      element.innerHTML = `
        ${escapeHTML(event.message)}
        <small>Idade: ${event.age} anos</small>
      `;
      eventsContainer.appendChild(element);
    });
  }
}

/* =========================================
   RENDERIZAÇÃO GERAL
========================================= */

function renderGame() {
  if (!game) return;

  renderHome();
  renderPatrimony();
  renderCareer();
  renderBusinesses();
  renderPeople();
  renderFamilyTree();
  renderProfile();
  renderFamilyEditor();

  $("gameStatus").textContent = game.player.alive
    ? `${game.player.age} anos`
    : "Vida terminada";
}

/* =========================================
   NAVEGAÇÃO
========================================= */

function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.add("hidden");
  });

  const selected = $(tabId);
  if (selected) selected.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================
   FAMÍLIA INICIAL
========================================= */

function addInitialFamilyMember() {
  const name = $("initialFamilyName").value.trim();
  const relation = $("initialFamilyRelation").value;
  const ageText = $("initialFamilyAge").value;
  const sex = $("initialFamilySex").value;

  if (!name || ageText === "") {
    showToast("Indica o nome e a idade do familiar.");
    return;
  }

  const age = Number(ageText);

  if (!Number.isFinite(age) || age < 0 || age > 110) {
    showToast("A idade tem de estar entre 0 e 110 anos.");
    return;
  }

  initialFamily.push({
    name,
    surname: "",
    relation,
    age: Math.floor(age),
    sex
  });

  $("initialFamilyName").value = "";
  $("initialFamilyAge").value = "";

  renderInitialFamily();
  showToast("Familiar adicionado!");
}

function renderInitialFamily() {
  const container = $("initialFamilyList");
  container.innerHTML = "";

  initialFamily.forEach((person, index) => {
    const item = document.createElement("div");
    item.className = "family-item";

    item.innerHTML = `
      <div>
        <strong>${escapeHTML(person.name)}</strong>
        <small>${escapeHTML(person.relation)} · ${person.age} anos</small>
      </div>
      <button class="small-btn" data-remove-initial="${index}">Remover</button>
    `;

    container.appendChild(item);
  });

  container.querySelectorAll("[data-remove-initial]").forEach(button => {
    button.addEventListener("click", () => {
      initialFamily.splice(Number(button.dataset.removeInitial), 1);
      renderInitialFamily();
    });
  });
}

/* =========================================
   DEFINIÇÕES E GRAVAÇÕES
========================================= */

function openFamilyEditor() {
  $("familyEditor").classList.remove("hidden");
  renderFamilyEditor();
  $("familyEditor").scrollIntoView({ behavior: "smooth" });
}

function newLife() {
  if (!confirm("Tens a certeza de que queres começar uma nova vida? A gravação atual será substituída.")) {
    return;
  }

  game = null;
  initialFamily = [];

  localStorage.removeItem(SAVE_KEY);

  $("startForm").reset();
  $("playerCountry").value = "Portugal";
  $("initialFamilyList").innerHTML = "";
  $("familyEditor").classList.add("hidden");

  showSetup();
  showToast("Podes criar uma nova personagem.");
}

function exportSave() {
  if (!game) return;

  const data = JSON.stringify(game, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "starlife-gravacao.json";
  link.click();

  URL.revokeObjectURL(url);
  showToast("Gravação exportada!");
}

function importSave(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);

      if (!imported.player || !Array.isArray(imported.family)) {
        throw new Error("Ficheiro inválido");
      }

      game = imported;

      // Garante que os campos essenciais existem em gravações antigas.
      game.player.health ??= 100;
      game.player.happiness ??= 80;
      game.player.bank ??= 0;
      game.player.debt ??= 0;
      game.player.salary ??= 0;
      game.player.expenses ??= 0;
      game.player.education ??= "Sem escolaridade";
      game.player.educationLevel ??= 0;
      game.player.biologicalParentIds ??= [];
      game.player.adoptiveParentIds ??= [];
      game.player.socialParentIds ??= [];

      game.events ??= [];
      game.financeHistory ??= [];
      game.businesses ??= [];

      game.family.forEach(person => {
        person.biologicalParentIds ??= [];
        person.adoptiveParentIds ??= [];
        person.socialParentIds ??= [];
        person.relationship ??= 70;
        person.alive ??= true;
      });

      saveGame();
      showGame();
      renderGame();
      showToast("Gravação importada com sucesso!");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível importar este ficheiro.");
    }
  };

  reader.readAsText(file);
}

/* =========================================
   EVENTOS E INICIALIZAÇÃO
========================================= */

function boot() {
  $("startForm").addEventListener("submit", event => {
    event.preventDefault();
    startGame();
  });

  $("addInitialFamilyBtn").addEventListener("click", addInitialFamilyMember);

  $("continueGameBtn").addEventListener("click", () => {
    const saved = loadGame();

    if (!saved) {
      showToast("Não existe nenhuma gravação válida.");
      return;
    }

    game = saved;
    showGame();
    renderGame();
  });

  $("deleteSaveBtn").addEventListener("click", () => {
    if (!confirm("Queres apagar a gravação guardada?")) return;

    localStorage.removeItem(SAVE_KEY);
    updateContinuePanel();
    showToast("Gravação apagada.");
  });

  $("advanceYearBtn").addEventListener("click", advanceYear);

  $("createBusinessBtn").addEventListener("click", createBusiness);

  $("showFamilyEditorBtn").addEventListener("click", openFamilyEditor);

  $("closeFamilyEditorBtn").addEventListener("click", () => {
    $("familyEditor").classList.add("hidden");
  });

  $("familyForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("familyName").value.trim();
    const surname = $("familySurname").value.trim();
    const relation = $("familyRelation").value;
    const age = Number($("familyAge").value);
    const sex = $("familySex").value;
    const linkType = $("familyLinkType").value;

    if (!name || !Number.isFinite(age) || age < 0 || age > 110) {
      showToast("Preenche corretamente os dados do familiar.");
      return;
    }

    addFamilyMember({
      name,
      surname,
      relation,
      age,
      sex
    }, linkType);

    $("familyForm").reset();
  });

  $("newLifeBtn").addEventListener("click", newLife);

  $("exportSaveBtn").addEventListener("click", exportSave);

  $("importSaveInput").addEventListener("change", event => {
    importSave(event.target.files[0]);
    event.target.value = "";
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      showTab(button.dataset.tab);
    });
  });

  updateContinuePanel();

  const saved = loadGame();

  if (saved) {
    $("continuePanel").classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", boot);
