"use strict";

/* =========================================
   STARLIFE - SISTEMA PRINCIPAL (PASSO 1: CARTA E VEÍCULOS)
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

    // Garantir compatibilidade com saves anteriores
    loaded.player.hasDrivingLicense ??= false;
    loaded.vehicles ??= [];

    return loaded;
  } catch (error) {
    console.error("Erro ao carregar:", error);
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
    id: data.id || createId(),
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
    partnerId: data.partnerId || null,
    relationshipStatus: data.relationshipStatus || "Solteiro/a",
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
    interests: data.interests || [randomFrom(interests), randomFrom(interests)],
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

/* =========================================
   CARTA DE CONDUÇÃO E VEÍCULOS
========================================= */

const DRIVING_LICENSE_COST = 650;

const availableVehicles = [
  { name: "Citadino Usado (2006)", price: 2500, annualCost: 450, happinessBonus: 3 },
  { name: "Utilitário Compacto (2015)", price: 8500, annualCost: 650, happinessBonus: 6 },
  { name: "Carrinha Familiar (2019)", price: 18000, annualCost: 950, happinessBonus: 10 },
  { name: "SUV Executivo (2023)", price: 36000, annualCost: 1600, happinessBonus: 16 },
  { name: "Desportivo de Luxo", price: 85000, annualCost: 3400, happinessBonus: 25 }
];

function takeDrivingLicense() {
  const player = game.player;

  if (player.age < 18) {
    showToast("Precisas de ter pelo menos 18 anos.");
    return;
  }

  if (player.hasDrivingLicense) {
    showToast("Já tens carta de condução!");
    return;
  }

  if (player.bank < DRIVING_LICENSE_COST) {
    showToast(`Precisas de ${money(DRIVING_LICENSE_COST)} na conta bancária.`);
    return;
  }

  player.bank -= DRIVING_LICENSE_COST;
  addFinanceEvent(`Pagaste ${money(DRIVING_LICENSE_COST)} pela inscrição e exames da carta de condução.`);

  // Probabilidade baseada na inteligência (mínimo 55%, máximo 95%)
  const passChance = clamp(45 + (player.intelligence * 0.5), 55, 95);

  if (Math.random() * 100 <= passChance) {
    player.hasDrivingLicense = true;
    player.happiness = clamp(player.happiness + 10);
    addEvent("🚗 Parabéns! Passaste no exame e tiraste a Carta de Condução!", "positive");
    showToast("Carta de condução obtida!");
  } else {
    player.happiness = clamp(player.happiness - 5);
    addEvent("Reprovaste no exame prático de condução. Podes tentar novamente.", "negative");
    showToast("Reprovaste no exame de condução.");
  }

  saveGame();
  renderGame();
}

function buyVehicle(index) {
  const player = game.player;
  const car = availableVehicles[index];

  if (!player.hasDrivingLicense) {
    showToast("Precisas de tirar a carta de condução primeiro.");
    return;
  }

  if (player.bank < car.price) {
    showToast("Não tens saldo suficiente para comprar este veículo.");
    return;
  }

  player.bank -= car.price;
  player.happiness = clamp(player.happiness + car.happinessBonus);

  game.vehicles.push({
    id: createId(),
    name: car.name,
    value: car.price,
    annualCost: car.annualCost,
    ageYears: 0
  });

  addFinanceEvent(`Compraste um ${car.name} por ${money(car.price)}.`);
  addEvent(`🚘 Compraste um ${car.name}!`, "positive");
  showToast(`Compraste ${car.name}!`);

  saveGame();
  renderGame();
}

function sellVehicle(id) {
  const idx = game.vehicles.findIndex(v => v.id === id);
  if (idx === -1) return;

  const car = game.vehicles[idx];
  game.player.bank += car.value;
  game.vehicles.splice(idx, 1);

  addFinanceEvent(`Vendeste o teu ${car.name} por ${money(car.value)}.`);
  addEvent(`Vendeste o teu ${car.name} por ${money(car.value)}.`, "neutral");
  showToast("Veículo vendido!");

  saveGame();
  renderGame();
}

function processVehiclesYear() {
  if (!game || !game.vehicles.length) return;

  game.vehicles.forEach(car => {
    car.ageYears += 1;
    // Desvalorização anual de 8% (mínimo 250 €)
    car.value = Math.max(250, Math.round(car.value * 0.92));
  });
}

