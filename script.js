"use strict";

/* =========================================
   STARLIFE - MOTOR CORRIGIDO (LOJA & PATRIMÓNIO)
========================================= */

const SAVE_KEY = "starlife_v10_fixed";

let game = null;
let initialFamily = [];
let toastTimer = null;

const $ = id => document.getElementById(id);

function createId(prefix = "id") {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
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
    loaded.player.licenses ??= { carB: false, bikeAM: false, bikeA1: false, bikeA2: false, bikeA: false };
    loaded.player.bankAccount ??= null;
    loaded.player.activeRental ??= null;
    loaded.properties ??= [];
    loaded.marketListings ??= [];
    loaded.vehicles ??= [];
    loaded.businesses ??= [];
    loaded.player.illness ??= null;
    loaded.player.maxAge ??= randomNumber(78, 108);
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
   ILUSTRAÇÕES SVG (CASAS)
========================================= */

function getHouseSVG(type) {
  if (type === "studio") {
    return `<svg viewBox="0 0 120 80" class="house-illustration"><rect x="30" y="25" width="60" height="45" rx="4" fill="#3b82f6"/><polygon points="25,25 60,8 95,25" fill="#1d4ed8"/><rect x="52" y="45" width="16" height="25" fill="#93c5fd"/><rect x="36" y="34" width="12" height="12" fill="#fde047"/></svg>`;
  }
  if (type === "apartment") {
    return `<svg viewBox="0 0 120 80" class="house-illustration"><rect x="25" y="12" width="70" height="58" rx="3" fill="#6366f1"/><rect x="35" y="20" width="14" height="12" fill="#fef08a"/><rect x="71" y="20" width="14" height="12" fill="#fef08a"/><rect x="35" y="38" width="14" height="12" fill="#fef08a"/><rect x="71" y="38" width="14" height="12" fill="#fef08a"/><rect x="52" y="52" width="16" height="18" fill="#c7d2fe"/></svg>`;
  }
  if (type === "house") {
    return `<svg viewBox="0 0 120 80" class="house-illustration"><rect x="18" y="30" width="84" height="40" rx="3" fill="#10b981"/><polygon points="12,30 60,8 108,30" fill="#047857"/><rect x="52" y="45" width="16" height="25" fill="#d1fae5"/><rect x="26" y="40" width="16" height="14" fill="#fef08a"/><rect x="78" y="40" width="16" height="14" fill="#fef08a"/></svg>`;
  }
  return `<svg viewBox="0 0 120 80" class="house-illustration"><rect x="10" y="28" width="100" height="42" rx="4" fill="#f59e0b"/><polygon points="5,28 60,5 115,28" fill="#b45309"/><rect x="50" y="42" width="20" height="28" fill="#fef3c7"/><rect x="20" y="36" width="18" height="14" fill="#fef08a"/><rect x="82" y="36" width="18" height="14" fill="#fef08a"/></svg>`;
}

/* =========================================
   BANCOS
========================================= */

const banksList = [
  { id: "atlantico", name: "Banco Atlântico", interestRate: 0.045, desc: "Taxas competitivas para crédito habitação." },
  { id: "caixa", name: "Caixa Popular", interestRate: 0.052, desc: "Aprovação facilitada para jovens." },
  { id: "novafinanca", name: "Nova Finança Digital", interestRate: 0.038, desc: "Juros baixos para clientes com boa poupança." }
];

function openBankAccount(bankId) {
  const bank = banksList.find(b => b.id === bankId);
  if (!bank) return;
  game.player.bankAccount = { bankId: bank.id, bankName: bank.name, interestRate: bank.interestRate };
  addEvent(`Abriste conta bancária no ${bank.name}! 🏦`, "positive");
  saveGame();
  renderGame();
}

function renderBankSection() {
  const container = $("bankSectionContainer");
  if (!container) return;
  const player = game.player;

  if (!player.bankAccount) {
    let html = `<div class="panel"><h3>🏦 Abrir Conta Bancária</h3><p class="muted">Escolhe um banco para gerir dinheiro e pedir crédito habitação:</p><div class="button-list">`;
    banksList.forEach(b => {
      html += `
        <div class="person-card" style="flex-direction: column; align-items: flex-start; gap: 6px;">
          <strong>${escapeHTML(b.name)}</strong>
          <small>${escapeHTML(b.desc)} (Taxa Crédito: ${(b.interestRate * 100).toFixed(1)}%)</small>
          <button class="primary-btn full-width" onclick="openBankAccount('${b.id}')">Abrir Conta</button>
        </div>
      `;
    });
    html += `</div></div>`;
    container.innerHTML = html;
  } else {
    container.innerHTML = `
      <div class="panel">
        <h3>🏦 O Teu Banco</h3>
        <div class="info-row"><span>Instituição</span><strong>${escapeHTML(player.bankAccount.bankName)}</strong></div>
        <div class="info-row"><span>Taxa de Juro Crédito</span><strong>${(player.bankAccount.interestRate * 100).toFixed(1)}%</strong></div>
      </div>
    `;
  }
}

/* =========================================
   MERCADO IMOBILIÁRIO & LOJA DE CASAS
========================================= */

const streetNames = ["Rua das Flores", "Avenida da Liberdade", "Travessa do Sol", "Alameda dos Oceanos", "Rua da Bela Vista", "Praceta das Oliveiras", "Avenida Central", "Rua do Miradouro"];
const propertyTemplates = [
  { title: "Estúdio T0 Acolhedor", type: "studio", buyPrice: 75000, rentMonthly: 480, happiness: 4 },
  { title: "Apartamento T1 Moderno", type: "apartment", buyPrice: 135000, rentMonthly: 720, happiness: 8 },
  { title: "Apartamento T2 Familiar", type: "apartment", buyPrice: 195000, rentMonthly: 950, happiness: 12 },
  { title: "Moradia Geminada T3", type: "house", buyPrice: 310000, rentMonthly: 1350, happiness: 18 },
  { title: "Moradia Isolada com Jardim", type: "house", buyPrice: 480000, rentMonthly: 1900, happiness: 24 },
  { title: "Mansão de Luxo Vista Mar", type: "mansion", buyPrice: 950000, rentMonthly: 3500, happiness: 35 }
];

function generateYearlyMarket() {
  if (!game) return;
  const listings = [];
  const count = randomNumber(3, 4);
  for (let i = 0; i < count; i++) {
    const tpl = randomFrom(propertyTemplates);
    const variance = 0.9 + Math.random() * 0.25;
    listings.push({
      id: createId("house"),
      title: tpl.title,
      type: tpl.type,
      address: `${randomFrom(streetNames)}, n.º ${randomNumber(1, 240)}, ${game.player.city}`,
      buyPrice: Math.round((tpl.buyPrice * variance) / 500) * 500,
      rentMonthly: Math.round((tpl.rentMonthly * variance) / 10) * 10,
      happiness: tpl.happiness
    });
  }
  game.marketListings = listings;
}

function openPropertyModal(listingId) {
  const house = game.marketListings.find(h => h.id === listingId);
  if (!house) return;
  const modal = $("customModal");
  modal.innerHTML = `
    <div class="modal-card">
      <div style="text-align: center; margin-bottom: 10px;">${getHouseSVG(house.type)}</div>
      <h3>${escapeHTML(house.title)}</h3>
      <p class="muted" style="margin-bottom: 10px;">📍 ${escapeHTML(house.address)}</p>
      <div class="info-row"><span>Preço de Compra</span><strong>${money(house.buyPrice)}</strong></div>
      <div class="info-row"><span>Renda Mensal</span><strong>${money(house.rentMonthly)}/mês</strong></div>
      
      <div style="margin-top: 14px;">
        <h4>Arrendar Contrato</h4>
        <div style="display: flex; gap: 6px; margin-top: 6px;">
          <button class="secondary-btn" style="flex:1" onclick="rentProperty('${house.id}', 12)">12 Meses</button>
          <button class="secondary-btn" style="flex:1" onclick="rentProperty('${house.id}', 24)">24 Meses</button>
          <button class="secondary-btn" style="flex:1" onclick="rentProperty('${house.id}', 36)">36 Meses</button>
        </div>
      </div>

      <div style="margin-top: 14px;">
        <h4>Comprar Imóvel</h4>
        <div class="modal-buttons" style="margin-top: 6px;">
          <button class="primary-btn full-width" onclick="buyPropertyTransfer('${house.id}')">💳 Transferência (${money(house.buyPrice)})</button>
          <button class="secondary-btn full-width" onclick="buyPropertyMortgage('${house.id}')">🏦 Crédito Habitação</button>
        </div>
      </div>

      <button class="danger-btn full-width" style="margin-top: 14px;" onclick="closeCustomModal()">Fechar</button>
    </div>
  `;
  modal.classList.remove("hidden");
}

function closeCustomModal() {
  $("customModal").classList.add("hidden");
}

function rentProperty(listingId, months) {
  const house = game.marketListings.find(h => h.id === listingId);
  if (!house) return;
  if (game.player.age < 18) { showToast("Precisas de ter 18 anos."); return; }
  if (game.player.bank < house.rentMonthly * 2) { showToast("Precisas de 2 meses de caução."); return; }

  game.player.bank -= house.rentMonthly * 2;
  game.player.activeRental = { title: house.title, address: house.address, rentMonthly: house.rentMonthly, monthsRemaining: months, happiness: house.happiness };
  addEvent(`Assinaste contrato de arrendamento (${months} meses) em ${house.address}! 🔑`, "positive");
  closeCustomModal();
  saveGame();
  renderGame();
}

function buyPropertyTransfer(listingId) {
  const house = game.marketListings.find(h => h.id === listingId);
  if (!house) return;
  if (!game.player.bankAccount) { showToast("Abre primeiro uma conta bancária!"); return; }
  if (game.player.bank < house.buyPrice) { showToast("Saldo insuficiente."); return; }

  game.player.bank -= house.buyPrice;
  const isFirst = game.properties.length === 0;
  game.properties.push({
    id: createId("prop"), title: house.title, type: house.type, address: house.address,
    value: house.buyPrice, mortgageRemaining: 0, annualPayment: 0,
    status: isFirst ? "primary" : "rented_out", rentalIncomeAnnual: house.rentMonthly * 12, happiness: house.happiness
  });
  game.marketListings = game.marketListings.filter(h => h.id !== listingId);
  addEvent(`Compraste "${house.title}" a pronto! 🏡`, "positive");
  closeCustomModal();
  saveGame();
  renderGame();
}

function buyPropertyMortgage(listingId) {
  const house = game.marketListings.find(h => h.id === listingId);
  if (!house) return;
  if (!game.player.bankAccount) { showToast("Abre primeiro uma conta bancária!"); return; }
  if (game.player.age < 18) { showToast("Precisas de ter 18 anos."); return; }

  const downPayment = Math.round(house.buyPrice * 0.15);
  if (game.player.bank < downPayment) { showToast(`Precisas de ${money(downPayment)} de entrada (15%).`); return; }

  const loanAmount = house.buyPrice - downPayment;
  const annualPayment = Math.round((loanAmount / 25) * (1 + game.player.bankAccount.interestRate));

  game.player.bank -= downPayment;
  game.player.debt += loanAmount;
  const isFirst = game.properties.length === 0;

  game.properties.push({
    id: createId("prop"), title: house.title, type: house.type, address: house.address,
    value: house.buyPrice, mortgageRemaining: loanAmount, annualPayment,
    status: isFirst ? "primary" : "rented_out", rentalIncomeAnnual: house.rentMonthly * 12, happiness: house.happiness
  });
  game.marketListings = game.marketListings.filter(h => h.id !== listingId);
  addEvent(`Crédito Habitação aprovado para "${house.title}"! 🏦🏡`, "positive");
  closeCustomModal();
  saveGame();
  renderGame();
}

function renderHousingSection() {
  const container = $("housingSectionContainer");
  if (!container) return;
  const player = game.player;

  let html = `<div class="panel"><h3>🏡 Loja de Imobiliário</h3>`;
  if (player.activeRental) {
    html += `<div class="person-card" style="flex-direction: column; align-items: flex-start; margin-bottom: 10px; border-left: 4px solid var(--accent-color);"><strong>Arrendado: ${escapeHTML(player.activeRental.title)}</strong><small>📍 ${escapeHTML(player.activeRental.address)}</small><small>Renda: ${money(player.activeRental.rentMonthly)}/mês (${player.activeRental.monthsRemaining} meses restantes)</small></div>`;
  }
  html += `<h4 style="margin-top: 8px;">Imóveis Disponíveis (Clica para ver e comprar)</h4><div class="button-list">`;
  game.marketListings.forEach(h => {
    html += `
      <div class="person-card house-card" onclick="openPropertyModal('${h.id}')">
        <div style="width: 65px; flex-shrink: 0;">${getHouseSVG(h.type)}</div>
        <div style="flex: 1; margin-left: 10px;"><strong>${escapeHTML(h.title)}</strong><small style="display:block;">Compra: ${money(h.buyPrice)} | Renda: ${money(h.rentMonthly)}/mês</small></div>
      </div>
    `;
  });
  html += `</div></div>`;
  container.innerHTML = html;
}

function processHousingYear() {
  const player = game.player;
  if (player.activeRental) {
    player.bank -= player.activeRental.rentMonthly * 12;
    player.activeRental.monthsRemaining -= 12;
    player.happiness = clamp(player.happiness + 2);
    if (player.activeRental.monthsRemaining <= 0) {
      addEvent(`O contrato de arrendamento de "${player.activeRental.title}" terminou.`, "neutral");
      player.activeRental = null;
    }
  }
  game.properties.forEach(p => {
    if (p.mortgageRemaining > 0) {
      player.bank -= p.annualPayment;
      p.mortgageRemaining = Math.max(0, p.mortgageRemaining - p.annualPayment);
      player.debt = Math.max(0, player.debt - p.annualPayment);
    }
    if (p.status === "rented_out") {
      player.bank += p.rentalIncomeAnnual;
      addFinanceEvent(`Recebeste ${money(p.rentalIncomeAnnual)} de rendas.`);
    } else if (p.status === "primary") {
      player.happiness = clamp(player.happiness + 3);
    }
  });
}

/* =========================================
   GESTÃO DE BENS NO PATRIMÓNIO (ALTERAR E VENDER)
========================================= */

function togglePropertyStatus(propId) {
  const prop = game.properties.find(p => p.id === propId);
  if (!prop) return;
  if (prop.status === "primary") {
    prop.status = "rented_out";
    addEvent(`Colocaste "${prop.title}" a arrendar.`, "positive");
  } else {
    game.properties.forEach(p => { if (p.status === "primary") p.status = "rented_out"; });
    prop.status = "primary";
    addEvent(`Definiste "${prop.title}" como tua moradia principal.`, "positive");
  }
  saveGame();
  renderGame();
}

function sellProperty(propId) {
  const idx = game.properties.findIndex(p => p.id === propId);
  if (idx === -1) return;
  const prop = game.properties[idx];
  if (!confirm(`Tens a certeza de que queres vender "${prop.title}" por ${money(prop.value)}?`)) return;

  game.player.bank += prop.value;
  if (prop.mortgageRemaining > 0) {
    game.player.debt = Math.max(0, game.player.debt - prop.mortgageRemaining);
  }
  game.properties.splice(idx, 1);
  addEvent(`Vendeste o imóvel "${prop.title}" por ${money(prop.value)}.`, "positive");
  saveGame();
  renderGame();
}

function sellVehicle(vehId) {
  const idx = game.vehicles.findIndex(v => v.id === vehId);
  if (idx === -1) return;
  const veh = game.vehicles[idx];
  const sellPrice = Math.round(veh.value * 0.75);
  if (!confirm(`Queres vender "${veh.name}" por ${money(sellPrice)}?`)) return;

  game.player.bank += sellPrice;
  game.vehicles.splice(idx, 1);
  addEvent(`Vendeste o veículo "${veh.name}" por ${money(sellPrice)}.`, "positive");
  saveGame();
  renderGame();
}

function renderMyAssets() {
  const container = $("myAssetsContainer");
  if (!container) return;
  
  let html = `<div class="panel"><h3>🏡 Os Teus Imóveis & Bens</h3>`;
  if (game.properties.length === 0 && game.vehicles.length === 0) {
    html += `<p class="muted">Ainda não tens imóveis nem veículos comprados. Visita a Loja!</p>`;
  }

  game.properties.forEach(p => {
    const statusLbl = p.status === "primary" ? "🏠 Moradia Principal" : `💰 A Arrendar (+${money(p.rentalIncomeAnnual)}/ano)`;
    html += `
      <div class="person-card" style="flex-direction: column; align-items: flex-start; margin-bottom: 8px;">
        <div style="display:flex; align-items:center; gap:10px; width:100%;">
          <div style="width:55px;">${getHouseSVG(p.type)}</div>
          <div style="flex:1;"><strong>${escapeHTML(p.title)}</strong><small style="display:block;">${escapeHTML(p.address)}</small><small style="color: var(--success-color);">${statusLbl}</small></div>
        </div>
        <div style="display: flex; gap: 6px; width: 100%; margin-top: 6px;">
          <button class="small-btn" style="flex: 1;" onclick="togglePropertyStatus('${p.id}')">${p.status === "primary" ? "Arrendar" : "Tornar Principal"}</button>
          <button class="small-btn danger-btn" style="flex: 1;" onclick="sellProperty('${p.id}')">Vender (${money(p.value)})</button>
        </div>
      </div>
    `;
  });

  if (game.vehicles.length > 0) {
    html += `<h4 style="margin-top: 15px;">Veículos na Garagem</h4>`;
    game.vehicles.forEach(v => {
      html += `
        <div class="person-card" style="margin-bottom: 6px;">
          <div><strong>${escapeHTML(v.name)}</strong><small style="display:block;">Valor: ${money(v.value)}</small></div>
          <button class="small-btn danger-btn" onclick="sellVehicle('${v.id}')">Vender</button>
        </div>
      `;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
}

/* =========================================
   LEGISLAÇÃO PORTUGUESA DE CARTAS & VEÍCULOS (LOJA)
========================================= */

const licenseRules = {
  bikeAM: { name: "Carta AM (Ciclomotores até 50cc)", minAge: 16, cost: 250 },
  bikeA1: { name: "Carta A1 (Motos até 125cc / 11kW)", minAge: 16, cost: 380 },
  bikeA2: { name: "Carta A2 (Motos até 35kW)", minAge: 18, cost: 500 },
  bikeA:  { name: "Carta A (Motos Pesadas)", minAge: 24, cost: 650 },
  carB:   { name: "Carta B (Carros Ligeiros)", minAge: 18, cost: 650 }
};

const availableCars = [
  { name: "Yaris City", brand: "Toyo", price: 2500, annualCost: 450, reqLicense: "carB" },
  { name: "Golf GTI", brand: "Volks", price: 12000, annualCost: 750, reqLicense: "carB" },
  { name: "Série 3 Desportivo", brand: "BWM", price: 28000, annualCost: 1300, reqLicense: "carB" }
];

const availableBikes = [
  { name: "Scooter Urban 50", brand: "Yamah", cc: "50cc", price: 1800, annualCost: 200, reqLicense: "bikeAM" },
  { name: "CBR 125R", brand: "Hona", cc: "125cc", price: 3400, annualCost: 320, reqLicense: "bikeA1" },
  { name: "Ninja 400 Sport", brand: "Kawas", cc: "400cc", price: 6200, annualCost: 480, reqLicense: "bikeA2" },
  { name: "Monster 821 Naked", brand: "Ducati", cc: "821cc", price: 10500, annualCost: 700, reqLicense: "bikeA2" },
  { name: "R1 Superbike", brand: "Yamah", cc: "1000cc", price: 17500, annualCost: 1100, reqLicense: "bikeA" }
];

function takeLicense(licenseKey) {
  const player = game.player;
  const rule = licenseRules[licenseKey];
  if (!rule) return;

  if (licenseKey === "bikeA" && player.age < 24) {
    showToast("Para a Carta A precisas de 24 anos.");
    return;
  }
  if (player.age < rule.minAge) {
    showToast(`Precisas de ter pelo menos ${rule.minAge} anos.`);
    return;
  }
  if (player.bank < rule.cost) {
    showToast(`Sem saldo suficiente (${money(rule.cost)}).`);
    return;
  }

  player.bank -= rule.cost;
  player.licenses[licenseKey] = true;
  addEvent(`Obtiviste a ${rule.name}! 🚗🏍️`, "positive");
  saveGame();
  renderGame();
}

function buyVehicle(type, idx) {
  const player = game.player;
  let vehicle = null;
  if (type === "car") {
    vehicle = availableCars[idx];
    if (!player.licenses[vehicle.reqLicense]) { showToast("Não tens carta para este carro!"); return; }
  } else {
    vehicle = availableBikes[idx];
    if (!player.licenses[vehicle.reqLicense]) { showToast("Não tens a carta de mota adequada!"); return; }
  }

  if (player.bank < vehicle.price) { showToast("Sem saldo na conta."); return; }
  player.bank -= vehicle.price;
  game.vehicles.push({ id: createId("veh"), name: `${vehicle.brand} ${vehicle.name}`, type: type, value: vehicle.price, annualCost: vehicle.annualCost });
  addEvent(`Compraste o veículo ${vehicle.brand} ${vehicle.name}! 🚘🏍️`, "positive");
  saveGame();
  renderGame();
}

function renderVehiclesSection() {
  const container = $("vehiclesSectionContainer");
  if (!container) return;
  const player = game.player;

  let html = `<div class="panel"><h3>📜 Cartas de Condução (Legislação PT)</h3><div class="button-list">`;
  Object.keys(licenseRules).forEach(key => {
    const rule = licenseRules[key];
    const hasIt = player.licenses[key];
    const ageOk = player.age >= rule.minAge;
    html += `
      <div class="person-card" style="flex-direction: column; align-items: flex-start; gap: 4px;">
        <strong>${escapeHTML(rule.name)}</strong>
        <small>Idade mín: ${rule.minAge} anos | Custo: ${money(rule.cost)}</small>
        ${hasIt ? `<span style="color: var(--success-color); font-weight:bold;">✔ Obtida</span>` : `<button class="secondary-btn full-width" ${!ageOk ? 'disabled' : ''} onclick="takeLicense('${key}')">Tirar Carta (${money(rule.cost)})</button>`}
      </div>
    `;
  });
  html += `</div></div>`;

  html += `<div class="panel" style="margin-top: 15px;"><h3>🚗🏍️ Concessionário de Veículos</h3>`;
  html += `<h4 style="margin-top: 4px;">Comprar Carros</h4><div class="button-list">`;
  availableCars.forEach((c, idx) => {
    html += `<button class="secondary-btn full-width" onclick="buyVehicle('car', ${idx})">${escapeHTML(c.brand)} ${escapeHTML(c.name)} (${money(c.price)})</button>`;
  });
  html += `</div>`;

  html += `<h4 style="margin-top: 12px;">Comprar Motas (Todas as Cilindradas)</h4><div class="button-list">`;
  availableBikes.forEach((b, idx) => {
    html += `<button class="secondary-btn full-width" onclick="buyVehicle('bike', ${idx})">${escapeHTML(b.brand)} ${escapeHTML(b.name)} [${b.cc}] (${money(b.price)})</button>`;
  });
  html += `</div></div>`;

  container.innerHTML = html;
}

/* =========================================
   NEGÓCIOS (DENTRO DE CARREIRA)
========================================= */

function createBusiness() {
  if (game.player.age < 18) { showToast("Precisas de ter 18 anos."); return; }
  const name = prompt("Nome do negócio:");
  if (!name) return;
  const inv = Number(prompt("Investimento inicial (min. 500 €):"));
  if (!inv || inv < 500 || game.player.bank < inv) { showToast("Investimento inválido ou sem saldo."); return; }
  game.player.bank -= inv;
  game.businesses.push({ id: createId("biz"), name, investment: inv, yearlyProfit: Math.round(inv * 0.25) });
  addEvent(`Criaste o negócio "${name}"! 🏢`, "positive");
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
    container.innerHTML += `
      <div class="person-card">
        <div class="person-info">
          <strong>${escapeHTML(b.name)}</strong>
          <small>Investimento: ${money(b.investment)} · Lucro Anual: ${money(b.yearlyProfit)}</small>
        </div>
      </div>
    `;
  });
}

function processBusinessesYear() {
  if (!game || !game.businesses.length) return;
  game.businesses.forEach(b => {
    game.player.bank += b.yearlyProfit;
    addFinanceEvent(`O teu negócio "${b.name}" gerou ${money(b.yearlyProfit)} de lucro.`);
  });
}

/* =========================================
   ESCOLA E UNIVERSIDADE
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
  player.schoolGrade ??= 12;
  player.education ??= "Sem escolaridade";
  player.educationLevel ??= 0;
  player.universityCourse ??= null;
  player.universityProgress ??= 0;
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

function enrollUniversity(index) {
  const player = game.player;
  const course = universityCourses[index];
  if (player.universityCourse) { showToast("Já estás na universidade."); return; }
  player.universityCourse = course.name;
  player.universityProgress = 0;
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

function renderSchoolAndUniversitySubmenu() {
  const player = game.player;
  const container = $("schoolSectionContainer");
  if (!container) return;
  const stage = getCurrentEducationStage(player.age);

  let html = `
    <div class="panel" style="margin-top: 6px;">
      <h3>📚 Estatísticas Escolares</h3>
      <div class="info-row"><span>Etapa atual</span><strong>${escapeHTML(stage?.name || player.education)}</strong></div>
      <div class="info-row"><span>Média</span><strong>${player.schoolGrade}/20</strong></div>
      <div class="info-row"><span>Inteligência</span><strong>${player.intelligence}%</strong></div>
    </div>
  `;

  if (player.age >= 6 && player.age <= 18) {
    html += `<div class="panel"><h3>Atividades de Estudante</h3><button class="primary-btn full-width" id="studyBtn">📖 Estudar Mais</button></div>`;
  }

  if (player.age >= 18 && player.educationLevel >= 2) {
    html += `
      <div class="panel">
        <h3>🏛️ Ensino Superior</h3>
        ${player.universityCourse ? `<p>Curso atual: <strong>${player.universityCourse}</strong> (${player.universityProgress} anos)</p>` : `<p class="muted">Escolhe um curso:</p>`}
        ${universityCourses.map((c, idx) => `
          <div style="margin-top: 8px; padding: 8px; background: var(--panel-light); border-radius: 8px;">
            <strong>${escapeHTML(c.name)}</strong> (${money(c.cost)}/ano)
            ${!player.universityCourse ? `<button class="small-btn full-width" style="margin-top:6px;" data-uni-idx="${idx}">Inscrever-se</button>` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }

  container.innerHTML = html;
  if ($("studyBtn")) $("studyBtn").onclick = studyHarder;
  container.querySelectorAll("[data-uni-idx]").forEach(b => {
    b.onclick = () => enrollUniversity(Number(b.dataset.uniIdx));
  });
}

const femaleNames = ["Maria", "Ana", "Beatriz", "Inês", "Sofia", "Matilde", "Leonor", "Carolina", "Mariana", "Margarida", "Catarina", "Joana", "Rita", "Francisca", "Marta", "Laura", "Alice", "Diana", "Cláudia", "Raquel", "Teresa", "Isabel", "Helena", "Andreia", "Patrícia", "Eva", "Luísa", "Daniela", "Filipa"];
const maleNames = ["João", "Pedro", "Miguel", "Francisco", "Tiago", "Diogo", "André", "Rafael", "Gonçalo", "Martim", "Afonso", "Tomás", "Duarte", "Bruno", "Ricardo", "Daniel", "António", "Manuel", "Luís", "Gabriel", "David", "Nuno", "Hugo", "Filipe", "Eduardo", "José", "Rodrigo", "Vasco", "Guilherme"];
const tombstoneQuotes = [
  "Viveu intensamente, partiu em paz.",
  "Deixou saudades em todos os que cruzaram o seu caminho.",
  "Descansa em paz. A jornada foi longa e bela.",
  "Amou, riu, aprendeu e agora descansa.",
  "Uma lenda nunca morre, apenas descansa."
];

const commonIllnesses = [
  { name: "Gripe Sazonal", severity: "Baixa", cost: 50, healthImpact: 4, specialty: "familyDoctor" },
  { name: "Entorse no Tornozelo", severity: "Baixa", cost: 120, healthImpact: 6, specialty: "orthopedics" },
  { name: "Hipertensão Arterial", severity: "Média", cost: 350, healthImpact: 10, specialty: "cardiology" },
  { name: "Depressão Crónica", severity: "Média", cost: 500, healthImpact: 12, specialty: "psychiatry" },
  { name: "Cancro em Estádio Inicial", severity: "Alta", cost: 6000, healthImpact: 30, specialty: "oncology" }
];

function generateName(sex) {
  if (sex === "Feminino") return randomFrom(femaleNames);
  if (sex === "Masculino") return randomFrom(maleNames);
  return randomFrom([...femaleNames, ...maleNames]);
}

function createFamilyMember(data) {
  return {
    id: data.id || createId("person"),
    name: data.name || "Sem nome",
    surname: data.surname || "",
    relation: data.relation || "Outro",
    age: Number(data.age) || 0,
    sex: data.sex || "Outro",
    alive: true,
    job: "",
    salary: 0
  };
}

const lifeEventsPool = [
  { minAge: 0, maxAge: 3, text: "Deste os teus primeiros passos na sala de estar.", options: [{ text: "Sorrir", effect: () => { game.player.happiness = clamp(game.player.happiness + 5); addEvent("Os pais celebraram.", "positive"); } }] },
  { minAge: 6, maxAge: 11, text: "Participaste numa atividade desportiva na escola.", options: [{ text: "Dar o máximo", effect: () => { game.player.health = clamp(game.player.health + 3); addEvent("Ganhaste uma medalha!", "positive"); } }] },
  { minAge: 12, maxAge: 17, text: "Tiveste um teste difícil de História e tiraste excelente nota.", options: [{ text: "Celebrar", effect: () => { game.player.intelligence = clamp(game.player.intelligence + 2); addEvent("O esforço valeu a pena.", "positive"); } }] },
  { minAge: 18, maxAge: 65, text: "Fizeste horas extra no trabalho.", options: [{ text: "Aceitar", effect: () => { game.player.bank += 180; addFinanceEvent("Ganhaste 180 € extra."); addEvent("Recebeste um bónus.", "positive"); } }] }
];

function triggerRandomEvent() {
  if (!game || !game.player.alive) return;
  const age = game.player.age;
  const validEvents = lifeEventsPool.filter(ev => age >= ev.minAge && age <= ev.maxAge);
  if (validEvents.length === 0 || Math.random() > 0.4) return;
  const ev = randomFrom(validEvents);
  const modal = $("customModal");
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

function checkRandomIllness() {
  const player = game.player;
  if (player.illness || player.age < 12) return;
  const chance = 0.06 + (player.age * 0.001) - ((player.health - 50) * 0.001);
  if (Math.random() < chance) {
    const ill = randomFrom(commonIllnesses);
    player.illness = { ...ill };
    addEvent(`⚠️ Foi-te diagnosticado/a: ${ill.name}.`, "negative");
  }
}

function openHealthSpecialty(specialty) {
  const container = $("healthActionContainer");
  let title = "Centro Clínico";
  let desc = "Serviços médicos especializados.";
  let cost = 100;
  let actionType = "specialist";

  if (specialty === "familyDoctor") { title = "👨‍⚕️ Médico de Família"; desc = "Consulta de rotina."; cost = 40; actionType = "checkup"; }
  else if (specialty === "urgency") { title = "🚑 Urgências Hospitalares"; desc = "Atendimento imediato."; cost = 100; actionType = "urgency"; }
  else if (specialty === "cardiology") { title = "❤️ Cardiologia"; desc = "Tratamento cardiovascular."; cost = 250; actionType = "treatment"; }
  else if (specialty === "orthopedics") { title = "🦴 Ortopedia"; desc = "Tratamento de lesões."; cost = 180; actionType = "treatment"; }
  else if (specialty === "psychiatry") { title = "🧠 Psiquiatria"; desc = "Saúde mental."; cost = 200; actionType = "treatment"; }
  else if (specialty === "oncology") { title = "🎗️ Oncologia"; desc = "Tratamento oncológico."; cost = 1500; actionType = "oncology"; }

  container.innerHTML = `
    <div class="panel" style="margin-top: 12px;">
      <h3>${title}</h3>
      <p class="muted">${desc}</p>
      <button class="primary-btn full-width" style="margin-top: 10px;" id="execHealthBtn">Efetuar Consulta (${money(cost)})</button>
    </div>
  `;
  $("execHealthBtn").onclick = () => executeHealthAction(actionType, cost, specialty);
}

function executeHealthAction(type, cost, specialty) {
  const player = game.player;
  if (player.bank < cost) { showToast(`Precisas de ${money(cost)}.`); return; }
  player.bank -= cost;
  if (type === "checkup") {
    player.health = clamp(player.health + 3);
    showToast(player.illness ? `Atenção: Tens ${player.illness.name}!` : "Check-up limpo!");
  } else if (type === "urgency") {
    player.health = clamp(player.health + 12);
    showToast("Urgência efetuada.");
  } else {
    if (player.illness && (player.illness.specialty === specialty || specialty === "oncology")) {
      addEvent(`Curaste com sucesso: ${player.illness.name}! 🎉`, "positive");
      player.illness = null;
      player.health = clamp(player.health + 25);
      showToast("Tratamento bem-sucedido!");
    } else {
      player.health = clamp(player.health + 10);
      showToast("Consulta concluída.");
    }
  }
  saveGame();
  renderGame();
}

/* =========================================
   MORTE E AVANÇAR ANO
========================================= */

function triggerDeath() {
  const player = game.player;
  player.alive = false;
  saveGame();

  $("gameScreen").classList.add("hidden");
  $("deathScreen").classList.remove("hidden");

  $("tombstoneName").textContent = `${player.name} ${player.surname}`;
  $("tombstoneYears").textContent = `${game.year - player.age} - ${game.year} (${player.age} anos)`;
  $("tombstoneQuote").textContent = `"${randomFrom(tombstoneQuotes)}"`;

  $("deathReportStats").innerHTML = `
    <div class="info-row"><span>Património Final</span><strong>${money(player.bank)}</strong></div>
    <div class="info-row"><span>Profissão</span><strong>${escapeHTML(player.job || "Nenhuma")}</strong></div>
    <div class="info-row"><span>Escolaridade</span><strong>${escapeHTML(player.education)}</strong></div>
  `;

  $("newLifeBtn").onclick = () => {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  };
}

function advanceYear() {
  if (!game || !game.player.alive) return;
  const player = game.player;

  player.age += 1;
  game.year += 1;
  player.bank += player.salary;

  processSchoolYear();
  processFurtherEducation();
  processHousingYear();
  processBusinessesYear();
  checkRandomIllness();
  generateYearlyMarket();

  if (player.illness) {
    player.health = clamp(player.health - player.illness.healthImpact);
  }

  if (player.age >= player.maxAge || player.health <= 0) {
    triggerDeath();
    return;
  }

  triggerRandomEvent();
  saveGame();
  renderGame();
}

/* =========================================
   INICIALIZAÇÃO E RENDER
========================================= */

function startGame() {
  const name = $("playerName").value.trim();
  const surname = $("playerSurname").value.trim();
  if (!name || !surname) { showToast("Preenche o nome e apelido."); return; }

  const player = {
    id: createId("player"), name, surname,
    sex: $("playerSex").value,
    country: $("playerCountry").value.trim(),
    city: $("playerCity").value.trim(),
    age: 0, alive: true,
    health: 100, happiness: 80,
    education: "Sem escolaridade", educationLevel: 0,
    job: "", salary: 0, bank: 1000, debt: 0, expenses: 0,
    licenses: { carB: false, bikeAM: false, bikeA1: false, bikeA2: false, bikeA: false },
    bankAccount: null, activeRental: null,
    illness: null,
    maxAge: randomNumber(78, 108)
  };

  game = {
    player, family: [], socialPeople: [], events: [], financeHistory: [],
    properties: [], marketListings: [], businesses: [], vehicles: [],
    year: new Date().getFullYear(), started: true
  };

  initializeEducation(player);
  generateYearlyMarket();

  if (initialFamily.length === 0) {
    const mother = createFamilyMember({ name: generateName("Feminino"), surname, relation: "Mãe", age: 30, sex: "Feminino" });
    const father = createFamilyMember({ name: generateName("Masculino"), surname, relation: "Pai", age: 33, sex: "Masculino" });
    game.family.push(mother, father);
  } else {
    game.family = initialFamily.map(f => createFamilyMember(f));
  }

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

  const primaryProp = game.properties.find(p => p.status === "primary");
  if (primaryProp) $("housingSummary").textContent = primaryProp.title;
  else if (player.activeRental) $("housingSummary").textContent = `${player.activeRental.title} (Arrendada)`;
  else $("housingSummary").textContent = "Casa dos Pais";

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
  const propsVal = game.properties.reduce((sum, p) => sum + p.value, 0);
  const vehVal = game.vehicles.reduce((sum, v) => sum + v.value, 0);
  $("totalWealth").textContent = money(player.bank + propsVal + vehVal - player.debt);
  $("bankBalance").textContent = money(player.bank);
  $("currentBankName").textContent = player.bankAccount ? player.bankAccount.bankName : "Sem conta aberta";
  $("annualSalary").textContent = money(player.salary);
  $("debtValue").textContent = money(player.debt);

  renderBankSection();
  renderMyAssets();
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
        <button class="secondary-btn" onclick="applyJob('Assistente', 16500)">Assistente · 16 500 €/ano</button>
      `;
    } else {
      jobContainer.innerHTML = `<p class="muted">Procura emprego a partir dos 16 anos.</p>`;
    }
  }

  renderSchoolAndUniversitySubmenu();
  renderBusinesses();
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
  renderHousingSection();
  renderVehiclesSection();
  renderPeople();
}

function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.add("hidden"));
  const target = $(tabId);
  if (target) target.classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
}

function showSubTab(subId) {
  const parentTab = document.querySelector(".tab-content:not(.hidden)");
  if (!parentTab) return;
  parentTab.querySelectorAll(".sub-content").forEach(c => c.classList.add("hidden"));
  parentTab.querySelectorAll(".sub-btn").forEach(b => b.classList.remove("active"));

  const target = $(subId);
  if (target) target.classList.remove("hidden");
  const activeBtn = parentTab.querySelector(`[data-sub="${subId}"]`);
  if (activeBtn) activeBtn.classList.add("active");
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

  document.querySelectorAll("[data-health]").forEach(btn => {
    btn.onclick = () => openHealthSpecialty(btn.dataset.health);
  });

  document.querySelectorAll(".sub-btn").forEach(btn => {
    btn.onclick = () => showSubTab(btn.dataset.sub);
  });

  $("createBusinessBtn")?.addEventListener("click", createBusiness);
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
