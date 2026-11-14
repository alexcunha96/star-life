"use strict";

/* =========================================
   STARLIFE - SISTEMA PRINCIPAL
   EDUCAÇÃO + FAMÍLIA + RELAÇÕES + CARREIRA
========================================= */

const SAVE_KEY = "starlife_save_v1";

let game = null;
let initialFamily = [];
let toastTimer = null;

const $ = id => document.getElementById(id);

function createId() {
  return "person_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function saveGame() {
  if (!game) return;

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    updateContinuePanel();
  } catch (error) {
    console.error("Erro ao guardar:", error);
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
    console.error("Erro ao carregar:", error);
    return null;
  }
}

function updateContinuePanel() {
  const saved = loadGame();
  if ($("continuePanel")) {
    $("continuePanel").classList.toggle("hidden", !saved);
  }
}

function addEvent(message, type = "neutral") {
  if (!game) return;

  game.events.unshift({
    message,
    type,
    age: game.player.age
  });

  game.events = game.events.slice(0, 50);
}

function addFinanceEvent(message) {
  if (!game) return;

  game.financeHistory.unshift({
    message,
    age: game.player.age
  });

  game.financeHistory = game.financeHistory.slice(0, 40);
}

/* =========================================
   NOMES E DADOS
========================================= */

const femaleNames = [
  "Maria", "Ana", "Beatriz", "Inês", "Sofia",
  "Matilde", "Leonor", "Carolina", "Mariana",
  "Margarida", "Catarina", "Joana", "Rita",
  "Francisca", "Marta", "Laura", "Alice",
  "Diana", "Cláudia", "Raquel", "Teresa",
  "Isabel", "Helena", "Andreia", "Patrícia",
  "Eva", "Luísa", "Daniela", "Filipa"
];

const maleNames = [
  "João", "Pedro", "Miguel", "Francisco", "Tiago",
  "Diogo", "André", "Rafael", "Gonçalo",
  "Martim", "Afonso", "Tomás", "Duarte",
  "Bruno", "Ricardo", "Daniel", "António",
  "Manuel", "Luís", "Gabriel", "David",
  "Nuno", "Hugo", "Filipe", "Eduardo",
  "José", "Rodrigo", "Vasco", "Guilherme"
];

const surnames = [
  "Silva", "Santos", "Ferreira", "Pereira",
  "Oliveira", "Costa", "Rodrigues", "Martins",
  "Sousa", "Gomes", "Lopes", "Almeida",
  "Ribeiro", "Carvalho", "Moreira", "Mendes",
  "Teixeira", "Nunes", "Correia", "Monteiro"
];

const personalities = [
  "Carinhoso/a", "Aventureiro/a", "Tímido/a",
  "Extrovertido/a", "Ambicioso/a", "Calmo/a",
  "Ciumento/a", "Divertido/a", "Romântico/a",
  "Independente", "Sensível", "Confiante"
];

const interests = [
  "Desporto", "Música", "Cinema", "Viagens",
  "Animais", "Tecnologia", "Natureza",
  "Jogos", "Culinária", "Leitura", "Moda",
  "Carros", "Arte", "Dança"
];

const familyJobs = [
  { name: "Empregado/a de supermercado", salary: 11500 },
  { name: "Assistente de loja", salary: 12000 },
  { name: "Barbeiro/a", salary: 14500 },
  { name: "Cabeleireiro/a", salary: 14500 },
  { name: "Cozinheiro/a", salary: 15500 },
  { name: "Empregado/a de mesa", salary: 12000 },
  { name: "Motorista", salary: 16500 },
  { name: "Pedreiro/a", salary: 17000 },
  { name: "Eletricista", salary: 19000 },
  { name: "Mecânico/a", salary: 18000 },
  { name: "Enfermeiro/a", salary: 24000 },
  { name: "Professor/a", salary: 25000 },
  { name: "Engenheiro/a", salary: 32000 },
  { name: "Advogado/a", salary: 35000 },
  { name: "Médico/a", salary: 42000 },
  { name: "Empresário/a", salary: 38000 }
];

function generateName(sex) {
  if (sex === "Feminino") return randomFrom(femaleNames);
  if (sex === "Masculino") return randomFrom(maleNames);
  return randomFrom([...femaleNames, ...maleNames]);
}

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
    relationship: 70,
    partnerId: null,
    relationshipStatus: "Solteiro/a",
    marriageAge: null,
    childrenCount: 0
  };
}

