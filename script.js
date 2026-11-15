"use strict";

/* =========================================
   STARLIFE - SISTEMA PRINCIPAL COMPLETO
========================================= */

const SAVE_KEY = "starlife_save_v2";

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
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    const loaded = JSON.parse(saved);
    if (!loaded || !loaded.player || !Array.isArray(loaded.family)) return null;
    loaded.player.hasDrivingLicense ??= false;
    loaded.vehicles ??= [];
    loaded.player.illness ??= null;
    loaded.player.maxAge ??= randomNumber(75, 105);
    return loaded;
  } catch (error) {
    return null;
  }
}

function deleteSave() {
  if (!confirm("Tens a certeza de que queres apagar o jogo guardado?")) return;
  localStorage.removeItem(SAVE_KEY);
  game = null;
  updateContinuePanel();
  showSetup();
  showToast("Jogo guardado apagado.");
}

function updateContinuePanel() {
  const saved = loadGame();
  if ($("continuePanel")) {
    $("continuePanel").classList.toggle("hidden", !saved);
  }
}

function addEvent(message, type = "neutral") {
  if (!game) return;
  game.events.unshift({ message, type, age: game.player.age });
  game.events = game.events.slice(0, 60);
}

function addFinanceEvent(message) {
  if (!game) return;
  game.financeHistory.unshift({ message, age: game.player.age });
  game.financeHistory = game.financeHistory.slice(0, 50);
}

/* =========================================
   LISTAS DE NOMES, EPITÁFIOS E DOENÇAS
========================================= */

const femaleNames = ["Maria", "Ana", "Beatriz", "Inês", "Sofia", "Matilde", "Leonor", "Carolina", "Mariana", "Margarida", "Catarina", "Joana", "Rita", "Francisca", "Marta", "Laura", "Alice", "Diana", "Cláudia", "Raquel", "Teresa", "Isabel", "Helena", "Andreia", "Patrícia", "Eva", "Luísa", "Daniela", "Filipa"];
const maleNames = ["João", "Pedro", "Miguel", "Francisco", "Tiago", "Diogo", "André", "Rafael", "Gonçalo", "Martim", "Afonso", "Tomás", "Duarte", "Bruno", "Ricardo", "Daniel", "António", "Manuel", "Luís", "Gabriel", "David", "Nuno", "Hugo", "Filipe", "Eduardo", "José", "Rodrigo", "Vasco", "Guilherme"];
const surnames = ["Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Sousa", "Gomes", "Lopes", "Almeida", "Ribeiro", "Carvalho", "Moreira", "Mendes", "Teixeira", "Nunes", "Correia", "Monteiro"];
const personalities = ["Carinhoso/a", "Aventureiro/a", "Tímido/a", "Extrovertido/a", "Ambicioso/a", "Calmo/a", "Ciumento/a", "Divertido/a", "Romântico/a", "Independente", "Sensível", "Confiante"];
const interests = ["Desporto", "Música", "Cinema", "Viagens", "Animais", "Tecnologia", "Natureza", "Jogos", "Culinária", "Leitura", "Moda", "Carros", "Arte", "Dança"];

const tombstoneQuotes = [
  "Viveu intensamente, partiu em paz.",
  "Deixou saudades em todos os que cruzaram o seu caminho.",
  "Descansa em paz. A jornada foi longa e bela.",
  "Amou, riu, aprendeu e agora descansa.",
  "Uma lenda nunca morre, apenas descansa.",
  "Fez do mundo um lugar um pouco melhor.",
  "O livro da sua vida fechou-se com chave de ouro.",
  "A morte não é o fim, mas uma nova paragem."
];

const familyJobs = [
  { name: "Empregado/a de supermercado", salary: 11500 }, { name: "Assistente de loja", salary: 12000 },
  { name: "Barbeiro/a", salary: 14500 }, { name: "Cozinheiro/a", salary: 15500 },
  { name: "Motorista", salary: 16500 }, { name: "Eletricista", salary: 19000 },
  { name: "Enfermeiro/a", salary: 24000 }, { name: "Professor/a", salary: 25000 },
  { name: "Engenheiro/a", salary: 32000 }, { name: "Médico/a", salary: 42000 }
];

