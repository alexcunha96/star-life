const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const LOGICAL_WIDTH = 480;
const LOGICAL_HEIGHT = 860;
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = LOGICAL_WIDTH * dpr;
canvas.height = LOGICAL_HEIGHT * dpr;
ctx.scale(dpr, dpr);
const UI = {
floatingTexts: [],
colors: {
bg: '#f8fafc',
card: '#ffffff',
primary: '#4f46e5',
primaryDark: '#3730a3',
success: '#10b981',
warning: '#f59e0b',
danger: '#ef4444',
fame: '#8b5cf6',
textMain: '#0f172a',
textMuted: '#64748b',
border: '#e2e8f0'
},
drawCard(x, y, w, h, radius = 16, bgColor = '#ffffff', hasShadow = true) {
ctx.save();
if (hasShadow) {
ctx.shadowColor = 'rgba(15, 23, 42, 0.06)';
ctx.shadowBlur = 14;
ctx.shadowOffsetY = 4;
}
ctx.fillStyle = bgColor;
ctx.beginPath();
ctx.roundRect(x, y, w, h, radius);
ctx.fill();
ctx.shadowColor = 'transparent';
ctx.strokeStyle = this.colors.border;
ctx.lineWidth = 1;
ctx.stroke();
ctx.restore();
},
drawButton(x, y, w, h, text, colorStart = '#4f46e5', colorEnd = '#4338ca', disabled = false) {
ctx.save();
const grad = ctx.createLinearGradient(x, y, x, y + h);
if (disabled) {
grad.addColorStop(0, '#cbd5e1');
grad.addColorStop(1, '#94a3b8');
} else {
grad.addColorStop(0, colorStart);
grad.addColorStop(1, colorEnd);
ctx.shadowColor = colorStart + '44';
ctx.shadowBlur = 10;
ctx.shadowOffsetY = 4;
}
ctx.fillStyle = grad;
ctx.beginPath();
ctx.roundRect(x, y, w, h, 14);
ctx.fill();
ctx.shadowColor = 'transparent';
ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
ctx.beginPath();
ctx.roundRect(x + 2, y + 2, w - 4, h * 0.4, 12);
ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(text, x + w / 2, y + h / 2 + 1);
ctx.restore();
},
drawStatBar(x, y, w, h, percent, color, label = '', valueText = '') {
const clamped = Math.max(0, Math.min(100, percent));
ctx.save();
if (label) {
ctx.fillStyle = this.colors.textMain;
ctx.font = '600 13px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(label, x, y - 6);
ctx.fillStyle = this.colors.textMuted;
ctx.textAlign = 'right';
ctx.fillText(valueText || ${Math.round(clamped)}%, x + w, y - 6);
}
ctx.fillStyle = '#e2e8f0';
ctx.beginPath();
ctx.roundRect(x, y, w, h, h / 2);
ctx.fill();
if (clamped > 0) {
ctx.fillStyle = color;
ctx.beginPath();
ctx.roundRect(x, y, (w * clamped) / 100, h, h / 2);
ctx.fill();
}
ctx.restore();
},
spawnText(x, y, text, color = '#10b981') {
this.floatingTexts.push({ x, y, text, color, alpha: 1, vy: -1.2 });
},
updateAndDrawEffects() {
for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
const ft = this.floatingTexts[i];
ft.y += ft.vy;
ft.alpha -= 0.018;
if (ft.alpha <= 0) {
this.floatingTexts.splice(i, 1);
continue;
}
ctx.save();
ctx.globalAlpha = ft.alpha;
ctx.font = 'bold 18px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillStyle = '#ffffff';
ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
ctx.lineWidth = 3;
ctx.strokeText(ft.text, ft.x, ft.y);
ctx.fillStyle = ft.color;
ctx.fillText(ft.text, ft.x, ft.y);
ctx.restore();
}
}
};
class SoundEngine {
constructor() {
this.ctx = null;
this.muted = false;
}
init() {
if (!this.ctx) {
const AudioContext = window.AudioContext || window.webkitAudioContext;
this.ctx = new AudioContext();
}
if (this.ctx.state === 'suspended') {
this.ctx.resume();
}
}
playTone(freq, type, duration, vol = 0.14, slideFreq = null) {
if (this.muted) return;
this.init();
const osc = this.ctx.createOscillator();
const gain = this.ctx.createGain();
osc.type = type;
osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
if (slideFreq) {
osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
}
gain.gain.setValueAtTime(vol, this.ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
osc.connect(gain);
gain.connect(this.ctx.destination);
osc.start();
osc.stop(this.ctx.currentTime + duration);
}
click() {
this.playTone(540, 'sine', 0.07, 0.1, 700);
}
step() {
this.playTone(420, 'triangle', 0.1, 0.11, 560);
}
good() {
this.playTone(523.25, 'sine', 0.11, 0.13);
setTimeout(() => this.playTone(659.25, 'sine', 0.16, 0.13), 85);
}
levelUp() {
this.playTone(440, 'triangle', 0.1, 0.13);
setTimeout(() => this.playTone(554.37, 'triangle', 0.1, 0.13), 80);
setTimeout(() => this.playTone(659.25, 'triangle', 0.22, 0.15), 160);
}
gameOver() {
this.playTone(280, 'sawtooth', 0.25, 0.13, 200);
setTimeout(() => this.playTone(190, 'sawtooth', 0.4, 0.13, 85), 210);
}
}
const sound = new SoundEngine();
const LOCATIONS = [
{ country: 'Portugal', cities: ['Lisboa', 'Porto', 'Braga', 'Coimbra'] },
{ country: 'Brasil', cities: ['São Paulo', 'Rio de Janeiro', 'Curitiba', 'Salvador'] },
{ country: 'Espanha', cities: ['Madrid', 'Barcelona', 'Valência', 'Sevilha'] },
{ country: 'Estados Unidos', cities: ['Nova Iorque', 'Los Angeles', 'Miami', 'Chicago'] },
{ country: 'Reino Unido', cities: ['Londres', 'Manchester', 'Liverpool', 'Edimburgo'] }
];
const FIRST_NAMES_M = ['Lucas', 'Tiago', 'Gabriel', 'Mateus', 'André', 'Rafael', 'Diogo', 'Henrique'];
const FIRST_NAMES_F = ['Sofia', 'Beatriz', 'Clara', 'Inês', 'Mariana', 'Leonor', 'Camila', 'Helena'];
const LAST_NAMES = ['Silva', 'Santos', 'Costa', 'Oliveira', 'Pereira', 'Martins', 'Ferreira', 'Almeida'];
const EDUCATION_LEVELS = [
{ id: 'none', name: 'Sem Escolaridade', cost: 0, months: 0, reqInt: 0 },
{ id: 'school', name: 'Ensino Secundário Completo', cost: 0, months: 144, reqInt: 0 },
{ id: 'tech', name: 'Curso Técnico Profissional', cost: 2400, months: 18, reqInt: 30 },
{ id: 'uni', name: 'Licenciatura Universitária', cost: 11000, months: 36, reqInt: 55 },
{ id: 'master', name: 'Mestrado & Doutoramento', cost: 24000, months: 24, reqInt: 78 }
];
const REGULAR_CAREERS = [
{ id: 'unemployed', title: 'Desempregado', monthlySalary: 0, reqEdu: 'none', reqInt: 0, reqFame: 0, reqEnergy: 0 },
{ id: 'barista', title: 'Barista / Empregado Loja', monthlySalary: 950, reqEdu: 'school', reqInt: 10, reqFame: 0, reqEnergy: 10 },
{ id: 'tech_spec', title: 'Técnico Especializado', monthlySalary: 2100, reqEdu: 'tech', reqInt: 35, reqFame: 0, reqEnergy: 15 },
{ id: 'engineer', title: 'Engenheiro de Software', monthlySalary: 4600, reqEdu: 'uni', reqInt: 65, reqFame: 0, reqEnergy: 20 },
{ id: 'surgeon', title: 'Médico Cirurgião', monthlySalary: 7800, reqEdu: 'master', reqInt: 85, reqFame: 5, reqEnergy: 30 },
{ id: 'ceo', title: 'Diretor Executivo (CEO)', monthlySalary: 14500, reqEdu: 'master', reqInt: 85, reqFame: 40, reqEnergy: 35 }
];
const SPECIAL_CAREERS = [
{ id: 'athlete', title: 'Atleta Profissional', monthlySalary: 18000, reqEdu: 'school', reqInt: 25, reqFame: 20, reqHealth: 80, fameGain: 2 },
{ id: 'actor', title: 'Ator / Atriz de Cinema', monthlySalary: 25000, reqEdu: 'school', reqInt: 40, reqFame: 35, reqHealth: 50, fameGain: 3 },
{ id: 'streamer', title: 'Criador Digital Global', monthlySalary: 9500, reqEdu: 'school', reqInt: 30, reqFame: 15, reqHealth: 40, fameGain: 2 },
{ id: 'superstar', title: 'Superestrela Internacional', monthlySalary: 48000, reqEdu: 'school', reqInt: 50, reqFame: 75, reqHealth: 60, fameGain: 4 }
];
const INITIAL_ASSETS = [
{ id: 'btc', category: 'CRYPTO', name: 'Bitcoin (BTC)', price: 58000, volatility: 0.14 },
{ id: 'eth', category: 'CRYPTO', name: 'Ethereum (ETH)', price: 3100, volatility: 0.16 },
{ id: 'sol', category: 'CRYPTO', name: 'Solana (SOL)', price: 145, volatility: 0.22 },
{ id: 'aapl', category: 'STOCK', name: 'Apple Inc. (AAPL)', price: 210, volatility: 0.06 },
{ id: 'nvda', category: 'STOCK', name: 'NVIDIA Corp. (NVDA)', price: 135, volatility: 0.09 },
{ id: 'tsla', category: 'STOCK', name: 'Tesla Inc. (TSLA)', price: 245, volatility: 0.11 },
{ id: 'sp500', category: 'ETF', name: 'ETF S&P 500 Index', price: 520, volatility: 0.035 },
{ id: 'msci', category: 'ETF', name: 'ETF MSCI World', price: 115, volatility: 0.03 },
{ id: 'nasdaq', category: 'ETF', name: 'ETF Nasdaq 100', price: 460, volatility: 0.05 }
];
const BUSINESS_TYPES = [
{ id: 'cafe', name: 'Cafetaria & Pastelaria', cost: 15000, baseMonthlyProfit: 1400 },
{ id: 'gym', name: 'Ginásio & Fitness Club', cost: 45000, baseMonthlyProfit: 4300 },
{ id: 'agency', name: 'Agência de Marketing Digital', cost: 85000, baseMonthlyProfit: 8800 },
{ id: 'tech_startup', name: 'Startup de Tecnologia & IA', cost: 220000, baseMonthlyProfit: 24500 },
{ id: 'hotel', name: 'Hotel Boutique de Luxo', cost: 650000, baseMonthlyProfit: 72000 }
];
const RANDOM_EVENTS = [
{
title: 'Oportunidade de Bónus',
desc: 'O teu desempenho chamou a atenção e recebeste uma proposta extra.',
minAge: 16,
choices: [
{ text: 'Aceitar projeto extra (+€1.200)', effect: (p) => { p.money += 1200; p.energy = Math.max(0, p.energy - 12); return 'Trabalhaste duro e ganhaste €1.200!'; } },
{ text: 'Descansar e recuperar energia', effect: (p) => { p.energy = Math.min(100, p.energy + 18); p.happy = Math.min(100, p.happy + 8); return 'Recuperaste as energias totalmente.'; } }
]
},
{
title: 'Destaque nas Redes Sociais',
desc: 'Uma publicação tua tornou-se tendência na tua cidade.',
minAge: 14,
choices: [
{ text: 'Interagir com o público (+Fama)', effect: (p) => { p.fame = Math.min(100, p.fame + 10); p.happy = Math.min(100, p.happy + 6); return 'A tua popularidade subiu 10%!'; } },
{ text: 'Fazer parceria comercial (+€900)', effect: (p) => { p.money += 900; p.fame = Math.min(100, p.fame + 4); return 'Ganhaste €900 com publicidade!'; } }
]
},
{
title: 'Gripe Sazonal',
desc: 'Sentiste sintomas de cansaço e febre ligeira este mês.',
minAge: 4,
choices: [
{ text: 'Ir à clínica privada (-€350)', effect: (p) => { if (p.money >= 350) { p.money -= 350; p.health = Math.min(100, p.health + 12); return 'Recuperaste rapidamente com medicação.'; } else { p.health = Math.max(0, p.health - 12); return 'Sem saldo suficiente, a recuperação demorou.'; } } },
{ text: 'Repousar em casa', effect: (p) => { p.health = Math.max(0, p.health - 8); p.energy = Math.min(100, p.energy + 10); return 'Repousaste alguns dias até melhorar.'; } }
]
}
];
const STATE = {
MENU: 'MENU',
CUSTOMIZE: 'CUSTOMIZE',
PLAYING: 'PLAYING',
FINANCE_HUB: 'FINANCE_HUB',
FINANCE_CRYPTO: 'FINANCE_CRYPTO',
FINANCE_STOCKS: 'FINANCE_STOCKS',
FINANCE_ETFS: 'FINANCE_ETFS',
FINANCE_ANALYSIS: 'FINANCE_ANALYSIS',
CAREER_HUB: 'CAREER_HUB',
EDUCATION_HUB: 'EDUCATION_HUB',
BUSINESS_HUB: 'BUSINESS_HUB',
LIFESTYLE_HUB: 'LIFESTYLE_HUB',
EVENT: 'EVENT',
GAMEOVER: 'GAMEOVER'
};
let currentState = STATE.MENU;
let activeEvent = null;
let buttons = [];
let player = null;
let assets = [];
let customConfig = {
gender: 'M',
firstName: 'Lucas',
lastName: 'Silva',
locIndex: 0,
cityIndex: 0
};
function formatEuro(val) {
return '€' + Math.round(val).toLocaleString('pt-PT');
}
function getEduIndex(id) {
return EDUCATION_LEVELS.findIndex(e => e.id === id);
}
function createNewPlayer() {
const loc = LOCATIONS[customConfig.locIndex];
assets = INITIAL_ASSETS.map(a => ({
...a,
owned: 0,
history: [a.price * 0.94, a.price * 0.98, a.price * 0.96, a.price * 1.02, a.price]
}));
player = {
name: ${customConfig.firstName} ${customConfig.lastName},
gender: customConfig.gender,
country: loc.country,
city: loc.cities[customConfig.cityIndex],
monthsTotal: 0,
money: 2500,
health: 92,
happy: 85,
smart: 45,
energy: 95,
fame: 0,
eduId: 'none',
studying: null,
career: REGULAR_CAREERS,
businesses: [],
logs: [Nasceste em ${loc.cities[customConfig.cityIndex]}, ${loc.country}!]
};
}
function addLog(msg) {
player.logs.unshift(msg);
if (player.logs.length > 7) player.logs.pop();
}
function advanceMonth() {
if (!player) return;
player.monthsTotal += 1;
const age = Math.floor(player.monthsTotal / 12);
if (age >= 6 && age < 18 && player.eduId === 'none' && !player.studying) {
player.studying = { id: 'school', name: 'Ensino Secundário Completo', remaining: (18 - age) * 12 };
addLog('Começaste a frequentar a escola.');
}
if (player.studying) {
player.studying.remaining -= 1;
player.smart = Math.min(100, player.smart + 0.4);
if (player.studying.remaining <= 0) {
player.eduId = player.studying.id;
addLog(Concluíste: ${player.studying.name}!);
UI.spawnText(240, 320, 'Diploma Obtido!', UI.colors.primary);
sound.levelUp();
player.studying = null;
}
}
let netIncome = 0;
if (player.career && player.career.monthlySalary > 0) {
netIncome += player.career.monthlySalary;
player.energy = Math.max(0, player.energy - (player.career.reqEnergy ? player.career.reqEnergy * 0.25 : 5));
if (player.career.fameGain) {
player.fame = Math.min(100, player.fame + player.career.fameGain);
}
}
player.businesses.forEach(b => {
const variance = 0.85 + Math.random() * 0.3;
netIncome += Math.round(b.baseMonthlyProfit * variance);
});
const livingCost = age >= 18 ? 650 + Math.floor(player.fame * 8) : 0;
const balanceChange = netIncome - livingCost;
player.money += balanceChange;
if (balanceChange !== 0 && player.monthsTotal % 3 === 0) {
const sign = balanceChange > 0 ? '+' : '';
UI.spawnText(240, 260, ${sign}${formatEuro(balanceChange)}, balanceChange > 0 ? UI.colors.success : UI.colors.danger);
}
assets.forEach(a => {
const change = (Math.random() - 0.48) * a.volatility;
a.price = Math.max(1, a.price * (1 + change));
a.history.push(a.price);
if (a.history.length > 14) a.history.shift();
});
player.energy = Math.min(100, player.energy + 6);
if (age > 55) player.health = Math.max(0, player.health - 0.45);
if (player.energy < 20) player.health = Math.max(0, player.health - 1.5);
if (player.monthsTotal % 12 === 0) {
addLog(Fizeste ${age} anos de idade!);
}
if (player.health <= 0 || age >= 100) {
sound.gameOver();
currentState = STATE.GAMEOVER;
return;
}
if (Math.random() < 0.18) {
const validEvents = RANDOM_EVENTS.filter(e => age >= e.minAge);
if (validEvents.length > 0) {
activeEvent = validEvents[Math.floor(Math.random() * validEvents.length)];
currentState = STATE.EVENT;
return;
}
}
sound.step();
}
function getNetWorth() {
let total = player.money;
assets.forEach(a => total += a.owned * a.price);
player.businesses.forEach(b => total += b.cost * 0.8);
return total;
}
function registerButton(x, y, w, h, action) {
buttons.push({ x, y, w, h, action });
}
function drawHeader(title, showBack = true, backTarget = STATE.PLAYING) {
UI.drawCard(16, 16, LOGICAL_WIDTH - 32, 64, 18, '#ffffff');
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 18px -apple-system, sans-serif';
ctx.textAlign = showBack ? 'center' : 'left';
ctx.textBaseline = 'middle';
ctx.fillText(title, showBack ? LOGICAL_WIDTH / 2 : 34, 48);
if (showBack) {
UI.drawButton(26, 28, 76, 40, 'Voltar', '#64748b', '#475569');
registerButton(26, 28, 76, 40, () => {
sound.click();
currentState = backTarget;
});
}
if (player) {
ctx.fillStyle = UI.colors.success;
ctx.font = 'bold 14px -apple-system, sans-serif';
ctx.textAlign = 'right';
ctx.fillText(formatEuro(player.money), LOGICAL_WIDTH - 32, 48);
}
}
function drawMenu() {
const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
grad.addColorStop(0, '#eef2ff');
grad.addColorStop(1, '#f8fafc');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
UI.drawCard(36, 140, LOGICAL_WIDTH - 72, 340, 28, '#ffffff');
ctx.fillStyle = '#fef3c7';
ctx.beginPath();
ctx.arc(LOGICAL_WIDTH / 2, 225, 44, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#f59e0b';
ctx.font = 'bold 42px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('★', LOGICAL_WIDTH / 2, 227);
ctx.fillStyle = UI.colors.textMain;
ctx.font = '800 34px -apple-system, sans-serif';
ctx.fillText('STAR LIFE', LOGICAL_WIDTH / 2, 305);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '500 15px -apple-system, sans-serif';
ctx.fillText('Simulador de Carreira, Fama & Investimentos', LOGICAL_WIDTH / 2, 340);
UI.drawButton(76, 395, LOGICAL_WIDTH - 152, 54, 'Nova Vida', UI.colors.primary, UI.colors.primaryDark);
registerButton(76, 395, LOGICAL_WIDTH - 152, 54, () => {
sound.click();
currentState = STATE.CUSTOMIZE;
});
UI.drawButton(76, 520, LOGICAL_WIDTH - 152, 48, sound.muted ? 'Som: Desligado' : 'Som: Ligado', '#64748b', '#475569');
registerButton(76, 520, LOGICAL_WIDTH - 152, 48, () => {
sound.muted = !sound.muted;
sound.click();
});
}
function drawCustomize() {
drawHeader('Criar Personagem', true, STATE.MENU);
UI.drawCard(20, 96, LOGICAL_WIDTH - 40, 440, 20);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '600 13px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('GÉNERO', 40, 130);
UI.drawButton(40, 145, 190, 44, 'Masculino', customConfig.gender === 'M' ? UI.colors.primary : '#94a3b8', customConfig.gender === 'M' ? UI.colors.primaryDark : '#64748b');
registerButton(40, 145, 190, 44, () => {
sound.click();
customConfig.gender = 'M';
customConfig.firstName = FIRST_NAMES_M;
});
UI.drawButton(250, 145, 190, 44, 'Feminino', customConfig.gender === 'F' ? UI.colors.fame : '#94a3b8', customConfig.gender === 'F' ? '#7c3aed' : '#64748b');
registerButton(250, 145, 190, 44, () => {
sound.click();
customConfig.gender = 'F';
customConfig.firstName = FIRST_NAMES_F;
});
ctx.fillStyle = UI.colors.textMuted;
ctx.fillText('NOME COMPLETO', 40, 225);
UI.drawCard(40, 238, 280, 46, 12, '#f8fafc', false);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 16px -apple-system, sans-serif';
ctx.fillText(${customConfig.firstName} ${customConfig.lastName}, 56, 266);
UI.drawButton(332, 238, 108, 46, 'Aleatório', '#0ea5e9', '#0284c7');
registerButton(332, 238, 108, 46, () => {
sound.click();
const pool = customConfig.gender === 'M' ? FIRST_NAMES_M : FIRST_NAMES_F;
customConfig.firstName = pool[Math.floor(Math.random() * pool.length)];
customConfig.lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
});
const loc = LOCATIONS[customConfig.locIndex];
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '600 13px -apple-system, sans-serif';
ctx.fillText('PAÍS E CIDADE NATAL', 40, 320);
UI.drawButton(40, 335, 400, 46, País: ${loc.country} (Trocar), '#475569', '#334155');
registerButton(40, 335, 400, 46, () => {
sound.click();
customConfig.locIndex = (customConfig.locIndex + 1) % LOCATIONS.length;
customConfig.cityIndex = 0;
});
UI.drawButton(40, 395, 400, 46, Cidade: ${loc.cities[customConfig.cityIndex]} (Trocar), '#475569', '#334155');
registerButton(40, 395, 400, 46, () => {
sound.click();
customConfig.cityIndex = (customConfig.cityIndex + 1) % loc.cities.length;
});
UI.drawButton(40, 570, 400, 58, 'Começar Vida', UI.colors.success, '#059669');
registerButton(40, 570, 400, 58, () => {
sound.good();
createNewPlayer();
currentState = STATE.PLAYING;
});
}
function drawPlaying() {
const age = Math.floor(player.monthsTotal / 12);
const months = player.monthsTotal % 12;
UI.drawCard(16, 16, LOGICAL_WIDTH - 32, 130, 20);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 20px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(player.name, 34, 48);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '500 13px -apple-system, sans-serif';
ctx.fillText(${age} anos e ${months} meses • ${player.city}, ${player.country}, 34, 70);
ctx.fillText(Carreira: ${player.career.title} (${formatEuro(player.career.monthlySalary)}/mês), 34, 90);
ctx.fillStyle = UI.colors.success;
ctx.font = '800 22px -apple-system, sans-serif';
ctx.fillText(formatEuro(player.money), 34, 124);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '600 12px -apple-system, sans-serif';
ctx.textAlign = 'right';
ctx.fillText(Património: ${formatEuro(getNetWorth())}, LOGICAL_WIDTH - 34, 122);
UI.drawCard(16, 158, LOGICAL_WIDTH - 32, 215, 20);
UI.drawStatBar(34, 195, 195, 10, player.health, UI.colors.danger, 'Saúde');
UI.drawStatBar(250, 195, 195, 10, player.energy, UI.colors.warning, 'Energia');
UI.drawStatBar(34, 248, 195, 10, player.happy, UI.colors.success, 'Felicidade');
UI.drawStatBar(250, 248, 195, 10, player.smart, UI.colors.primary, 'Inteligência');
UI.drawStatBar(34, 302, 411, 10, player.fame, UI.colors.fame, 'Fama & Popularidade');
const eduObj = EDUCATION_LEVELS.find(e => e.id === player.eduId);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '600 12px -apple-system, sans-serif';
ctx.textAlign = 'left';
const studyTxt = player.studying ? A estudar: ${player.studying.name} (${player.studying.remaining}m) : Formação: ${eduObj.name};
ctx.fillText(studyTxt, 34, 352);
UI.drawCard(16, 385, LOGICAL_WIDTH - 32, 185, 20);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 14px -apple-system, sans-serif';
ctx.fillText('Registo de Vida', 34, 412);
ctx.font = '13px -apple-system, sans-serif';
player.logs.forEach((log, idx) => {
ctx.fillStyle = idx === 0 ? UI.colors.textMain : UI.colors.textMuted;
ctx.fillText(• ${log}, 34, 438 + idx * 21);
});
UI.drawButton(16, 585, 218, 52, 'Carreiras & Fama', UI.colors.primary, UI.colors.primaryDark);
registerButton(16, 585, 218, 52, () => { sound.click(); currentState = STATE.CAREER_HUB; });
UI.drawButton(246, 585, 218, 52, 'Investir & Negócios', '#0ea5e9', '#0284c7');
registerButton(246, 585, 218, 52, () => { sound.click(); currentState = STATE.FINANCE_HUB; });
UI.drawButton(16, 648, 218, 52, 'Educação & Estudo', '#8b5cf6', '#7c3aed');
registerButton(16, 648, 218, 52, () => { sound.click(); currentState = STATE.EDUCATION_HUB; });
UI.drawButton(246, 648, 218, 52, 'Saúde & Lazer', '#f59e0b', '#d97706');
registerButton(246, 648, 218, 52, () => { sound.click(); currentState = STATE.LIFESTYLE_HUB; });
UI.drawButton(16, 718, LOGICAL_WIDTH - 32, 64, '+ Avançar 1 Mês', UI.colors.success, '#059669');
registerButton(16, 718, LOGICAL_WIDTH - 32, 64, () => {
advanceMonth();
});
UI.drawButton(16, 792, LOGICAL_WIDTH - 32, 46, 'Avançar 1 Ano (12 Meses)', '#334155', '#1e293b');
registerButton(16, 792, LOGICAL_WIDTH - 32, 46, () => {
for (let i = 0; i < 12; i++) {
if (currentState !== STATE.PLAYING) break;
advanceMonth();
}
});
}
function drawCareerHub() {
drawHeader('Carreiras & Fama');
const age = Math.floor(player.monthsTotal / 12);
if (age < 18) {
UI.drawCard(20, 100, LOGICAL_WIDTH - 40, 120, 18);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 16px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Precisas de ter pelo menos 18 anos para trabalhar.', LOGICAL_WIDTH / 2, 160);
return;
}
let y = 96;
const allCareers = [...REGULAR_CAREERS.slice(1), ...SPECIAL_CAREERS];
allCareers.forEach(c => {
const hasEdu = getEduIndex(player.eduId) >= getEduIndex(c.reqEdu);
const hasInt = player.smart >= c.reqInt;
const hasFame = player.fame >= c.reqFame;
const hasHealth = !c.reqHealth || player.health >= c.reqHealth;
const qualified = hasEdu && hasInt && hasFame && hasHealth;
const isCurrent = player.career.id === c.id;
UI.drawCard(16, y, LOGICAL_WIDTH - 32, 74, 14);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 15px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(c.title, 30, y + 26);
ctx.fillStyle = UI.colors.success;
ctx.font = '600 13px -apple-system, sans-serif';
ctx.fillText(${formatEuro(c.monthlySalary)}/mês • Int:${c.reqInt} Fama:${c.reqFame}, 30, y + 50);
const btnLabel = isCurrent ? 'Atual' : (qualified ? 'Candidatar' : 'Bloqueado');
UI.drawButton(LOGICAL_WIDTH - 132, y + 17, 104, 40, btnLabel, isCurrent ? '#10b981' : UI.colors.primary, UI.colors.primaryDark, !qualified || isCurrent);
if (qualified && !isCurrent) {
registerButton(LOGICAL_WIDTH - 132, y + 17, 104, 40, () => {
sound.good();
player.career = c;
addLog(Foste contratado como ${c.title}!);
UI.spawnText(240, 400, 'Novo Emprego!', UI.colors.success);
currentState = STATE.PLAYING;
});
}
y += 82;
});
}
function drawEducationHub() {
drawHeader('Educação & Formação');
let y = 100;
EDUCATION_LEVELS.slice(2).forEach(edu => {
const currentIdx = getEduIndex(player.eduId);
const targetIdx = getEduIndex(edu.id);
const alreadyDone = currentIdx >= targetIdx;
const isStudyingThis = player.studying && player.studying.id === edu.id;
const canAfford = player.money >= edu.cost && player.smart >= edu.reqInt && !player.studying && !alreadyDone;
UI.drawCard(16, y, LOGICAL_WIDTH - 32, 110, 16);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 16px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(edu.name, 32, y + 30);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '13px -apple-system, sans-serif';
ctx.fillText(Custo: ${formatEuro(edu.cost)} • Duração: ${edu.months} meses • Int. Mínima: ${edu.reqInt}, 32, y + 54);
let label = 'Matricular';
if (alreadyDone) label = 'Concluído';
else if (isStudyingThis) label = A estudar (${player.studying.remaining}m);
UI.drawButton(32, y + 66, LOGICAL_WIDTH - 64, 34, label, alreadyDone ? '#10b981' : UI.colors.primary, UI.colors.primaryDark, !canAfford);
if (canAfford) {
registerButton(32, y + 66, LOGICAL_WIDTH - 64, 34, () => {
sound.good();
player.money -= edu.cost;
player.studying = { id: edu.id, name: edu.name, remaining: edu.months };
addLog(Iniciaste ${edu.name}.);
currentState = STATE.PLAYING;
});
}
y += 126;
});
}
function drawFinanceHub() {
drawHeader('Centro Financeiro');
UI.drawCard(16, 96, LOGICAL_WIDTH - 32, 95, 18);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '600 13px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('PATRIMÓNIO LÍQUIDO TOTAL', 34, 126);
ctx.fillStyle = UI.colors.textMain;
ctx.font = '800 28px -apple-system, sans-serif';
ctx.fillText(formatEuro(getNetWorth()), 34, 162);
const menus = [
{ title: 'Criptomoedas (BTC, ETH, SOL)', sub: 'Alta volatilidade e retorno rápido', target: STATE.FINANCE_CRYPTO, c1: '#f59e0b', c2: '#d97706' },
{ title: 'Ações Tecnológicas (AAPL, NVDA, TSLA)', sub: 'Crescimento empresarial', target: STATE.FINANCE_STOCKS, c1: '#4f46e5', c2: '#3730a3' },
{ title: 'Fundos ETF (S&P 500, MSCI, Nasdaq)', sub: 'Investimento estável a longo prazo', target: STATE.FINANCE_ETFS, c1: '#10b981', c2: '#059669' },
{ title: 'Meus Negócios & Empresas', sub: ${player.businesses.length} empresa(s) ativa(s), target: STATE.BUSINESS_HUB, c1: '#8b5cf6', c2: '#7c3aed' }
];
let y = 210;
menus.forEach(m => {
UI.drawCard(16, y, LOGICAL_WIDTH - 32, 96, 18);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 16px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(m.title, 34, y + 32);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '13px -apple-system, sans-serif';
ctx.fillText(m.sub, 34, y + 54);
UI.drawButton(34, y + 64, 140, 24, 'Abrir Mercado', m.c1, m.c2);
registerButton(16, y, LOGICAL_WIDTH - 32, 96, () => {
sound.click();
currentState = m.target;
});
y += 112;
});
}
function drawAssetMarket(category, title) {
drawHeader(title, true, STATE.FINANCE_HUB);
const list = assets.filter(a => a.category === category);
let y = 100;
list.forEach(a => {
UI.drawCard(16, y, LOGICAL_WIDTH - 32, 195, 18);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 17px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(a.name, 34, y + 30);
ctx.fillStyle = UI.colors.primary;
ctx.font = 'bold 16px -apple-system, sans-serif';
ctx.textAlign = 'right';
ctx.fillText(formatEuro(a.price), LOGICAL_WIDTH - 34, y + 30);
const gx = 34, gy = y + 48, gw = LOGICAL_WIDTH - 68, gh = 65;
ctx.fillStyle = '#f8fafc';
ctx.beginPath();
ctx.roundRect(gx, gy, gw, gh, 10);
ctx.fill();
const minP = Math.min(...a.history) * 0.98;
const maxP = Math.max(...a.history) * 1.02;
const isUp = a.history[a.history.length - 1] >= a.history;
ctx.strokeStyle = isUp ? UI.colors.success : UI.colors.danger;
ctx.lineWidth = 2.5;
ctx.beginPath();
a.history.forEach((val, idx) => {
const px = gx + 10 + (idx / (a.history.length - 1)) * (gw - 20);
const py = gy + gh - 10 - ((val - minP) / (maxP - minP || 1)) * (gh - 20);
if (idx === 0) ctx.moveTo(px, py);
else ctx.lineTo(px, py);
});
ctx.stroke();
const totalVal = a.owned * a.price;
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '600 13px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(Carteira: ${a.owned.toFixed(3)} un. (${formatEuro(totalVal)}), 34, y + 135);
UI.drawButton(34, y + 148, 195, 36, 'Comprar €1.000', UI.colors.success, '#059669', player.money < 100);
if (player.money >= 100) {
registerButton(34, y + 148, 195, 36, () => {
sound.good();
const spend = Math.min(player.money, 1000);
a.owned += spend / a.price;
player.money -= spend;
UI.spawnText(130, y + 140, -${formatEuro(spend)}, UI.colors.primary);
});
}
UI.drawButton(245, y + 148, 200, 36, 'Vender Tudo', UI.colors.danger, '#dc2626', a.owned <= 0);
if (a.owned > 0) {
registerButton(245, y + 148, 200, 36, () => {
sound.good();
const gain = a.owned * a.price;
player.money += gain;
a.owned = 0;
UI.spawnText(340, y + 140, +${formatEuro(gain)}, UI.colors.success);
});
}
y += 210;
});
}
function drawBusinessHub() {
drawHeader('Negócios Próprios', true, STATE.FINANCE_HUB);
let y = 100;
BUSINESS_TYPES.forEach(b => {
const ownedCount = player.businesses.filter(pb => pb.id === b.id).length;
const canBuy = player.money >= b.cost;
UI.drawCard(16, y, LOGICAL_WIDTH - 32, 118, 16);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 16px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(${b.name} (${ownedCount}x), 32, y + 30);
ctx.fillStyle = UI.colors.success;
ctx.font = '600 13px -apple-system, sans-serif';
ctx.fillText(Lucro estimado: +${formatEuro(b.baseMonthlyProfit)}/mês, 32, y + 52);
UI.drawButton(32, y + 68, LOGICAL_WIDTH - 64, 36, Abrir Empresa (${formatEuro(b.cost)}), UI.colors.primary, UI.colors.primaryDark, !canBuy);
if (canBuy) {
registerButton(32, y + 68, LOGICAL_WIDTH - 64, 36, () => {
sound.levelUp();
player.money -= b.cost;
player.businesses.push({ ...b });
addLog(Abriste uma ${b.name}!);
UI.spawnText(240, y + 60, 'Empresa Aberta!', UI.colors.success);
});
}
y += 132;
});
}
function drawLifestyleHub() {
drawHeader('Saúde, Estudo & Lazer');
const actions = [
{ title: 'Ginásio & Check-up Médico', desc: '+15 Saúde, +5 Energia (-€250)', cost: 250, fn: () => { player.health = Math.min(100, player.health + 15); player.energy = Math.min(100, player.energy + 5); } },
{ title: 'Férias & Lazer', desc: '+20 Felicidade, +25 Energia (-€600)', cost: 600, fn: () => { player.happy = Math.min(100, player.happy + 20); player.energy = Math.min(100, player.energy + 25); } },
{ title: 'Ler Livros & Cursos Online', desc: '+8 Inteligência (-€150)', cost: 150, fn: () => { player.smart = Math.min(100, player.smart + 8); } },
{ title: 'Campanha nas Redes Sociais', desc: '+8 Fama & Popularidade (-€800)', cost: 800, fn: () => { player.fame = Math.min(100, player.fame + 8); } }
];
let y = 104;
actions.forEach(act => {
const ok = player.money >= act.cost;
UI.drawCard(16, y, LOGICAL_WIDTH - 32, 115, 18);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 16px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(act.title, 34, y + 32);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '13px -apple-system, sans-serif';
ctx.fillText(act.desc, 34, y + 54);
UI.drawButton(34, y + 68, LOGICAL_WIDTH - 68, 36, Realizar (${formatEuro(act.cost)}), UI.colors.primary, UI.colors.primaryDark, !ok);
if (ok) {
registerButton(34, y + 68, LOGICAL_WIDTH - 68, 36, () => {
sound.good();
player.money -= act.cost;
act.fn();
addLog(Realizaste: ${act.title}.);
UI.spawnText(240, y + 50, 'Atributos Melhorados!', UI.colors.success);
});
}
y += 130;
});
}
function drawEventModal() {
drawPlaying();
ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
UI.drawCard(28, 220, LOGICAL_WIDTH - 56, 360, 24, '#ffffff');
ctx.fillStyle = UI.colors.primary;
ctx.font = 'bold 13px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('ACONTECIMENTO DO MÊS', LOGICAL_WIDTH / 2, 260);
ctx.fillStyle = UI.colors.textMain;
ctx.font = '800 22px -apple-system, sans-serif';
ctx.fillText(activeEvent.title, LOGICAL_WIDTH / 2, 296);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '14px -apple-system, sans-serif';
ctx.fillText(activeEvent.desc, LOGICAL_WIDTH / 2, 336);
let y = 390;
activeEvent.choices.forEach((choice, i) => {
UI.drawButton(48, y, LOGICAL_WIDTH - 96, 52, choice.text, i === 0 ? UI.colors.primary : '#475569', i === 0 ? UI.colors.primaryDark : '#334155');
registerButton(48, y, LOGICAL_WIDTH - 96, 52, () => {
sound.good();
const res = choice.effect(player);
addLog(res);
activeEvent = null;
currentState = STATE.PLAYING;
});
y += 68;
});
}
function drawGameOver() {
ctx.fillStyle = '#0f172a';
ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
UI.drawCard(32, 180, LOGICAL_WIDTH - 64, 420, 24, '#ffffff');
ctx.fillStyle = UI.colors.danger;
ctx.font = '800 28px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('FIM DA JORNADA', LOGICAL_WIDTH / 2, 245);
const age = Math.floor(player.monthsTotal / 12);
ctx.fillStyle = UI.colors.textMain;
ctx.font = 'bold 18px -apple-system, sans-serif';
ctx.fillText(${player.name} (${age} anos), LOGICAL_WIDTH / 2, 295);
ctx.fillStyle = UI.colors.textMuted;
ctx.font = '15px -apple-system, sans-serif';
ctx.fillText(Património Final: ${formatEuro(getNetWorth())}, LOGICAL_WIDTH / 2, 340);
ctx.fillText(Fama Alcançada: ${Math.round(player.fame)}%, LOGICAL_WIDTH / 2, 370);
ctx.fillText(Última Carreira: ${player.career.title}, LOGICAL_WIDTH / 2, 400);
UI.drawButton(64, 480, LOGICAL_WIDTH - 128, 56, 'Voltar ao Menu', UI.colors.primary, UI.colors.primaryDark);
registerButton(64, 480, LOGICAL_WIDTH - 128, 56, () => {
sound.click();
currentState = STATE.MENU;
});
}
function render() {
buttons = [];
ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
ctx.fillStyle = UI.colors.bg;
ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
switch (currentState) {
case STATE.MENU: drawMenu(); break;
case STATE.CUSTOMIZE: drawCustomize(); break;
case STATE.PLAYING: drawPlaying(); break;
case STATE.CAREER_HUB: drawCareerHub(); break;
case STATE.EDUCATION_HUB: drawEducationHub(); break;
case STATE.FINANCE_HUB: drawFinanceHub(); break;
case STATE.FINANCE_CRYPTO: drawAssetMarket('CRYPTO', 'Mercado Cripto'); break;
case STATE.FINANCE_STOCKS: drawAssetMarket('STOCK', 'Mercado de Ações'); break;
case STATE.FINANCE_ETFS: drawAssetMarket('ETF', 'Fundos ETF'); break;
case STATE.BUSINESS_HUB: drawBusinessHub(); break;
case STATE.LIFESTYLE_HUB: drawLifestyleHub(); break;
case STATE.EVENT: drawEventModal(); break;
case STATE.GAMEOVER: drawGameOver(); break;
}
UI.updateAndDrawEffects();
requestAnimationFrame(render);
}
canvas.addEventListener('pointerdown', (e) => {
const rect = canvas.getBoundingClientRect();
const scaleX = LOGICAL_WIDTH / rect.width;
const scaleY = LOGICAL_HEIGHT / rect.height;
const x = (e.clientX - rect.left) * scaleX;
const y = (e.clientY - rect.top) * scaleY;
for (let i = buttons.length - 1; i >= 0; i--) {
const b = buttons[i];
if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
b.action();
break;
}
}
});
requestAnimationFrame(render);