function createSocialPerson(data = {}) {
  return {
    id: createId(),
    name: data.name || generateName(data.sex),
    surname: data.surname || randomFrom(surnames),
    sex: data.sex || randomFrom(["Masculino", "Feminino"]),
    age: Number(data.age) || 18,
    city: data.city || game.player.city,
    country: data.country || game.player.country,
    alive: true,
    personality: data.personality || randomFrom(personalities),
    interests: data.interests || [
      randomFrom(interests),
      randomFrom(interests)
    ],
    compatibility: randomNumber(35, 95),
    friendship: 0,
    love: 0,
    status: "Conhecido/a",
    partnerId: null,
    relationshipStatus: "Solteiro/a",
    job: "",
    salary: 0,
    childrenCount: 0,
    metAtAge: game.player.age
  };
}

function relationIsMother(relation) {
  return ["mãe", "mae"].includes(String(relation).toLowerCase());
}

function relationIsFather(relation) {
  return String(relation).toLowerCase() === "pai";
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

  return ids
    .map(id => game.family.find(member => member.id === id))
    .filter(Boolean)
    .map(getPersonFullName)
    .join(", ") || "Não definido";
}

/* =========================================
   SISTEMA DE EVENTOS ALEATÓRIOS
========================================= */

const randomEventsPool = [
  {
    minAge: 6, maxAge: 12,
    text: "Encontraste uma nota de 20€ no chão da escola do teu colega.",
    options: [
      { text: "Entregar ao professor", effect: () => { game.player.happiness = clamp(game.player.happiness + 2); addEvent("Fizeste a coisa certa e entregaste o dinheiro.", "positive"); } },
      { text: "Guardar para ti", effect: () => { game.player.bank += 20; addEvent("Ficaste com os 20€ e gastaste em doces.", "neutral"); } }
    ]
  },
  {
    minAge: 12, maxAge: 18,
    text: "Um grupo de colegas convidou-te para faltar às aulas e ir dar uma volta.",
    options: [
      { text: "Ir com eles", effect: () => { game.player.happiness = clamp(game.player.happiness + 5); game.player.behavior = clamp(game.player.behavior - 10); addEvent("Faltaste às aulas e divertiste-te, mas o comportamento piorou.", "negative"); } },
      { text: "Recusar e ficar na aula", effect: () => { game.player.schoolPerformance = clamp(game.player.schoolPerformance + 4); addEvent("Ficaste na aula e tiraste bom proveito.", "positive"); } }
    ]
  },
  {
    minAge: 18, maxAge: 80,
    text: "Alguém bateu levemente no teu carro num parque de estacionamento e fugiu, mas conseguiste ver a matrícula.",
    options: [
      { text: "Apresentar queixa na polícia", effect: () => { game.player.bank += 300; addFinanceEvent("Recebeste uma indemnização de 300€ pelo seguro."); addEvent("O seguro cobriu os danos do carro.", "positive"); } },
      { text: "Ignorar e seguir caminho", effect: () => { game.player.happiness = clamp(game.player.happiness - 2); addEvent("Decidiste não chatear a cabeça com isso."); } }
    ]
  },
  {
    minAge: 20, maxAge: 65,
    text: "Surgiram horas extra no teu local de trabalho, mas vais ter de ficar até tarde.",
    options: [
      { text: "Aceitar as horas extra", effect: () => { const bonus = 800; game.player.bank += bonus; addFinanceEvent(`Ganhaste um bónus de ${money(bonus)} pelas horas extra.`); addEvent("Trabalhaste afincadamente e recebeste um extra no banco.", "positive"); } },
      { text: "Recusar e ir descansar", effect: () => { game.player.happiness = clamp(game.player.happiness + 3); addEvent("Preferiste descansar e cuidar da tua saúde mental."); } }
    ]
  }
];