const commonIllnesses = [
  { name: "Gripe Sazonal", severity: "Baixa", cost: 50, healthImpact: 5 },
  { name: "Hipertensão Arterial", severity: "Média", cost: 350, healthImpact: 12 },
  { name: "Depressão Crónica", severity: "Média", cost: 500, healthImpact: 15 },
  { name: "Úlcera Estomacal", severity: "Média", cost: 400, healthImpact: 10 },
  { name: "Cancro em Estádio Inicial", severity: "Alta", cost: 6000, healthImpact: 35 },
  { name: "Doença Cardíaca", severity: "Alta", cost: 4500, healthImpact: 30 }
];

function generateName(sex) {
  if (sex === "Feminino") return randomFrom(femaleNames);
  if (sex === "Masculino") return randomFrom(maleNames);
  return randomFrom([...femaleNames, ...maleNames]);
}

function createFamilyMember(data) {
  return {
    id: data.id || createId(),
    name: data.name || "Sem nome",
    surname: data.surname || "",
    relation: data.relation || "Outro",
    age: Number(data.age) || 0,
    sex: data.sex || "Outro",
    alive: true,
    job: "",
    salary: 0,
    relationship: 70,
    partnerId: data.partnerId || null,
    relationshipStatus: data.relationshipStatus || "Solteiro/a"
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
    friendship: 0,
    love: 0,
    partnerId: null,
    relationshipStatus: "Solteiro/a",
    job: "",
    salary: 0
  };
}

/* =========================================
   +200 EVENTOS ALEATÓRIOS DIVERSIFICADOS
========================================= */

const lifeEventsPool = [
  // INFÂNCIA (0-5)
  { minAge: 0, maxAge: 5, text: "Deste os teus primeiros passos na sala de estar.", options: [{ text: "Sorrir para os pais", effect: () => { game.player.happiness = clamp(game.player.happiness + 5); addEvent("Os teus pais celebraram os teus primeiros passos.", "positive"); } }] },
  { minAge: 2, maxAge: 5, text: "Encontraste tintas de pintar e decoraste o gato da família.", options: [{ text: "Rir", effect: () => { game.player.happiness = clamp(game.player.happiness + 4); addEvent("O gato ficou colorido e zangado.", "neutral"); } }] },
  { minAge: 3, maxAge: 5, text: "Recusaste comer a sopa ao jantar.", options: [{ text: "Fazer birra", effect: () => { game.player.happiness = clamp(game.player.happiness - 3); addEvent("Fizeste birra e foste para a cama cedo.", "negative"); } }] },
  
  // ESCOLA (6-17)
  { minAge: 6, maxAge: 11, text: "Participaste numa peça de teatro na escola primária.", options: [{ text: "Divertir-te no palco", effect: () => { game.player.happiness = clamp(game.player.happiness + 8); addEvent("Apanhaste muita aplausos na peça escolar!", "positive"); } }] },
  { minAge: 8, maxAge: 14, text: "Esqueceste-te completamente do tpC de Estudo do Meio.", options: [{ text: "Inventar desculpa", effect: () => { game.player.behavior = clamp(game.player.behavior - 5); addEvent("O professor não acreditou na tua desculpa.", "negative"); } }] },
  { minAge: 10, maxAge: 17, text: "Convidaste a tua paixão da escola para ir ao cinema.", options: [{ text: "Convidar", effect: () => { if (Math.random() > 0.4) { game.player.happiness = clamp(game.player.happiness + 15); addEvent("Foi um encontro excelente!", "positive"); } else { game.player.happiness = clamp(game.player.happiness - 5); addEvent("A pessoa recusou educadamente.", "negative"); } } }] },
  { minAge: 12, maxAge: 17, text: "Descobriste uma nova paixão por instrumentos musicais.", options: [{ text: "Praticar guitarra", effect: () => { game.player.intelligence = clamp(game.player.intelligence + 2); addEvent("Aprendeste os primeiros acordes.", "positive"); } }] },

  // ADULTO & TRABALHO (18-65)
  { minAge: 18, maxAge: 65, text: "Fizeste horas extra no trabalho durante o fim de semana.", options: [{ text: "Trabalhar duro", effect: () => { game.player.bank += 150; addFinanceEvent("Ganhaste 150 € extra."); addEvent("O esforço compensou na carteira.", "positive"); } }] },
  { minAge: 18, maxAge: 65, text: "Encontraste uma nota de 50 € esquecida num casaco velho.", options: [{ text: "Guardar", effect: () => { game.player.bank += 50; addFinanceEvent("Achaste 50 € num casaco."); addEvent("Dinheiro grátis!", "positive"); } }] },
  { minAge: 22, maxAge: 60, text: "Um colega convidou-te para ires correr ao parque ao fim do dia.", options: [{ text: "Aceitar", effect: () => { game.player.health = clamp(game.player.health + 3); addEvent("Fizeste exercício e sentiste-te revitalizado/a.", "positive"); } }] },
  { minAge: 25, maxAge: 65, text: "Apareceu uma avaria inesperada em casa (canalização).", options: [{ text: "Reparar (120 €)", effect: () => { game.player.bank -= 120; addFinanceEvent("Pagaste 120 € de canalizador."); addEvent("Problema resolvido.", "neutral"); } }] },
  { minAge: 18, maxAge: 70, condition: () => game.vehicles.length > 0, text: "Furaste um pneu do carro a caminho do trabalho.", options: [{ text: "Mudar o pneu", effect: () => { game.player.happiness = clamp(game.player.happiness - 4); addEvent("Sujaste as mãos mas resolveste a situação.", "neutral"); } }] },

  // SÉNIOR (66+)
  { minAge: 66, maxAge: 110, text: "Foste convidado para contar histórias aos miúdos da biblioteca local.", options: [{ text: "Aceitar", effect: () => { game.player.happiness = clamp(game.player.happiness + 8); addEvent("Os miúdos adoraram as tuas histórias.", "positive"); } }] },
  { minAge: 66, maxAge: 110, text: "Sentiste umas tonturas matinais ao levantar da cama.", options: [{ text: "Descansar", effect: () => { game.player.health = clamp(game.player.health - 2); addEvent("Passou com um pouco de repouso.", "neutral"); } }] }
];