function renderVehiclesSection() {
  const container = $("vehiclesSectionContainer");
  if (!container) return;

  const player = game.player;

  let html = `
    <div class="panel">
      <h3>🚗 Carta de Condução e Veículos</h3>
      <div class="info-row">
        <span>Carta de Condução</span>
        <strong>${player.hasDrivingLicense ? "✅ Obtida" : "❌ Não tem"}</strong>
      </div>
  `;

  if (!player.hasDrivingLicense) {
    html += `
      <p class="muted" style="margin-top: 8px;">A partir dos 18 anos podes tirar a carta de condução (${money(DRIVING_LICENSE_COST)}).</p>
      <button id="takeLicenseBtn" class="primary-btn full-width" style="margin-top: 8px;" ${player.age < 18 ? "disabled" : ""}>
        Tirar Carta de Condução (${money(DRIVING_LICENSE_COST)})
      </button>
    `;
  } else {
    html += `
      <h4 style="margin-top: 14px; margin-bottom: 6px;">A Tua Garagem</h4>
      ${game.vehicles.length === 0 ? `<p class="muted">Ainda não tens nenhum veículo.</p>` : `
        <div class="people-list">
          ${game.vehicles.map(v => `
            <div class="person-card">
              <div class="person-info">
                <strong>${escapeHTML(v.name)}</strong>
                <small>Valor atual: ${money(v.value)} · Seguro/Manut.: ${money(v.annualCost)}/ano</small>
              </div>
              <button class="small-btn" data-sell-car="${v.id}">Vender</button>
            </div>
          `).join("")}
        </div>
      `}

      <h4 style="margin-top: 16px; margin-bottom: 6px;">Stand Automóvel</h4>
      <div class="button-list">
        ${availableVehicles.map((car, idx) => `
          <button class="secondary-btn" data-buy-car="${idx}" ${player.bank < car.price ? "disabled" : ""}>
            ${escapeHTML(car.name)} · ${money(car.price)} (Manut. ${money(car.annualCost)}/ano)
          </button>
        `).join("")}
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;

  if ($("takeLicenseBtn")) {
    $("takeLicenseBtn").onclick = takeDrivingLicense;
  }

  container.querySelectorAll("[data-buy-car]").forEach(btn => {
    btn.onclick = () => buyVehicle(Number(btn.dataset.buyCar));
  });

  container.querySelectorAll("[data-sell-car]").forEach(btn => {
    btn.onclick = () => sellVehicle(btn.dataset.sellCar);
  });
}

/* =========================================
   EVENTOS ALEATÓRIOS POR IDADE E BENS
========================================= */

const lifeEventsPool = [
  // --- INFÂNCIA (1 a 5 anos) ---
  {
    minAge: 1, maxAge: 3,
    text: "Encontraste uma caixa cheia de lápis de cera na sala e a parede branca parece muito convidativa.",
    options: [
      { text: "Desenhar um mural", effect: () => { game.player.happiness = clamp(game.player.happiness + 8); addEvent("Fizeste uma obra de arte na parede. Os teus pais não acharam piada!", "neutral"); } },
      { text: "Brincar com os blocos", effect: () => { game.player.intelligence = clamp(game.player.intelligence + 2); addEvent("Construíste uma torre gigante com blocos.", "positive"); } }
    ]
  },
  {
    minAge: 2, maxAge: 5,
    text: "Um cão vadio muito amigável aproximou-se de ti no parque infantil.",
    options: [
      { text: "Fazer festas", effect: () => { game.player.happiness = clamp(game.player.happiness + 10); addEvent("Fizeste um amigo peludo no parque!", "positive"); } },
      { text: "Afastar-te", effect: () => { addEvent("Mantiveste distância por precaução.", "neutral"); } }
    ]
  },
  {
    minAge: 3, maxAge: 5,
    text: "No jardim de infância, outra criança tirou-te o teu brinquedo favorito das mãos.",
    options: [
      { text: "Partilhar o brinquedo", effect: () => { game.player.happiness = clamp(game.player.happiness + 5); addEvent("Partilhaste o brinquedo e fizeram amizade!", "positive"); } },
      { text: "Puxar de volta e chorar", effect: () => { game.player.happiness = clamp(game.player.happiness - 5); addEvent("Fizeste uma birra no jardim de infância.", "negative"); } }
    ]
  },

  // --- ESCOLA BÁSICA E SECUNDÁRIO (6 a 17 anos) ---
  {
    minAge: 6, maxAge: 12,
    text: "A turma vai fazer uma visita de estudo ao Museu de Ciência.",
    options: [
      { text: "Prestar muita atenção", effect: () => { game.player.intelligence = clamp(game.player.intelligence + 3); game.player.schoolPerformance = clamp(game.player.schoolPerformance + 4); addEvent("Aprendeste imenso na visita de estudo!", "positive"); } },
      { text: "Conversar com os amigos", effect: () => { game.player.happiness = clamp(game.player.happiness + 6); addEvent("Divertiste-te muito no autocarro com os amigos.", "positive"); } }
    ]
  },
  {
    minAge: 8, maxAge: 15,
    text: "Encontraste uma nota de 20 € caída no chão do corredor da escola.",
    options: [
      { text: "Entregar na secretaria", effect: () => { game.player.behavior = clamp(game.player.behavior + 10); addEvent("A direção elogiou a tua honestidade!", "positive"); } },
      { text: "Guardar no bolso", effect: () => { game.player.bank += 20; addFinanceEvent("Encontraste 20 € na escola."); addEvent("Ficaste com os 20 € para ti.", "neutral"); } }
    ]
  },
  {
    minAge: 10, maxAge: 17,
    text: "Um colega mais velho está a intimidar um aluno mais novo no recreio.",
    options: [
      { text: "Defender o mais novo", effect: () => { if (Math.random() > 0.4) { game.player.happiness = clamp(game.player.happiness + 8); addEvent("Enfrentaste o valentão e ganhaste o respeito da escola!", "positive"); } else { game.player.health = clamp(game.player.health - 10); addEvent("Levaste um empurrão feio ao tentar ajudar.", "negative"); } } },
      { text: "Chamar um contínuo", effect: () => { game.player.behavior = clamp(game.player.behavior + 5); addEvent("Chamaste um adulto que resolveu a situação.", "positive"); } },
      { text: "Ignorar e seguir", effect: () => { game.player.happiness = clamp(game.player.happiness - 3); addEvent("Preferiste não te meter em problemas.", "neutral"); } }
    ]
  },
  {
    minAge: 12, maxAge: 17,
    text: "Vais ter um teste surpresa de Matemática e não estudaste.",
    options: [
      { text: "Tentar copiar pelo colega", effect: () => { if (Math.random() > 0.45) { game.player.schoolGrade = clamp(game.player.schoolGrade + 2, 0, 20); addEvent("Conseguiste safar-te no teste!", "positive"); } else { game.player.behavior = clamp(game.player.behavior - 15); game.player.schoolGrade = clamp(game.player.schoolGrade - 2, 0, 20); addEvent("O professor apanhou-te a copiar e anulou o teste!", "negative"); } } },
      { text: "Fazer o melhor que sabes", effect: () => { game.player.schoolPerformance = clamp(game.player.schoolPerformance - 2); addEvent("Fizeste o teste com honestidade.", "neutral"); } }
    ]
  },
  {
    minAge: 14, maxAge: 17,
    text: "Os teus amigos convidaram-te para faltar às aulas da tarde para ir ao centro comercial.",
    options: [
      { text: "Ir com eles", effect: () => { game.player.absences += 2; game.player.behavior = clamp(game.player.behavior - 8); game.player.happiness = clamp(game.player.happiness + 7); addEvent("Faltaste às aulas e foste passear com os amigos.", "neutral"); } },
      { text: "Ficar nas aulas", effect: () => { game.player.schoolPerformance = clamp(game.player.schoolPerformance + 3); addEvent("Foste responsável e assististe às aulas todas.", "positive"); } }
    ]
  },

  // --- JUVENTUDE E VIDA ADULTA (18 a 65 anos) ---
  {
    minAge: 18, maxAge: 35,
    text: "Um amigo propôs-te fazer uma viagem de mochila às costas pela Europa durante umas semanas.",
    condition: () => game.player.bank >= 800,
    options: [
      { text: "Aceitar (Custa 800 €)", effect: () => { game.player.bank -= 800; game.player.happiness = clamp(game.player.happiness + 18); addFinanceEvent("Gastaste 800 € numa viagem pela Europa."); addEvent("Fizeste uma viagem inesquecível pela Europa!", "positive"); } },
      { text: "Poupar o dinheiro", effect: () => { addEvent("Decidiste guardar as tuas poupanças.", "neutral"); } }
    ]
  },
  {
    minAge: 18, maxAge: 65,
    text: "Encontraste uma carteira perdida no passeio com documentos e algum dinheiro.",
    options: [
      { text: "Devolver ao dono", effect: () => { game.player.happiness = clamp(game.player.happiness + 10); game.player.bank += 50; addFinanceEvent("Recebeste 50 € de gratificação por devolveres uma carteira."); addEvent("O dono ficou imensamente grato e deu-te 50 €!", "positive"); } },
      { text: "Ficar com o dinheiro", effect: () => { game.player.bank += 120; game.player.happiness = clamp(game.player.happiness - 4); addFinanceEvent("Ficaste com 120 € de uma carteira perdida."); addEvent("Ficaste com o dinheiro da carteira.", "negative"); } }
    ]
  },
  {
    minAge: 20, maxAge: 65,
    text: "Sentiste uma dor forte nas costas depois de levantar uma caixa pesada em casa.",
    options: [
      { text: "Ir ao médico / fisioterapia (150 €)", effect: () => { if (game.player.bank >= 150) { game.player.bank -= 150; game.player.health = clamp(game.player.health + 5); addFinanceEvent("Gastaste 150 € em fisioterapia."); addEvent("Trataste das costas a tempo.", "positive"); } else { game.player.health = clamp(game.player.health - 8); addEvent("Sem dinheiro para o médico, tiveste de aguentar as dores.", "negative"); } } },
      { text: "Descansar em casa", effect: () => { game.player.health = clamp(game.player.health - 5); addEvent("Ficaste com dores nas costas durante semanas.", "negative"); } }
    ]
  },
  {
    minAge: 18, maxAge: 65,
    text: "Recebeste um e-mail suspeito a dizer que ganhaste um prémio milionário mas precisas de pagar uma taxa.",
    options: [
      { text: "Apagar (É burla)", effect: () => { game.player.intelligence = clamp(game.player.intelligence + 1); addEvent("Identificaste facilmente a tentativa de burla.", "positive"); } },
      { text: "Transferir 300 €", effect: () => { const loss = Math.min(game.player.bank, 300); game.player.bank -= loss; game.player.happiness = clamp(game.player.happiness - 12); addFinanceEvent(`Perdeste ${money(loss)} numa burla online.`); addEvent("Caíste numa burla e perdeste dinheiro!", "negative"); } }
    ]
  },

  // --- CONDICIONADOS A VEÍCULOS (CARROS) ---
  {
    minAge: 18, maxAge: 90,
    condition: () => game.vehicles.length > 0,
    text: "Alguém raspou no para-choques do teu carro num parque de estacionamento e fugiu sem deixar contacto.",
    options: [
      { text: "Acionar seguro / polícia", effect: () => { game.player.bank += 250; addFinanceEvent("Recebeste 250 € de indemnização do seguro automóvel."); addEvent("O seguro cobriu a reparação do carro!", "positive"); } },
      { text: "Deixar andar", effect: () => { game.player.happiness = clamp(game.player.happiness - 3); addEvent("Ficaste aborrecido com o risco no carro.", "negative"); } }
    ]
  },
  {
    minAge: 18, maxAge: 90,
    condition: () => game.vehicles.length > 0,
    text: "Foste mandado parar numa operação stop de rotina da polícia enquanto conduzia.",
    options: [
      { text: "Mostrar documentos com calma", effect: () => { addEvent("Tinhas tudo em ordem e seguiste viagem sem problemas.", "positive"); } },
      { text: "Tentar acelerar para evitar", effect: () => { const fine = 500; game.player.bank -= fine; addFinanceEvent(`Pagaste ${money(fine)} de multa por fuga à polícia.`); addEvent("Foste intercetado e levaste uma multa pesada de 500 €!", "negative"); } }
    ]
  },

  // --- CONDICIONADOS A EMPREGO ---
  {
    minAge: 16, maxAge: 70,
    condition: () => Boolean(game.player.job),
    text: "O teu chefe pediu-te para fazeres horas extra esta semana para cobrir um colega doente.",
    options: [
      { text: "Aceitar o esforço extra", effect: () => { const bonus = Math.round(game.player.salary * 0.08); game.player.bank += bonus; game.player.happiness = clamp(game.player.happiness - 4); addFinanceEvent(`Recebeste ${money(bonus)} de bónus por horas extra.`); addEvent(`Trabalhaste duro e ganhaste um bónus de ${money(bonus)}!`, "positive"); } },
      { text: "Recusar educadamente", effect: () => { game.player.happiness = clamp(game.player.happiness + 3); addEvent("Valorizaste o teu tempo livre.", "neutral"); } }
    ]
  },
  {
    minAge: 18, maxAge: 70,
    condition: () => Boolean(game.player.job),
    text: "Houve uma reestruturação na empresa onde trabalhas e o teu desempenho foi avaliado.",
    options: [
      { text: "Pedir aumento salarial", effect: () => { if (Math.random() > 0.45) { const raise = Math.round(game.player.salary * 0.1); game.player.salary += raise; addEvent(`Conseguiste um aumento salarial de ${money(raise)}/ano!`, "positive"); } else { addEvent("O teu pedido de aumento foi recusado desta vez.", "neutral"); } } },
      { text: "Manter perfil discreto", effect: () => { addEvent("Mantiveste o teu posto de trabalho seguro.", "neutral"); } }
    ]
  },

  // --- CONDICIONADOS A NEGÓCIOS ---
  {
    minAge: 18, maxAge: 85,
    condition: () => game.businesses.length > 0,
    text: "Um fornecedor propôs-te um novo contrato que pode aumentar a margem de lucro da tua empresa.",
    options: [
      { text: "Assinar contrato", effect: () => { const b = randomFrom(game.businesses); const boost = Math.round(b.yearlyProfit * 0.25); b.yearlyProfit += boost; addEvent(`O negócio "${b.name}" aumentou o lucro anual em ${money(boost)}!`, "positive"); } },
      { text: "Manter fornecedor atual", effect: () => { addEvent("Optaste pela estabilidade no teu negócio.", "neutral"); } }
    ]
  },

  // --- TERCEIRA IDADE (66+ anos) ---
  {
    minAge: 66, maxAge: 110,
    text: "Os vizinhos organizaram um torneio de sueca e dominó no centro comunitário do bairro.",
    options: [
      { text: "Participar e conviver", effect: () => { game.player.happiness = clamp(game.player.happiness + 10); game.player.health = clamp(game.player.health + 2); addEvent("Passaste uma tarde excelente a jogar e a rir com os vizinhos!", "positive"); } },
      { text: "Ficar a ler em casa", effect: () => { game.player.intelligence = clamp(game.player.intelligence + 1); addEvent("Tiveste uma tarde sossegada de leitura.", "neutral"); } }
    ]
  },
  {
    minAge: 66, maxAge: 110,
    text: "O médico recomendou-te fazer caminhadas diárias de 30 minutos para manter o coração forte.",
    options: [
      { text: "Seguir o conselho", effect: () => { game.player.health = clamp(game.player.health + 6); addEvent("As caminhadas diárias melhoraram a tua vitalidade!", "positive"); } },
      { text: "Ignorar", effect: () => { game.player.health = clamp(game.player.health - 4); addEvent("Tens estado demasiado sedentário/a.", "negative"); } }
    ]
  }
];

function triggerRandomEvent() {
  if (!game || !game.player.alive) return;
  const age = game.player.age;

  const validEvents = lifeEventsPool.filter(ev => {
    const ageOk = age >= ev.minAge && age <= ev.maxAge;
    const condOk = ev.condition ? ev.condition() : true;
    return ageOk && condOk;
  });

  if (validEvents.length === 0 || Math.random() > 0.45) return;

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
   SISTEMA DE EDUCAÇÃO E UNIVERSIDADE
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
  player.universityFunding ??= null;
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
  player.schoolGrade = clamp(Math.round((player.intelligence * 0.12) + randomNumber(4, 10)), 5, 20);

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

  if (Math.random() < 0.08) player.absences += randomNumber(1, 3);
  if (player.absences > 10) player.schoolGrade = clamp(player.schoolGrade - 3, 0, 20);

  if (player.schoolGrade >= 10) {
    player.schoolPerformance = clamp(player.schoolPerformance + randomNumber(1, 4));
    addEducationHistory(`Aprovado/a em ${stage.name} com média ${player.schoolGrade}/20.`);

    if (age === 9) addEvent("Concluíste com sucesso o 1.º Ciclo! 📚");
    if (age === 11) addEvent("Concluíste o 2.º Ciclo do Ensino Básico!");
    if (age === 14) {
      player.education = "Ensino básico";
      player.educationLevel = Math.max(player.educationLevel, 1);
      addEvent("Concluíste o Ensino Básico! 🎓");
    }
    if (age === 17) {
      player.education = "Ensino secundário";
      player.educationLevel = Math.max(player.educationLevel, 2);
      player.schoolStatus = "Concluído";
      addEvent("🎓 Concluíste o Ensino Secundário com sucesso!");
    }
  } else {
    player.schoolStatus = "Reprovado/a";
    player.happiness = clamp(player.happiness - 8);
    addEvent(`Chumbaste de ano no ${stage.name} com média de ${player.schoolGrade}/20!`, "negative");
    addEducationHistory(`Reprovaste no ${stage.name}. Média: ${player.schoolGrade}/20.`);
  }

  player.absences = Math.max(0, player.absences - randomNumber(2, 5));
}

function studyHarder() {
  const player = game.player;
  if (player.age < 6 || player.age > 18) {
    showToast("Não estás em idade escolar.");
    return;
  }
  player.intelligence = clamp(player.intelligence + randomNumber(1, 3));
  player.schoolPerformance = clamp(player.schoolPerformance + randomNumber(6, 12));
  player.schoolGrade = clamp(player.schoolGrade + randomNumber(1, 3), 0, 20);
  player.happiness = clamp(player.happiness - 2);
  addEvent("Estudaste afincadamente. As notas melhoraram! 📖");
  saveGame();
  renderGame();
  showToast("Estudaste com sucesso!");
}

function improveBehavior() {
  const player = game.player;
  player.behavior = clamp(player.behavior + randomNumber(8, 15));
  player.absences = Math.max(0, player.absences - randomNumber(2, 4));
  addEvent("Portaste-te exemplarmente nas aulas e reduziste faltas.");
  saveGame();
  renderGame();
}

function abandonEducation() {
  const player = game.player;
  if (player.age < 15 || !confirm("Abandonar a escola vai arruinar o teu futuro. Tens a certeza?")) return;
  player.schoolStatus = "Abandonou os estudos";
  player.education = player.educationLevel >= 1 ? "Ensino básico incompleto" : "Sem escolaridade";
  addEvent("Abandonaste a escola.", "negative");
  saveGame();
  renderGame();
}

function returnToSchool() {
  const player = game.player;
  player.schoolStatus = "A frequentar";
  player.currentSchoolStage = player.age <= 17 ? "Ensino Secundário" : "Ensino Recorrente";
  addEvent("Regressaste à escola! 📚");
  saveGame();
  renderGame();
}

function enrollUniversity(index, fundingType) {
  const player = game.player;
  const course = universityCourses[index];

  if (player.universityCourse) {
    showToast("Já estás a frequentar um curso superior.");
    return;
  }

  let funding = fundingType;

  if (funding === "savings") {
    if (player.bank < course.cost) {
      showToast("Não tens saldo suficiente na conta bancária.");
      return;
    }
    player.bank -= course.cost;
    addFinanceEvent(`Pagaste ${money(course.cost)} de propinas com as tuas poupanças.`);
  } 
  else if (funding === "parents") {
    const parents = game.family.filter(f => ["Mãe", "Pai"].includes(f.relation) && f.alive);
    if (parents.length === 0) {
      showToast("Não tens pais vivos para te ajudarem a pagar os estudos.");
      return;
    }
    const accepted = Math.random() < 0.75;
    if (accepted) {
      addEvent(`Os teus pais concordaram em pagar as propinas da tua universidade em ${course.name}! ❤️`, "positive");
    } else {
      addEvent(`Pediste aos teus pais para pagarem a faculdade, mas recusaram por falta de posses.`, "negative");
      return;
    }
  } 
  else if (funding === "scholarship") {
    const successChance = (player.intelligence + (player.schoolGrade * 5)) / 2;
    if (Math.random() * 100 <= successChance) {
      addEvent(`Parabéns! Obtiveste uma Bolsa de Estudo integral para ${course.name}. 🎓`, "positive");
    } else {
      addEvent(`A tua candidatura à bolsa de estudos foi rejeitada.`, "negative");
      return;
    }
  } 
  else if (funding === "loan") {
    player.studyDebt += course.cost;
    addFinanceEvent(`Contraíste um Crédito Estudantil de ${money(course.cost)}.`);
    addEvent(`Contraíste um empréstimo bancário para financiar os estudos.`, "neutral");
  }

  player.universityCourse = course.name;
  player.universityProgress = 0;
  player.universityFunding = funding;
  player.studying = true;

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
      player.salary = Math.max(player.salary, course?.salary || 22000);
      player.universityCourse = null;
      player.universityProgress = 0;
      player.universityFunding = null;
      addEvent(`🎓 Licenciatura concluída com sucesso em ${course?.name}!`);
    } else if (course && player.universityFunding === "savings") {
      player.bank -= course.cost;
      addFinanceEvent(`Pagaste ${money(course.cost)} de propinas anuais.`);
      if (player.bank < 0) {
        player.studyDebt += Math.abs(player.bank);
        player.bank = 0;
      }
    } else if (course && player.universityFunding === "loan") {
      player.studyDebt += course.cost;
      addFinanceEvent(`Acumulaste mais ${money(course.cost)} de dívida no crédito estudantil.`);
    }
  }
}

/* =========================================
   FAMÍLIA E RELAÇÕES
========================================= */

function createAutomaticFamily() {
  const mother = createFamilyMember({
    name: generateName("Feminino"), surname: game.player.surname, relation: "Mãe", age: randomNumber(18, 45), sex: "Feminino"
  });
  const father = createFamilyMember({
    name: generateName("Masculino"), surname: game.player.surname, relation: "Pai", age: randomNumber(18, 50), sex: "Masculino"
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

function getSpouseName(person) {
  if (!person.partnerId) return "";
  const spouse = game.family.find(f => f.id === person.partnerId);
  return spouse ? getPersonFullName(spouse) : "";
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
    const spouseName = getSpouseName(person);
    const maritalLabel = person.relationshipStatus === "Casado/a" && spouseName 
      ? `Casado/a com ${spouseName}` 
      : person.relationshipStatus;

    const card = document.createElement("div");
    card.className = "person-card";
    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>${escapeHTML(getRelationLabel(person))} · ${person.age} anos</small>
        <small>Estado: ${escapeHTML(maritalLabel)}</small>
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
    const spouseName = getSpouseName(person);
    const card = document.createElement("div");
    card.className = "person-card";
    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(getPersonFullName(person))}</strong>
        <small>${escapeHTML(person.relation)} · ${person.age} anos ${spouseName ? `(Casado/a com ${escapeHTML(spouseName)})` : ""}</small>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderFamilyTree() {
  const container = $("familyTree");
  if (!container) return;
  container.innerHTML = "<p class='muted'>Árvore genealógica ativa.</p>";
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
    hasDrivingLicense: false,
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
    vehicles: [],
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

function calculateTaxes(grossSalary) {
  if (grossSalary <= 12000) return grossSalary * 0.11;
  if (grossSalary <= 25000) return grossSalary * 0.20;
  if (grossSalary <= 50000) return grossSalary * 0.32;
  return grossSalary * 0.45;
}

function advanceYear() {
  if (!game || !game.player.alive) return;
  const player = game.player;

  player.age += 1;
  game.year += 1;

  processFamilyLife();
  processSocialLife();
  processSchoolYear();
  processFurtherEducation();
  processVehiclesYear();

  let grossIncome = player.salary || 0;
  game.businesses.forEach(b => grossIncome += b.yearlyProfit || 0);

  const vehicleCosts = game.vehicles.reduce((acc, v) => acc + (v.annualCost || 0), 0);

  if (player.age >= 18) {
    const taxes = calculateTaxes(grossIncome);
    const netIncome = grossIncome - taxes;
    const livingCosts = 4800 + (player.age * 95); 
    player.expenses = livingCosts + taxes + vehicleCosts;

    const netBalance = netIncome - livingCosts - vehicleCosts;
    player.bank += netBalance;

    if (taxes > 0) addFinanceEvent(`Pagaste ${money(taxes)} em impostos.`);
    if (vehicleCosts > 0) addFinanceEvent(`Pagaste ${money(vehicleCosts)} em seguros e manutenção de veículos.`);
    addFinanceEvent(`Recebeste ${money(netIncome)} líquidos e gastaste ${money(livingCosts)} em subsistência.`);

    if (player.bank < 0) {
      const negativeAmount = Math.abs(player.bank);
      player.debt += negativeAmount + (negativeAmount * 0.15);
      player.bank = 0;
      addEvent("Estás com o saldo negativo! Dívida acumulada com juros.", "negative");
    }
  } else if (vehicleCosts > 0) {
    player.bank -= vehicleCosts;
    player.expenses = vehicleCosts;
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
  if (!container) return;
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
  const businessValue = game.businesses.reduce((acc, b) => acc + b.investment, 0);
  const vehiclesValue = game.vehicles.reduce((acc, v) => acc + v.value, 0);
  const totalW = player.bank + businessValue + vehiclesValue - player.debt - player.studyDebt;

  $("totalWealth").textContent = money(totalW);
  $("bankBalance").textContent = money(player.bank);
  $("annualSalary").textContent = money(player.salary);
  $("annualExpenses").textContent = money(player.expenses);
  $("debtValue").textContent = money(player.debt + player.studyDebt);

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
    jobs.forEach((job, index) => {
      const btn = document.createElement("button");
      btn.className = "secondary-btn";
      btn.textContent = `${job.name} · ${money(job.salary)}/ano`;
      btn.disabled = player.age < job.minimumAge || player.educationLevel < job.education;
      btn.onclick = () => applyForJob(index);
      jobContainer.appendChild(btn);
    });
  }

  renderSchoolAndUniversitySubmenu();
}

function renderSchoolAndUniversitySubmenu() {
  const player = game.player;
  const container = $("schoolSectionContainer");
  if (!container) return;

  const stage = getCurrentEducationStage(player.age);

  let html = `
    <div class="panel" style="margin-top: 16px;">
      <h3>📚 Estatísticas Escolares</h3>
      <div class="info-row"><span>Etapa atual</span><strong>${escapeHTML(stage?.name || player.education)}</strong></div>
      <div class="info-row"><span>Estado escolar</span><strong>${escapeHTML(player.schoolStatus)}</strong></div>
      <div class="info-row"><span>Média</span><strong>${player.schoolGrade}/20</strong></div>
      <div class="info-row"><span>Inteligência</span><strong>${player.intelligence}%</strong></div>
    </div>
  `;

  if (player.age >= 6 && player.age <= 18 && player.schoolStatus !== "Abandonou os estudos") {
    html += `
      <div class="panel">
        <h3>Atividades de Estudante</h3>
        <button class="primary-btn full-width" id="studyBtn">📖 Estudar Mais</button>
        <button class="secondary-btn full-width" id="behaviorBtn">⭐ Melhorar Comportamento</button>
        ${player.age >= 15 ? `<button class="danger-btn full-width" id="abandonBtn">Abandonar Escola</button>` : ""}
      </div>
    `;
  }

  if (player.schoolStatus === "Abandonou os estudos" && player.age >= 16) {
    html += `
      <div class="panel">
        <button class="primary-btn full-width" id="returnSchoolBtn">Voltar a Estudar</button>
      </div>
    `;
  }

  if (player.age >= 18 && player.educationLevel >= 2) {
    html += `
      <div class="panel">
        <h3>🏛️ Ensino Superior (Universidade)</h3>
        ${player.universityCourse ? `
          <p>Curso atual: <strong>${player.universityCourse}</strong> (${player.universityProgress} anos concl.)</p>
          <p class="muted">Financiamento: <strong>${player.universityFunding === "parents" ? "Pago pelos Pais" : player.universityFunding === "scholarship" ? "Bolsa de Estudo" : player.universityFunding === "loan" ? "Crédito Estudantil" : "Poupanças Próprias"}</strong></p>
        ` : `<p class="muted">Escolhe um curso e a forma como vais pagar os estudos:</p>`}

        ${universityCourses.map((c, idx) => `
          <div style="margin-top: 12px; padding: 10px; background: var(--panel-light); border-radius: 10px;">
            <strong>${escapeHTML(c.name)}</strong> (${money(c.cost)}/ano · ${c.duration} anos)
            ${!player.universityCourse ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;">
                <button class="small-btn" data-uni-fund="${idx}_savings">Poupanças</button>
                <button class="small-btn" data-uni-fund="${idx}_parents">Pais</button>
                <button class="small-btn" data-uni-fund="${idx}_scholarship">Bolsa</button>
                <button class="small-btn" data-uni-fund="${idx}_loan">Crédito</button>
              </div>
            ` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }

  container.innerHTML = html;

  if ($("studyBtn")) $("studyBtn").onclick = studyHarder;
  if ($("behaviorBtn")) $("behaviorBtn").onclick = improveBehavior;
  if ($("abandonBtn")) $("abandonBtn").onclick = abandonEducation;
  if ($("returnSchoolBtn")) $("returnSchoolBtn").onclick = returnToSchool;

  container.querySelectorAll("[data-uni-fund]").forEach(btn => {
    btn.onclick = () => {
      const [idxStr, fund] = btn.dataset.uniFund.split("_");
      enrollUniversity(Number(idxStr), fund);
    };
  });
}

function renderProfile() {
  $("profileDetails").innerHTML = `
    <div class="info-row"><span>Nome</span><strong>${getPersonFullName(game.player)}</strong></div>
    <div class="info-row"><span>Idade</span><strong>${game.player.age} anos</strong></div>
    <div class="info-row"><span>Carta de Condução</span><strong>${game.player.hasDrivingLicense ? "Sim" : "Não"}</strong></div>
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

function refreshSpouseSelect() {
  const select = $("famSpouseSelect");
  if (!select) return;
  select.innerHTML = `<option value="">-- Selecionar Familiar --</option>`;
  initialFamily.forEach(f => {
    if (!f.partnerId) {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = `${f.name} (${f.relation}, ${f.age} anos)`;
      select.appendChild(opt);
    }
  });
}

function updateSetupFamilyUI() {
  const container = $("setupFamilyList");
  if (!container) return;
  container.innerHTML = "";
  initialFamily.forEach((f, idx) => {
    const spouse = f.partnerId ? initialFamily.find(p => p.id === f.partnerId) : null;
    const statusText = f.relationshipStatus === "Casado/a" && spouse 
      ? `Casado/a com ${spouse.name}` 
      : f.relationshipStatus;

    const card = document.createElement("div");
    card.className = "person-card";
    card.innerHTML = `
      <div class="person-info">
        <strong>${escapeHTML(f.name)}</strong>
        <small>${escapeHTML(f.relation)} · ${f.age} anos</small>
        <small>${escapeHTML(statusText)}</small>
      </div>
      <button type="button" class="small-btn danger-btn" data-remove-fam="${idx}">Remover</button>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-remove-fam]").forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.removeFam);
      const removed = initialFamily[idx];
      if (removed && removed.partnerId) {
        const partner = initialFamily.find(p => p.id === removed.partnerId);
        if (partner) {
          partner.partnerId = null;
          partner.relationshipStatus = "Solteiro/a";
        }
      }
      initialFamily.splice(idx, 1);
      updateSetupFamilyUI();
      refreshSpouseSelect();
    };
  });
}