function triggerRandomEvent() {
  if (!game || !game.player.alive) return;
  const age = game.player.age;

  const validEvents = randomEventsPool.filter(ev => age >= ev.minAge && age <= ev.maxAge);
  if (validEvents.length === 0 || Math.random() > 0.45) return;

  const ev = randomFrom(validEvents);
  
  // Criar modal de evento
  let modal = $("eventModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "eventModal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <h3>⚠️ Acontecimento na tua vida</h3>
      <p>${escapeHTML(ev.text)}</p>
      <div class="modal-buttons" id="eventOptionsContainer"></div>
    </div>
  `;
  modal.classList.remove("hidden");

  const btnContainer = $("eventOptionsContainer");
  ev.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "primary-btn full-width";
    btn.textContent = opt.text;
    btn.addEventListener("click", () => {
      opt.effect();
      modal.classList.add("hidden");
      saveGame();
      renderGame();
    });
    btnContainer.appendChild(btn);
  });
}

/* =========================================
   SISTEMA DE EDUCAÇÃO
========================================= */

const educationStages = [
  { name: "Creche", start: 0, end: 2, level: 0 },
  { name: "Jardim de infância", start: 3, end: 5, level: 0 },
  { name: "1.º Ciclo do Ensino Básico", start: 6, end: 9, level: 1 },
  { name: "2.º Ciclo do Ensino Básico", start: 10, end: 11, level: 1 },
  { name: "3.º Ciclo do Ensino Básico", start: 12, end: 14, level: 1 },
  { name: "Ensino Secundário", start: 15, end: 17, level: 2 }
];

const professionalCourses = [
  { name: "Curso Profissional de Barbeiro", cost: 1200, duration: 1, education: 1, qualification: "Barbeiro" },
  { name: "Curso de Cozinha", cost: 1500, duration: 1, education: 1, qualification: "Cozinheiro" },
  { name: "Curso de Eletricidade", cost: 2200, duration: 2, education: 1, qualification: "Eletricista" },
  { name: "Curso de Mecânica", cost: 2000, duration: 2, education: 1, qualification: "Mecânico" },
  { name: "Curso de Gestão", cost: 2500, duration: 1, education: 2, qualification: "Gestão" },
  { name: "Curso de Informática", cost: 1800, duration: 1, education: 2, qualification: "Informática" }
];

const universityCourses = [
  { name: "Medicina", cost: 3500, duration: 6, salary: 42000 },
  { name: "Direito", cost: 2500, duration: 4, salary: 35000 },
  { name: "Engenharia", cost: 2800, duration: 5, salary: 32000 },
  { name: "Enfermagem", cost: 2200, duration: 4, salary: 24000 },
  { name: "Educação", cost: 2200, duration: 3, salary: 26000 },
  { name: "Psicologia", cost: 2500, duration: 5, salary: 28000 },
  { name: "Gestão", cost: 2300, duration: 3, salary: 30000 }
];

function getCurrentEducationStage(age) {
  return educationStages.find(stage => age >= stage.start && age <= stage.end) || null;
}

function initializeEducation(player) {
  player.intelligence ??= randomNumber(35, 85);
  player.schoolPerformance ??= 50;
  player.behavior ??= 75;
  player.absences ??= 0;
  player.schoolGrade ??= 12;
  player.schoolStatus ??= "Ainda não começou";
  player.currentSchoolStage ??= "";
  player.education ??= "Sem escolaridade";
  player.educationLevel ??= 0;
  player.educationHistory ??= [];
  player.professionalQualifications ??= [];
  player.universityCourse ??= null;
  player.universityProgress ??= 0;
  player.professionalCourse ??= null;
  player.professionalProgress ??= 0;
  player.studying ??= false;
  player.studyDebt ??= 0;
}

function addEducationHistory(message) {
  const player = game.player;
  player.educationHistory ??= [];
  player.educationHistory.unshift({ message, age: player.age });
  player.educationHistory = player.educationHistory.slice(0, 30);
}

function startSchoolStage(stage) {
  const player = game.player;
  if (player.currentSchoolStage === stage.name) return;

  player.currentSchoolStage = stage.name;
  player.schoolStatus = "A frequentar";
  player.schoolGrade = clamp(Math.round((player.intelligence * 0.12) + randomNumber(5, 10)), 5, 20);

  addEducationHistory(`Começaste o ${stage.name}.`);
  addEvent(`🎒 Começaste o ${stage.name}!`);
}

function processSchoolYear() {
  const player = game.player;
  const age = player.age;
  const stage = getCurrentEducationStage(age);

  if (!stage) return;

  if (age <= 5) {
    if (age === 3 && player.currentSchoolStage !== "Jardim de infância") {
      player.currentSchoolStage = "Jardim de infância";
      player.schoolStatus = "A frequentar";
      addEvent("Começaste o jardim de infância! 🧸");
      addEducationHistory("Iniciaste o jardim de infância.");
    }
    return;
  }

  if (age === 6 || player.currentSchoolStage === "") {
    startSchoolStage(stage);
  } else if (player.currentSchoolStage !== stage.name) {
    startSchoolStage(stage);
  }

  if (player.schoolStatus === "Abandonou os estudos") return;

  const intelligenceBonus = (player.intelligence - 50) / 25;
  const performanceBonus = (player.schoolPerformance - 50) / 20;
  const behaviorBonus = (player.behavior - 50) / 30;
  const randomFactor = randomNumber(-3, 3);

  let grade = Math.round(10 + intelligenceBonus + performanceBonus + behaviorBonus + randomFactor);
  player.schoolGrade = clamp(grade, 0, 20);

  if (Math.random() < 0.06) player.absences += randomNumber(1, 4);

  if (player.absences > 12) {
    player.schoolGrade = clamp(player.schoolGrade - 2, 0, 20);
  }

  if (player.schoolGrade >= 10) {
    player.schoolPerformance = clamp(player.schoolPerformance + randomNumber(1, 4));
    addEducationHistory(`Aprovado/a em ${stage.name} com média de ${player.schoolGrade}/20.`);

    if (age === 9) addEvent("Concluíste o 1.º ciclo do ensino básico! 📚");
    if (age === 11) addEvent("Concluíste o 2.º ciclo do ensino básico!");
    if (age === 14) {
      player.education = "Ensino básico";
      player.educationLevel = Math.max(player.educationLevel, 1);
      addEvent("Concluíste o ensino básico! 🎓");
    }
    if (age === 17) {
      player.education = "Ensino secundário";
      player.educationLevel = Math.max(player.educationLevel, 2);
      player.schoolStatus = "Concluído";
      addEvent("🎓 Concluíste o ensino secundário!");
    }
  } else {
    player.schoolStatus = "Reprovado/a";
    player.happiness = clamp(player.happiness - 5);
    addEvent(`Ficaste retido/a no ${stage.name} com média de ${player.schoolGrade}/20.`, "negative");
    addEducationHistory(`Reprovaste no ${stage.name}. Média: ${player.schoolGrade}/20.`);
  }

  player.absences = Math.max(0, player.absences - randomNumber(2, 5));
}

function studyHarder() {
  const player = game.player;
  if (player.age < 6 || player.age > 18) {
    showToast("Não estás atualmente em idade escolar.");
    return;
  }
  player.intelligence = clamp(player.intelligence + randomNumber(1, 3));
  player.schoolPerformance = clamp(player.schoolPerformance + randomNumber(5, 10));
  player.schoolGrade = clamp(player.schoolGrade + randomNumber(1, 3), 0, 20);
  addEvent("Dedicaste tempo ao estudo e melhoraste o teu aproveitamento. 📚");
  saveGame();
  renderGame();
  showToast("Estudaste e melhoraste as notas!");
}

function improveBehavior() {
  const player = game.player;
  player.behavior = clamp(player.behavior + randomNumber(5, 12));
  player.absences = Math.max(0, player.absences - randomNumber(1, 3));
  addEvent("Melhoraste o teu comportamento e reduziste as faltas.");
  saveGame();
  renderGame();
}

function abandonEducation() {
  const player = game.player;
  if (player.age < 15 || !confirm("Tens a certeza de que queres abandonar os estudos?")) return;
  player.schoolStatus = "Abandonou os estudos";
  player.education = player.educationLevel >= 1 ? "Ensino básico incompleto" : "Sem escolaridade";
  addEvent("Decidiste abandonar os estudos.", "negative");
  saveGame();
  renderGame();
}

function returnToSchool() {
  const player = game.player;
  player.schoolStatus = "A frequentar";
  player.currentSchoolStage = player.age <= 17 ? "Ensino Secundário" : "Ensino Recorrente";
  addEvent("Regressaste aos estudos! 📚");
  saveGame();
  renderGame();
}

function enrollUniversity(index) {
  const player = game.player;
  const course = universityCourses[index];
  if (player.bank < course.cost) {
    showToast(`Precisas de ${money(course.cost)} para pagar a inscrição.`);
    return;
  }
  player.bank -= course.cost;
  player.universityCourse = course.name;
  player.universityProgress = 0;
  player.studying = true;
  addFinanceEvent(`Pagaste ${money(course.cost)} pela inscrição em ${course.name}.`);
  addEvent(`Entraste na universidade para estudar ${course.name}! 🎓`);
  saveGame();
  renderGame();
}

function enrollProfessionalCourse(index) {
  const player = game.player;
  const course = professionalCourses[index];
  if (player.bank < course.cost) {
    showToast(`Precisas de ${money(course.cost)} para pagar o curso.`);
    return;
  }
  player.bank -= course.cost;
  player.professionalCourse = course.name;
  player.professionalProgress = 0;
  addFinanceEvent(`Pagaste ${money(course.cost)} pelo curso ${course.name}.`);
  addEvent(`Começaste o curso profissional: ${course.name}.`);
  saveGame();
  renderGame();
}

function processFurtherEducation() {
  const player = game.player;
  if (player.universityCourse) {
    player.universityProgress++;
    const course = universityCourses.find(c => c.name === player.universityCourse);
    if (player.universityProgress >= (course?.duration || 4)) {
      player.education = `Licenciatura em ${player.universityCourse}`;
      player.educationLevel = 3;
      player.salary = Math.max(player.salary, course?.salary || 22000);
      player.universityCourse = null;
      player.universityProgress = 0;
      addEvent(`🎓 Concluíste a universidade! Licenciatura em ${course?.name}.`);
    } else if (course) {
      player.bank -= course.cost;
      addFinanceEvent(`Pagaste ${money(course.cost)} de propinas universitárias.`);
      if (player.bank < 0) {
        player.studyDebt += Math.abs(player.bank);
        player.bank = 0;
      }
    }
  }

  if (player.professionalCourse) {
    player.professionalProgress++;
    const course = professionalCourses.find(c => c.name === player.professionalCourse);
    if (course && player.professionalProgress >= course.duration) {
      player.professionalQualifications.push(course.qualification);
      addEvent(`Concluíste o curso profissional: ${course.name}! 🎓`);
      player.professionalCourse = null;
      player.professionalProgress = 0;
    }
  }
}

/* =========================================
   FAMÍLIA
========================================= */

function createAutomaticFamily() {
  const mother = createFamilyMember({
    name: generateName("Feminino"),
    surname: game.player.surname,
    relation: "Mãe",
    age: randomNumber(18, 45),
    sex: "Feminino"
  });

  const father = createFamilyMember({
    name: generateName("Masculino"),
    surname: game.player.surname,
    relation: "Pai",
    age: randomNumber(18, 50),
    sex: "Masculino"
  });

  mother.partnerId = father.id;
  father.partnerId = mother.id;
  mother.relationshipStatus = "Casado/a";
  father.relationshipStatus = "Casado/a";

  game.family.push(mother, father);
  game.player.biologicalParentIds = [mother.id, father.id];

  return { mother, father };
}

function connectInitialParents() {
  const mother = game.family.find(person => relationIsMother(person.relation));
  const father = game.family.find(person => relationIsFather(person.relation));
  game.player.biologicalParentIds = [];
  if (mother) game.player.biologicalParentIds.push(mother.id);
  if (father) game.player.biologicalParentIds.push(father.id);
}

function addFamilyMember(data, linkType = "biological") {
  if (!game) return;
  const person = createFamilyMember(data);
  game.family.push(person);
  addEvent(`${getPersonFullName(person)} passou a fazer parte da tua família.`);
  saveGame();
  renderGame();
  renderFamilyEditor();
}

function removeFamilyMember(id) {
  const person = game.family.find(member => member.id === id);
  if (!person || !confirm(`Queres mesmo remover ${getPersonFullName(person)}?`)) return;
  game.family = game.family.filter(member => member.id !== id);
  saveGame();
  renderGame();
  renderFamilyEditor();
}

function editFamilyMember(id) {
  const person = game.family.find(member => member.id === id);
  if (!person) return;
  const newName = prompt("Nome:", person.name);
  if (newName === null) return;
  person.name = newName.trim();
  saveGame();
  renderGame();
  renderFamilyEditor();
}

function renderPeople() {
  const container = $("peopleList");
  if (!container) return;
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
        <small>${escapeHTML(getRelationLabel(person))} · ${person.age} anos</small>
        <small>Profissão: ${escapeHTML(person.job || "Sem profissão")}</small>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderFamilyEditor() {
  const container = $("familyEditorList");
  if (!container || !game) return;
  container.innerHTML = "";
  game.family.forEach(person => {
    const card = document.createElement("div");
    card.className = "person-card";
    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>${escapeHTML(person.relation)} · ${person.age} anos</small>
      </div>
      <div class="person-actions">
        <button class="small-btn" data-edit-person="${person.id}">Editar</button>
        <button class="small-btn" data-remove-person="${person.id}">Remover</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-edit-person]").forEach(button => {
    button.addEventListener("click", () => editFamilyMember(button.dataset.editPerson));
  });
  container.querySelectorAll("[data-remove-person]").forEach(button => {
    button.addEventListener("click", () => removeFamilyMember(button.dataset.removePerson));
  });
}

function renderFamilyTree() {
  const container = $("familyTree");
  if (!container) return;
  container.innerHTML = "<p class='muted'>Árvore genealógica ativa.</p>";
}

/* =========================================
   VIDA AUTÓNOMA DOS FAMILIARES
========================================= */

function findFamilyPartner(person) {
  if (!person.partnerId) return null;
  return game.family.find(member => member.id === person.partnerId) || null;
}

function processFamilyLife() {
  if (!game) return;
  game.family.forEach(person => {
    if (!person.alive) return;
    person.age += 1;
    if (person.age >= 16 && !person.job && Math.random() < 0.3) {
      const j = randomFrom(familyJobs);
      person.job = j.name;
      person.salary = j.salary;
    }
  });
}

/* =========================================
   RELAÇÕES DO JOGADOR
========================================= */

function getSocialPerson(id) {
  return game.socialPeople.find(person => person.id === id) || null;
}

function getPlayerPartner() {
  if (!game.player.partnerId) return null;
  return getSocialPerson(game.player.partnerId);
}

function createNewAcquaintances() {
  if (game.player.age < 10) {
    showToast("Ainda és demasiado novo/a.");
    return;
  }
  for (let i = 0; i < 2; i++) {
    game.socialPeople.push(createSocialPerson({ age: game.player.age + randomNumber(-3, 3) }));
  }
  showToast("Conheceste novas pessoas!");
  saveGame();
  renderRelationships();
}

function talkToPerson(id) {
  const p = getSocialPerson(id);
  if (!p) return;
  p.friendship = clamp(p.friendship + 10);
  game.player.happiness = clamp(game.player.happiness + 2);
  addEvent(`Conversaste com ${getPersonFullName(p)}. 🙂`);
  saveGame();
  renderGame();
}

function askForRelationship(id) {
  const p = getSocialPerson(id);
  if (!p) return;
  game.player.partnerId = p.id;
  game.player.relationshipStatus = "Namoro";
  p.partnerId = game.player.id;
  p.relationshipStatus = "Namoro";
  addEvent(`Começaste a namorar com ${getPersonFullName(p)}! ❤️`);
  saveGame();
  renderGame();
}

function breakUp() {
  const partner = getPlayerPartner();
  if (!partner) return;
  game.player.partnerId = null;
  game.player.relationshipStatus = "Solteiro/a";
  partner.partnerId = null;
  partner.relationshipStatus = "Solteiro/a";
  addEvent("Terminaste a relação.", "negative");
  saveGame();
  renderGame();
}

function installRelationshipsUI() {
  const nav = $("bottomNav");
  const profileTab = $("profileTab");
  if (!nav || !profileTab) return;

  let section = $("relationshipsTab");
  if (!section) {
    section = document.createElement("section");
    section.id = "relationshipsTab";
    section.className = "tab-content hidden";
    section.innerHTML = `
      <div class="panel">
        <h2>❤️ Relações</h2>
        <button id="meetPeopleBtn" class="primary-btn full-width">+ Conhecer pessoas</button>
      </div>
      <div id="currentRelationshipPanel"></div>
      <div class="panel">
        <h3>Amigos e conhecidos</h3>
        <div id="socialPeopleList" class="people-list"></div>
      </div>
    `;
    profileTab.parentNode.insertBefore(section, profileTab);
  }

  let navButton = nav.querySelector('[data-tab="relationshipsTab"]');
  if (!navButton) {
    navButton = document.createElement("button");
    navButton.className = "nav-btn";
    navButton.dataset.tab = "relationshipsTab";
    navButton.innerHTML = "❤️<span>Relações</span>";
    nav.insertBefore(navButton, nav.querySelector('[data-tab="profileTab"]'));
  }

  const meetBtn = $("meetPeopleBtn");
  if (meetBtn && !meetBtn.dataset.installed) {
    meetBtn.dataset.installed = "true";
    meetBtn.addEventListener("click", createNewAcquaintances);
  }
}

function renderRelationships() {
  if (!game) return;
  installRelationshipsUI();
  const player = game.player;
  const partner = getPlayerPartner();
  const currentPanel = $("currentRelationshipPanel");
  const peopleContainer = $("socialPeopleList");

  if (!currentPanel || !peopleContainer) return;

  if (partner) {
    currentPanel.innerHTML = `
      <div class="panel">
        <h3>❤️ Namoro com ${escapeHTML(getPersonFullName(partner))}</h3>
        <button class="danger-btn full-width" data-action="breakup">Terminar relação</button>
      </div>
    `;
    currentPanel.querySelector('[data-action="breakup"]').addEventListener("click", breakUp);
  } else {
    currentPanel.innerHTML = `<div class="panel"><h3>Solteiro/a</h3></div>`;
  }

  peopleContainer.innerHTML = "";
  game.socialPeople.forEach(person => {
    const card = document.createElement("div");
    card.className = "person-card";
    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>${person.age} anos · Amizade: ${person.friendship}%</small>
      </div>
      <div class="person-actions">
        <button class="small-btn" data-talk="${person.id}">Conversar</button>
        ${!player.partnerId ? `<button class="small-btn" data-date="${person.id}">Namorar</button>` : ""}
      </div>
    `;
    peopleContainer.appendChild(card);
  });

  peopleContainer.querySelectorAll("[data-talk]").forEach(btn => {
    btn.addEventListener("click", () => talkToPerson(btn.dataset.talk));
  });
  peopleContainer.querySelectorAll("[data-date]").forEach(btn => {
    btn.addEventListener("click", () => askForRelationship(btn.dataset.date));
  });
}