function triggerRandomEvent() {
  if (!game || !game.player.alive) return;
  const age = game.player.age;

  const validEvents = lifeEventsPool.filter(ev => {
    const ageOk = age >= ev.minAge && age <= ev.maxAge;
    const condOk = ev.condition ? ev.condition() : true;
    return ageOk && condOk;
  });

  if (validEvents.length === 0 || Math.random() > 0.4) return;
  const ev = randomFrom(validEvents);
  
  let modal = $("eventModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "eventModal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <h3>⚠️ Acontecimento</h3>
      <p>${escapeHTML(ev.text)}</p>
      <div class="modal-buttons" id="eventOptionsContainer"></div>
    </div>
  `;
  modal.classList.remove("hidden");

  const btnContainer = $("eventOptionsContainer");
  btnContainer.innerHTML = "";
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
   SISTEMA DE SAÚDE E DOENÇAS
========================================= */

function checkRandomIllness() {
  const player = game.player;
  if (player.illness || player.age < 12) return;
  
  // Chance de contrair doença baseada na idade e estilo de vida
  const chance = 0.08 + (player.age * 0.001) - ((player.health - 50) * 0.001);
  if (Math.random() < chance) {
    const ill = randomFrom(commonIllnesses);
    player.illness = { ...ill };
    addEvent(`⚠️ Foi-te diagnosticado/a: ${ill.name}.`, "negative");
  }
}

function openHealthMenu(action) {
  const container = $("healthActionContainer");
  const player = game.player;
  let html = "";

  if (action === "familyDoctor") {
    html = `
      <div class="panel" style="margin-top: 12px;">
        <h3>👨‍⚕️ Médico de Família</h3>
        <p class="muted">Consulta de rotina para despiste de problemas.</p>
        <button class="primary-btn full-width" onclick="executeHealthAction('checkup')">Fazer Check-up (40 €)</button>
      </div>
    `;
  } else if (action === "urgency") {
    html = `
      <div class="panel" style="margin-top: 12px;">
        <h3>🚑 Urgências Hospitalares</h3>
        <p class="muted">Tratamento imediato de emergência.</p>
        <button class="primary-btn full-width" onclick="executeHealthAction('urgency')">Atendimento de Urgência (100 €)</button>
      </div>
    `;
  } else if (action === "oncology") {
    html = `
      <div class="panel" style="margin-top: 12px;">
        <h3>🎗️ Oncologia</h3>
        <p class="muted">Rastreio preventivo ou tratamento oncológico.</p>
        <button class="primary-btn full-width" onclick="executeHealthAction('oncology')">Rastreio e Tratamento Especializado</button>
      </div>
    `;
  } else {
    html = `
      <div class="panel" style="margin-top: 12px;">
        <h3>🏥 Especialidade Médica</h3>
        <p class="muted">Consulta especializada para restabelecer o vigor físico.</p>
        <button class="primary-btn full-width" onclick="executeHealthAction('specialist')">Consultar Especialista (200 €)</button>
      </div>
    `;
  }

  container.innerHTML = html;
}

function executeHealthAction(type) {
  const player = game.player;
  if (type === "checkup") {
    if (player.bank < 40) { showToast("Sem dinheiro."); return; }
    player.bank -= 40;
    player.health = clamp(player.health + 2);
    if (player.illness) {
      showToast(`Detetado: ${player.illness.name}! Vai tratar.`);
    } else {
      showToast("Check-up limpo! Saúde estável.");
    }
  } else if (type === "urgency") {
    if (player.bank < 100) { showToast("Sem dinheiro."); return; }
    player.bank -= 100;
    player.health = clamp(player.health + 10);
    showToast("Recebeste tratamento de urgência.");
  } else if (type === "oncology" || type === "specialist") {
    if (player.illness) {
      const cost = player.illness.cost;
      if (player.bank < cost) {
        showToast(`Precisas de ${money(cost)} para o tratamento.`);
        return;
      }
      player.bank -= cost;
      addFinanceEvent(`Pagaste ${money(cost)} em tratamentos médicos.`);
      addEvent(`Curaste com sucesso a doença: ${player.illness.name}! 🎉`, "positive");
      player.illness = null;
      player.health = clamp(player.health + 15);
    } else {
      if (player.bank < 200) { showToast("Sem dinheiro."); return; }
      player.bank -= 200;
      player.health = clamp(player.health + 8);
      showToast("Consulta concluída com sucesso.");
    }
  }
  saveGame();
  renderGame();
}

/* =========================================
   ESCOLA, UNIVERSIDADE E OUTROS
========================================= */

const educationStages = [
  { name: "Creche", start: 0, end: 2, level: 0 },
  { name: "Jardim de infância", start: 3, end: 5, level: 0 },
  { name: "1.º Ciclo do Ensino Básico", start: 6, end: 9, level: 1 },
  { name: "2.º Ciclo do Ensino Básico", start: 10, end: 11, level: 1 },
  { name: "3.º Ciclo do Ensino Básico", start: 12, end: 14, level: 1 },
  { name: "Ensino Secundário", start: 15, end: 17, level: 2 }
];

const universityCourses = [
  { name: "Medicina", cost: 3500, duration: 6, salary: 42000 },
  { name: "Direito", cost: 2500, duration: 4, salary: 35000 },
  { name: "Engenharia", cost: 2800, duration: 5, salary: 32000 },
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
  player.education ??= "Sem escolaridade";
  player.educationLevel ??= 0;
  player.universityCourse ??= null;
  player.universityProgress ??= 0;
  player.studyDebt ??= 0;
}

function processSchoolYear() {
  const player = game.player;
  const stage = getCurrentEducationStage(player.age);
  if (!stage || player.age > 17) return;
  player.schoolGrade = clamp(Math.round(12 + randomNumber(-2, 3)), 5, 20);
  if (player.age === 14) { player.education = "Ensino básico"; player.educationLevel = 1; }
  if (player.age === 17) { player.education = "Ensino secundário"; player.educationLevel = 2; }
}

function studyHarder() {
  const player = game.player;
  player.intelligence = clamp(player.intelligence + 2);
  player.schoolGrade = clamp(player.schoolGrade + 1, 0, 20);
  addEvent("Estudaste com afinco. 📖");
  saveGame();
  renderGame();
}

function enrollUniversity(index, fundingType) {
  const player = game.player;
  const course = universityCourses[index];
  player.universityCourse = course.name;
  player. universityProgress = 0;
  player.universityFunding = fundingType;
  addEvent(`Entraste na Universidade para estudar ${course.name}! 🎓`);
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
      player.salary = course?.salary || 30000;
      player.universityCourse = null;
      addEvent(`🎓 Licenciatura concluída em ${course?.name}!`);
    }
  }
}

/* =========================================
   CARTA E VEÍCULOS
========================================= */

const DRIVING_LICENSE_COST = 650;
const availableVehicles = [
  { name: "Citadino Usado", price: 2500, annualCost: 450, happinessBonus: 3 },
  { name: "Utilitário Compacto", price: 8500, annualCost: 650, happinessBonus: 6 },
  { name: "SUV Familiar", price: 25000, annualCost: 1200, happinessBonus: 14 }
];

function takeDrivingLicense() {
  const player = game.player;
  if (player.bank < DRIVING_LICENSE_COST) { showToast("Sem saldo."); return; }
  player.bank -= DRIVING_LICENSE_COST;
  player.hasDrivingLicense = true;
  addEvent("🚗 Tiraste a Carta de Condução com sucesso!", "positive");
  saveGame();
  renderGame();
}

function buyVehicle(idx) {
  const car = availableVehicles[idx];
  const player = game.player;
  if (player.bank < car.price) { showToast("Sem saldo."); return; }
  player.bank -= car.price;
  game.vehicles.push({ id: createId(), name: car.name, value: car.price, annualCost: car.annualCost });
  addEvent(`🚘 Compraste um ${car.name}!`, "positive");
  saveGame();
  renderGame();
}

function renderVehiclesSection() {
  const container = $("vehiclesSectionContainer");
  if (!container) return;
  const player = game.player;
  let html = `<div class="panel"><h3>🚗 Condução e Veículos</h3>`;
  if (!player.hasDrivingLicense) {
    html += `<button class="primary-btn full-width" onclick="takeDrivingLicense()">Tirar Carta de Condução (${money(DRIVING_LICENSE_COST)})</button>`;
  } else {
    html += `<p class="muted">Carta de Condução ativa.</p>`;
    game.vehicles.forEach(v => { html += `<p>• ${escapeHTML(v.name)} (${money(v.value)})</p>`; });
    availableVehicles.forEach((c, idx) => {
      html += `<button class="secondary-btn full-width" style="margin-top:6px;" onclick="buyVehicle(${idx})">Comprar ${escapeHTML(c.name)} (${money(c.price)})</button>`;
    });
  }
  html += `</div>`;
  container.innerHTML = html;
}

/* =========================================
   FAMÍLIA E MORTE COM LÁPIDE
========================================= */

function createAutomaticFamily() {
  const mother = createFamilyMember({ name: generateName("Feminino"), surname: game.player.surname, relation: "Mãe", age: randomNumber(22, 40), sex: "Feminino" });
  const father = createFamilyMember({ name: generateName("Masculino"), surname: game.player.surname, relation: "Pai", age: randomNumber(24, 45), sex: "Masculino" });
  mother.partnerId = father.id; father.partnerId = mother.id;
  mother.relationshipStatus = "Casado/a"; father.relationshipStatus = "Casado/a";
  game.family.push(mother, father);
}

function triggerDeath() {
  const player = game.player;
  player.alive = false;
  saveGame();

  $("gameScreen").classList.add("hidden");
  $("deathScreen").classList.remove("hidden");

  $("tombstoneName").textContent = `${player.name} ${player.surname}`;
  $("tombstoneYears").textContent = `${game.year - player.age} - ${game.year} (${player.age} anos)`;
  $("tombstoneQuote").textContent = `"${randomFrom(tombstoneQuotes)}"`;

  const statsContainer = $("deathReportStats");
  statsContainer.innerHTML = `
    <div class="info-row"><span>Património Final</span><strong>${money(player.bank)}</strong></div>
    <div class="info-row"><span>Profissão</span><strong>${escapeHTML(player.job || "Nenhuma")}</strong></div>
    <div class="info-row"><span>Escolaridade</span><strong>${escapeHTML(player.education)}</strong></div>
  `;

  const childBtn = $("continueChildBtn");
  const children = game.family.filter(f => ["Filho/a", "Filho", "Filha"].includes(f.relation) && f.alive);
  if (children.length > 0) {
    childBtn.classList.remove("hidden");
    childBtn.onclick = () => continueAsChild(children[0]);
  } else {
    childBtn.classList.add("hidden");
  }

  $("newLifeBtn").onclick = () => {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  };
}

function continueAsChild(child) {
  const oldBank = game.player.bank;
  const surname = game.player.surname;

  game.player = {
    id: child.id,
    name: child.name,
    surname: surname,
    sex: child.sex,
    country: game.player.country,
    city: game.player.city,
    age: child.age,
    alive: true,
    health: 100,
    happiness: 90,
    education: "Sem escolaridade",
    educationLevel: 0,
    job: "",
    salary: 0,
    bank: Math.round(oldBank / 2),
    debt: 0,
    expenses: 0,
    hasDrivingLicense: false,
    illness: null,
    maxAge: randomNumber(75, 105)
  };

  game.family = game.family.filter(f => f.id !== child.id);
  $("deathScreen").classList.add("hidden");
  showGame();
  renderGame();
  showToast(`Agora jogas como ${child.name}!`);
}

function advanceYear() {
  if (!game || !game.player.alive) return;
  const player = game.player;

  player.age += 1;
  game.year += 1;

  processSchoolYear();
  processFurtherEducation();
  checkRandomIllness();

  if (player.illness) {
    player.health = clamp(player.health - player.illness.healthImpact);
  }

  // Morte natural aleatória baseada na idade máxima calculada
  if (player.age >= player.maxAge || player.health <= 0) {
    triggerDeath();
    return;
  }

  triggerRandomEvent();
  saveGame();
  renderGame();
}

/* =========================================
   INICIALIZAÇÃO E NAVEGAÇÃO
========================================= */

function startGame() {
  const name = $("playerName").value.trim();
  const surname = $("playerSurname").value.trim();
  if (!name || !surname) { showToast("Preenche os campos."); return; }

  const player = {
    id: createId(), name, surname,
    sex: $("playerSex").value,
    country: $("playerCountry").value.trim(),
    city: $("playerCity").value.trim(),
    age: 0, alive: true,
    health: 100, happiness: 80,
    education: "Sem escolaridade", educationLevel: 0,
    job: "", salary: 0, bank: 1000, debt: 0, expenses: 0,
    hasDrivingLicense: false, illness: null,
    maxAge: randomNumber(78, 108)
  };

  game = {
    player, family: [], socialPeople: [], events: [], financeHistory: [], businesses: [], vehicles: [],
    year: new Date().getFullYear(), started: true
  };

  initializeEducation(player);
  if (initialFamily.length === 0) createAutomaticFamily();
  else game.family = initialFamily.map(f => createFamilyMember(f));

  saveGame();
  showGame();
  renderGame();
}

function showGame() {
  $("setupScreen").classList.add("hidden");
  $("deathScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  showTab("homeTab");
}

function showSetup() {
  $("gameScreen").classList.add("hidden");
  $("setupScreen").classList.remove("hidden");
  updateContinuePanel();
}

function renderHome() {
  const player = game.player;
  $("homePlayerName").textContent = `${player.name} ${player.surname}`;
  $("homePlayerLocation").textContent = `${player.city}, ${player.country}`;
  $("homeAge").textContent = player.age;
  $("healthValue").textContent = `${Math.round(player.health)}%`;
  $("happinessValue").textContent = `${Math.round(player.happiness)}%`;
  $("healthBar").style.width = `${player.health}%`;
  $("happinessBar").style.width = `${player.happiness}%`;
  $("educationValue").textContent = player.education;
  $("jobValue").textContent = player.job || "Sem profissão";
  $("illnessValue").textContent = player.illness ? player.illness.name : "Nenhuma";

  const eventsContainer = $("recentEvents");
  eventsContainer.innerHTML = "";
  game.events.slice(0, 6).forEach(ev => {
    const el = document.createElement("div");
    el.className = `event-item ${ev.type || "neutral"}`;
    el.innerHTML = `${escapeHTML(ev.message)}<small>Idade: ${ev.age}</small>`;
    eventsContainer.appendChild(el);
  });
}

function renderPatrimony() {
  const player = game.player;
  $("totalWealth").textContent = money(player.bank);
  $("bankBalance").textContent = money(player.bank);
  $("annualSalary").textContent = money(player.salary);
  $("annualExpenses").textContent = money(player.expenses);
  $("debtValue").textContent = money(player.debt);
  renderVehiclesSection();
}

function renderCareer() {
  const player = game.player;
  $("careerJob").textContent = player.job || "Nenhuma";
  $("careerSalary").textContent = money(player.salary);
  $("careerEducation").textContent = player.education;

  const jobContainer = $("jobOptions");
  if (jobContainer) {
    jobContainer.innerHTML = "";
    if (player.age >= 16) {
      jobContainer.innerHTML = `
        <button class="secondary-btn" onclick="applyJob('Empregado/a', 12000)">Empregado/a · 12 000 €/ano</button>
        <button class="secondary-btn" onclick="applyJob('Assistente', 15000)">Assistente · 15 000 €/ano</button>
      `;
    } else {
      jobContainer.innerHTML = `<p class="muted">Procura emprego a partir dos 16 anos.</p>`;
    }
  }
}

function applyJob(name, salary) {
  game.player.job = name;
  game.player.salary = salary;
  addEvent(`Começaste a trabalhar como ${name}!`);
  saveGame();
  renderGame();
}

function renderPeople() {
  const container = $("peopleList");
  if (!container) return;
  container.innerHTML = "";
  game.family.forEach(f => {
    container.innerHTML += `<div class="person-card"><strong>${escapeHTML(f.name)}</strong> <small>${f.relation} · ${f.age} anos</small></div>`;
  });
}

function renderGame() {
  if (!game) return;
  renderHome();
  renderPatrimony();
  renderCareer();
  renderPeople();
}

function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.add("hidden"));
  const target = $(tabId);
  if (target) target.classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
}

function updateSetupFamilyUI() {
  const container = $("setupFamilyList");
  if (!container) return;
  container.innerHTML = "";
  initialFamily.forEach((f, idx) => {
    container.innerHTML += `<div class="person-card"><strong>${escapeHTML(f.name)}</strong> <small>${f.relation}</small> <button type="button" class="small-btn danger-btn" onclick="initialFamily.splice(${idx},1);updateSetupFamilyUI()">X</button></div>`;
  });
}

function boot() {
  $("addFamilyMemberBtn")?.addEventListener("click", () => {
    const name = $("famName").value.trim();
    if (!name) return;
    initialFamily.push({
      name, surname: $("playerSurname").value.trim() || "Silva",
      relation: $("famRelation").value, age: Number($("famAge").value) || 30,
      relationshipStatus: $("famMaritalStatus").value
    });
    $("famName").value = "";
    updateSetupFamilyUI();
  });

  $("startForm").addEventListener("submit", e => { e.preventDefault(); startGame(); });
  $("continueGameBtn")?.addEventListener("click", () => {
    const saved = loadGame();
    if (saved) { game = saved; showGame(); renderGame(); }
  });
  $("deleteSaveBtn")?.addEventListener("click", deleteSave);
  $("advanceYearBtn").addEventListener("click", advanceYear);

  $("bottomNav").addEventListener("click", e => {
    const btn = e.target.closest(".nav-btn");
    if (btn && btn.dataset.tab) showTab(btn.dataset.tab);
  });

  updateContinuePanel();
  updateSetupFamilyUI();
}

document.addEventListener("DOMContentLoaded", boot);