function boot() {
  const maritalSelect = $("famMaritalStatus");
  const spouseGroup = $("famSpouseGroup");

  if (maritalSelect && spouseGroup) {
    maritalSelect.onchange = () => {
      const isMarried = maritalSelect.value === "Casado/a";
      spouseGroup.classList.toggle("hidden", !isMarried);
      if (isMarried) refreshSpouseSelect();
    };
  }

  const addFamBtn = $("addFamilyMemberBtn");
  if (addFamBtn) {
    addFamBtn.onclick = () => {
      const name = $("famName").value.trim();
      const relation = $("famRelation").value;
      const age = Number($("famAge").value) || 30;
      const maritalStatus = $("famMaritalStatus").value;
      const spouseId = maritalStatus === "Casado/a" ? $("famSpouseSelect").value : null;

      if (!name) {
        showToast("Insere o nome do familiar.");
        return;
      }

      const newId = createId();
      const newMember = {
        id: newId,
        name,
        surname: $("playerSurname").value.trim() || "Silva",
        relation,
        age,
        sex: ["Mãe", "Avó"].includes(relation) ? "Feminino" : ["Pai", "Avô"].includes(relation) ? "Masculino" : "Outro",
        relationshipStatus: maritalStatus,
        partnerId: spouseId || null
      };

      if (spouseId) {
        const spouse = initialFamily.find(p => p.id === spouseId);
        if (spouse) {
          spouse.partnerId = newId;
          spouse.relationshipStatus = "Casado/a";
        }
      }

      initialFamily.push(newMember);
      $("famName").value = "";
      $("famMaritalStatus").value = "Solteiro/a";
      spouseGroup.classList.add("hidden");
      
      updateSetupFamilyUI();
      refreshSpouseSelect();
    };
  }

  $("startForm").addEventListener("submit", e => { e.preventDefault(); startGame(); });
  
  if ($("continueGameBtn")) {
    $("continueGameBtn").addEventListener("click", () => {
      const saved = loadGame();
      if (saved) {
        game = saved;
        showGame();
        renderGame();
      }
    });
  }

  if ($("deleteSaveBtn")) {
    $("deleteSaveBtn").addEventListener("click", deleteSave);
  }

  $("advanceYearBtn").addEventListener("click", advanceYear);
  $("createBusinessBtn").addEventListener("click", createBusiness);
  
  $("bottomNav").addEventListener("click", e => {
    const btn = e.target.closest(".nav-btn");
    if (btn && btn.dataset.tab) showTab(btn.dataset.tab);
  });

  updateContinuePanel();
  updateSetupFamilyUI();
}

document.addEventListener("DOMContentLoaded", boot);