function processSocialLife() {
  if (!game) return;
  game.socialPeople.forEach(p => p.age += 1);
}

/* =========================================
   CRIAÇÃO E INÍCIO DO JOGO
========================================= */

function validateStart() {
  return $("playerName").value.trim() && $("playerSurname").value.trim();
}

function startGame() {
  if (!validateStart()) {
    showToast("Preenche o nome e apelido.");
    return;
  }

  const player = {
    id: createId(),
    name: $("playerName").value.trim(),
    surname: $("playerSurname").value.trim(),
    sex: $("playerSex").value,
    country: $("playerCountry").value.trim(),
    city: $("playerCity").value.trim(),
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
    partnerId: null,
    relationshipStatus: "Solteiro/a"
  };

  game = {
    player,
    family: [],
    socialPeople: [],
    events: [],
    financeHistory: [],
    businesses: [],
    year: new Date().getFullYear(),
    started: true
  };

  initializeEducation(player);

  if (initialFamily.length === 0) {
    createAutomaticFamily();
    addEvent("Nasceste!");
  } else {
    game.family = initialFamily.map(f => createFamilyMember(f));
    connectInitialParents();
    addEvent("Nasceste com a tua família personalizada!");
  }

  saveGame();
  showGame();
  renderGame();
}

function showGame() {
  $("setupScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  $("bottomNav").classList.remove("hidden");
  installRelationshipsUI();
  showTab("homeTab");
}

function showSetup() {
  $("gameScreen").classList.add("hidden");
  $("bottomNav").classList.add("hidden");
  $("setupScreen").classList.remove("hidden");
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

  processFamilyLife();
  processSocialLife();
  processSchoolYear();
  processFurtherEducation();

  let income = player.salary || 0;
  game.businesses.forEach(b => income += b.yearlyProfit || 0);

  if (player.age >= 18) {
    const livingCosts = 1000 + (player.age * 12);
    player.expenses = livingCosts;
    const balance = income - livingCosts;
    player.bank += balance;
    addFinanceEvent(`Recebeste ${money(income)} e gastaste ${money(livingCosts)}.`);
  }

  triggerRandomEvent();

  if (player.age >= 110) {
    player.alive = false;
    addEvent("A tua vida chegou ao fim.", "negative");
  }

  saveGame();
  renderGame();
}

/* =========================================
   CARREIRA
========================================= */

const jobs = [
  { name: "Empregado de supermercado", minimumAge: 16, salary: 12000, education: 0 },
  { name: "Assistente de loja", minimumAge: 16, salary: 13000, education: 0 },
  { name: "Barbeiro", minimumAge: 18, salary: 14500, education: 1, qualification: "Barbeiro" },
  { name: "Cozinheiro", minimumAge: 18, salary: 15500, education: 1, qualification: "Cozinheiro" },
  { name: "Professor", minimumAge: 22, salary: 26000, education: 3, course: "Educação" },
  { name: "Médico", minimumAge: 24, salary: 42000, education: 3, course: "Medicina" }
];

function applyForJob(index) {
  const job = jobs[index];
  const player = game.player;
  if (player.age < job.minimumAge) {
    showToast("Não tens idade suficiente.");
    return;
  }
  player.job = job.name;
  player.salary = job.salary;
  addEvent(`Conseguiste um emprego como ${job.name}!`);
  saveGame();
  renderGame();
}

/* =========================================
   NEGÓCIOS
========================================= */

function createBusiness() {
  if (game.player.age < 18) {
    showToast("Precisas de ter 18 anos.");
    return;
  }
  const name = prompt("Nome do negócio:");
  if (!name) return;
  const inv = Number(prompt("Investimento inicial (min. 500 €):"));
  if (!inv || inv < 500 || game.player.bank < inv) {
    showToast("Investimento inválido ou sem saldo.");
    return;
  }
  game.player.bank -= inv;
  game.businesses.push({ id: createId(), name, investment: inv, yearlyProfit: Math.round(inv * 0.2) });
  addEvent(`Criaste o negócio "${name}"!`);
  saveGame();
  renderGame();
}

function sellBusiness(id) {
  const idx = game.businesses.findIndex(b => b.id === id);
  if (idx === -1) return;
  const b = game.businesses[idx];
  game.player.bank += b.investment;
  game.businesses.splice(idx, 1);
  addEvent(`Vendeste o negócio "${b.name}" e recuperaste o investimento.`);
  saveGame();
  renderGame();
}

function renderBusinesses() {
  const container = $("businessList");
  container.innerHTML = "";
  if (!game.businesses.length) {
    container.innerHTML = "<p class='muted'>Sem negócios ativos.</p>";
    return;
  }
  game.businesses.forEach(b => {
    const card = document.createElement("div");
    card.className = "business-card";
    card.innerHTML = `
      <strong>${escapeHTML(b.name)}</strong>
      <p>Lucro anual: ${money(b.yearlyProfit)}</p>
      <button class="small-btn" data-sell-business="${b.id}">Vender negócio</button>
    `;
    container.appendChild(card);
  });
  container.querySelectorAll("[data-sell-business]").forEach(btn => {
    btn.addEventListener("click", () => sellBusiness(btn.dataset.sellBusiness));
  });
}

/* =========================================
   RENDERIZAÇÃO GERAL
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

  const eventsContainer = $("recentEvents");
  eventsContainer.innerHTML = "";
  game.events.slice(0, 8).forEach(ev => {
    const el = document.createElement("div");
    el.className = `event-item ${ev.type || "neutral"}`;
    el.innerHTML = `${escapeHTML(ev.message)}<small>Idade: ${ev.age}</small>`;
    eventsContainer.appendChild(el);
  });
}

function renderPatrimony() {
  const player = game.player;
  const totalW = player.bank + game.businesses.reduce((acc, b) => acc + b.investment, 0);
  $("totalWealth").textContent = money(totalW);
  $("bankBalance").textContent = money(player.bank);
  $("annualSalary").textContent = money(player.salary);
  $("annualExpenses").textContent = money(player.expenses);
  $("debtValue").textContent = money(player.debt);
}

function renderCareer() {
  const player = game.player;
  $("careerJob").textContent = player.job || "Nenhuma";
  $("careerSalary").textContent = money(player.salary);
  $("careerEducation").textContent = player.education;

  const jobContainer = $("jobOptions");
  jobContainer.innerHTML = "";
  jobs.forEach((job, index) => {
    const btn = document.createElement("button");
    btn.className = "secondary-btn";
    btn.textContent = `${job.name} · ${money(job.salary)}/ano`;
    btn.disabled = player.age < job.minimumAge;
    btn.addEventListener("click", () => applyForJob(index));
    jobContainer.appendChild(btn);
  });
}

function renderProfile() {
  $("profileDetails").innerHTML = `
    <div class="info-row"><span>Nome</span><strong>${getPersonFullName(game.player)}</strong></div>
    <div class="info-row"><span>Idade</span><strong>${game.player.age} anos</strong></div>
  `;
}

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
  renderRelationships();
}

function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
  const selected = $(tabId);
  if (selected) selected.classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
}

function boot() {
  $("startForm").addEventListener("submit", e => { e.preventDefault(); startGame(); });
  $("continueGameBtn").addEventListener("click", () => {
    const saved = loadGame();
    if (saved) {
      game = saved;
      showGame();
      renderGame();
    }
  });
  $("advanceYearBtn").addEventListener("click", advanceYear);
  $("createBusinessBtn").addEventListener("click", createBusiness);
  
  $("bottomNav").addEventListener("click", e => {
    const btn = e.target.closest(".nav-btn");
    if (btn && btn.dataset.tab) showTab(btn.dataset.tab);
  });

  updateContinuePanel();
}

document.addEventListener("DOMContentLoaded", boot);
