const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const LOGICAL_WIDTH = 480;
const LOGICAL_HEIGHT = 860;
canvas.width = LOGICAL_WIDTH;
canvas.height = LOGICAL_HEIGHT;

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
    CAREER_EDU: 'CAREER_EDU',
    CAREER_JOBS: 'CAREER_JOBS',
    CAREER_SPECIAL: 'CAREER_SPECIAL',
    BUSINESS_HUB: 'BUSINESS_HUB',
    PEOPLE_HUB: 'PEOPLE_HUB',
    NEEDS_ACTION: 'NEEDS_ACTION',
    EVENT_MODAL: 'EVENT_MODAL',
    GAMEOVER: 'GAMEOVER'
};

let currentState = STATE.MENU;
let highScore = parseInt(localStorage.getItem('starLifeWhiteHighScore')) || 0;
let buttons = [];
let selectedButtonIndex = 0;
let animTime = 0;
let activeEvent = null;
let deathReason = '';

let customSetup = {
    gender: 'M',
    nameIndex: 0,
    lastNameIndex: 0,
    countryIndex: 0,
    cityIndex: 0,
    customName: ''
};

let marketAssets = [];
let player = {};

function getSetupName() {
    if (customSetup.customName.trim().length > 0) return customSetup.customName.trim();
    const list = customSetup.gender === 'M' ? FIRST_NAMES_M : FIRST_NAMES_F;
    return `${list[customSetup.nameIndex]} ${LAST_NAMES[customSetup.lastNameIndex]}`;
}

function initNewGame() {
    const loc = LOCATIONS[customSetup.countryIndex];
    const fullName = getSetupName();

    marketAssets = INITIAL_ASSETS.map(a => ({
        ...a,
        ownedQty: 0,
        totalInvested: 0
    }));

    player = {
        name: fullName,
        gender: customSetup.gender,
        country: loc.country,
        city: loc.cities[customSetup.cityIndex],
        totalMonths: 0,
        health: 92,
        happy: 88,
        energy: 95,
        int: 35,
        fame: 0,
        money: 1500,
        eduIndex: 0,
        studyingTargetIndex: -1,
        studyingMonthsLeft: 0,
        career: REGULAR_CAREERS[0],
        businesses: [],
        parents: {
            father: `${FIRST_NAMES_M[(customSetup.nameIndex + 2) % FIRST_NAMES_M.length]} ${LAST_NAMES[customSetup.lastNameIndex]}`,
            mother: `${FIRST_NAMES_F[(customSetup.nameIndex + 3) % FIRST_NAMES_F.length]} ${LAST_NAMES[customSetup.lastNameIndex]}`,
            relation: 85
        },
        partner: null,
        isPregnant: false,
        pregnancyMonths: 0,
        children: [],
        logs: [
            `Nasceste em ${loc.cities[customSetup.cityIndex]}, ${loc.country}!`,
            `Bem-vindo(a) ao Star Life, ${fullName}.`
        ],
        score: 0,
        difficultyLevel: 1
    };
    updateScore();
}

function getAgeYears() {
    return Math.floor(player.totalMonths / 12);
}

function getAgeMonthsRemainder() {
    return player.totalMonths % 12;
}

function addLog(msg) {
    const y = getAgeYears();
    const m = getAgeMonthsRemainder();
    player.logs.unshift(`[${y}a ${m}m] ${msg}`);
    if (player.logs.length > 5) {
        player.logs.pop();
    }
}
function getPortfolioValue() {
    return marketAssets.reduce((acc, item) => acc + (item.ownedQty * item.price), 0);
}

function getPortfolioInvested() {
    return marketAssets.reduce((acc, item) => acc + item.totalInvested, 0);
}

function getBusinessesValue() {
    return player.businesses.reduce((acc, b) => acc + b.cost, 0);
}

function getMonthlyBusinessIncome() {
    return player.businesses.reduce((acc, b) => acc + Math.floor(b.baseMonthlyProfit * (1 + b.level * 0.25)), 0);
}

function updateScore() {
    const netWorth = player.money + getPortfolioValue() + getBusinessesValue();
    const worthPts = Math.max(0, Math.floor(netWorth / 300));
    const statsPts = Math.floor((player.health + player.happy + player.energy + player.int + player.fame * 4) * 2);
    const timePts = player.totalMonths * 4;
    player.score = worthPts + statsPts + timePts;

    if (player.score > highScore) {
        highScore = player.score;
        localStorage.setItem('starLifeWhiteHighScore', highScore);
    }
}
function advanceMonths(monthsCount) {
    sound.step();

    for (let step = 0; step < monthsCount; step++) {
        player.totalMonths += 1;
        const ageYears = getAgeYears();
        player.difficultyLevel = 1 + Math.floor(ageYears / 15);

        if (player.totalMonths === 72 && player.eduIndex === 0 && player.studyingTargetIndex === -1) {
            player.studyingTargetIndex = 1;
            player.studyingMonthsLeft = 144;
            addLog('Entraste na escola!');
        }

        if (player.studyingTargetIndex !== -1) {
            player.studyingMonthsLeft -= 1;
            if (player.totalMonths % 3 === 0) {
                player.int = Math.min(100, player.int + 1);
            }
            if (player.studyingMonthsLeft <= 0) {
                player.eduIndex = player.studyingTargetIndex;
                const finishedName = EDUCATION_LEVELS[player.eduIndex].name;
                player.studyingTargetIndex = -1;
                sound.levelUp();
                addLog(`Concluíste: ${finishedName}!`);
            }
        }

        const bizIncome = getMonthlyBusinessIncome();
        const totalIncome = player.career.monthlySalary + bizIncome;
        player.money += totalIncome;

        if (player.career.fameGain) {
            player.fame = Math.min(100, player.fame + (player.career.fameGain * 0.5));
        }

        if (ageYears >= 18) {
            const baseExpenses = 550 + (ageYears * 12) + (player.children.length * 320);
            player.money -= baseExpenses;
            if (player.money < 0) {
                player.happy = Math.max(0, player.happy - 2);
                player.health = Math.max(0, player.health - 1);
            }
        }

        marketAssets.forEach(asset => {
            const changePercent = (Math.random() * 2 - 0.94) * asset.volatility;
            asset.price = Math.max(1, Number((asset.price * (1 + changePercent)).toFixed(2)));
        });

        if (player.isPregnant) {
            player.pregnancyMonths += 1;
            if (player.pregnancyMonths >= 9) {
                player.isPregnant = false;
                player.pregnancyMonths = 0;
                const babyGender = Math.random() > 0.5 ? 'M' : 'F';
                const babyName = babyGender === 'M'
                    ? FIRST_NAMES_M[Math.floor(Math.random() * FIRST_NAMES_M.length)]
                    : FIRST_NAMES_F[Math.floor(Math.random() * FIRST_NAMES_F.length)];
                player.children.push({ name: babyName, gender: babyGender, ageMonths: 0 });
                player.happy = Math.min(100, player.happy + 20);
                sound.levelUp();
                addLog(`Nasceu o teu bebé: ${babyName}!`);
            }
        }

        player.children.forEach(c => c.ageMonths += 1);

        player.energy = Math.max(0, player.energy - (2 + Math.floor(player.difficultyLevel * 0.5)));
        player.happy = Math.max(0, player.happy - 1);
        if (ageYears > 50) {
            player.health = Math.max(0, player.health - 0.6);
        }
        if (player.energy < 15) {
            player.health = Math.max(0, player.health - 1.5);
        }

        if (player.health <= 0) {
            deathReason = 'A tua saúde chegou a zero.';
            currentState = STATE.GAMEOVER;
            selectedButtonIndex = 0;
            sound.gameOver();
            updateScore();
            return;
        }
        if (ageYears >= 110) {
            deathReason = 'Chegaste aos 110 anos após uma vida extraordinária!';
            currentState = STATE.GAMEOVER;
            selectedButtonIndex = 0;
            sound.gameOver();
            updateScore();
            return;
        }
    }

    updateScore();

    if (getAgeYears() >= 5 && Math.random() < 0.24) {
        const valid = RANDOM_EVENTS.filter(e => getAgeYears() >= e.minAge);
        if (valid.length > 0) {
            activeEvent = valid[Math.floor(Math.random() * valid.length)];
            currentState = STATE.EVENT_MODAL;
            selectedButtonIndex = 0;
        }
    }
}
function drawRoundRect(x, y, w, h, r, fill, stroke = null, lineWidth = 1.5) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = stroke;
        ctx.stroke();
    }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawAvatar(cx, cy, gender, ageYears, fame, happy, health, careerId) {
    const bounce = Math.sin(animTime * 3) * 2;
    const y = cy + bounce;

    if (fame >= 45) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        drawStar(cx, y, 8, 52, 28, '#f59e0b');
        ctx.restore();
    }

    let shirt = gender === 'M' ? '#2563eb' : '#db2777';
    if (careerId === 'athlete') shirt = '#16a34a';
    if (careerId === 'actor' || careerId === 'superstar') shirt = '#eab308';
    if (careerId === 'surgeon') shirt = '#0ea5e9';

    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.arc(cx, y + 40, 26, Math.PI, 0);
    ctx.fill();

    const r = ageYears < 6 ? 20 : 23;
    ctx.fillStyle = health < 30 ? '#cbd5e1' : '#fed7aa';
    ctx.beginPath();
    ctx.arc(cx, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (ageYears >= 2) {
        ctx.fillStyle = ageYears >= 60 ? '#94a3b8' : '#1e293b';
        ctx.beginPath();
        ctx.arc(cx, y - 5, r + 1, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fill();
        if (gender === 'F') {
            ctx.fillRect(cx - r, y - 4, 6, 22);
            ctx.fillRect(cx + r - 6, y - 4, 6, 22);
        }
    }

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx - 7, y - 2, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 7, y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (happy >= 55) {
        ctx.arc(cx, y + 4, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    } else {
        ctx.moveTo(cx - 6, y + 7);
        ctx.lineTo(cx + 6, y + 7);
    }
    ctx.stroke();
}
function addButton(x, y, w, h, label, sublabel, bgColor, textColor, action, disabled = false) {
    buttons.push({ x, y, w, h, label, sublabel, bgColor, textColor, action, disabled });
}

function drawButtons() {
    buttons.forEach((btn, idx) => {
        const isSel = idx === selectedButtonIndex;
        const fill = btn.disabled ? '#e2e8f0' : btn.bgColor;
        const stroke = isSel ? '#0f172a' : (btn.disabled ? '#cbd5e1' : 'rgba(15,23,42,0.12)');
        drawRoundRect(btn.x, btn.y, btn.w, btn.h, 11, fill, stroke, isSel ? 2.5 : 1.5);

        ctx.textAlign = 'center';
        ctx.fillStyle = btn.disabled ? '#94a3b8' : btn.textColor;
        ctx.font = btn.sublabel ? 'bold 14px sans-serif' : 'bold 15px sans-serif';
        const ty = btn.sublabel ? btn.y + btn.h / 2 - 2 : btn.y + btn.h / 2 + 5;
        ctx.fillText(btn.label, btn.x + btn.w / 2, ty);

        if (btn.sublabel) {
            ctx.font = '11px sans-serif';
            ctx.fillStyle = btn.disabled ? '#94a3b8' : (btn.textColor === '#ffffff' ? '#f1f5f9' : '#475569');
            ctx.fillText(btn.sublabel, btn.x + btn.w / 2, btn.y + btn.h / 2 + 14);
        }
    });
}

function renderMenu() {
    buttons = [];

    const pulse = 1 + Math.sin(animTime * 3) * 0.05;
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, 180);
    ctx.scale(pulse, pulse);
    drawStar(0, 0, 5, 72, 34, '#f59e0b');
    drawStar(0, 0, 5, 48, 22, '#fde047');
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 50px sans-serif';
    ctx.fillText('STAR LIFE', LOGICAL_WIDTH / 2, 305);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText('Simulador de Vida, Finanças, Negócios & Fama', LOGICAL_WIDTH / 2, 336);

    drawRoundRect(65, 375, 350, 74, 14, '#f8fafc', '#cbd5e1', 1.5);
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('RECORDE DE PONTUAÇÃO GUARDADO', LOGICAL_WIDTH / 2, 403);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 26px sans-serif';
    ctx.fillText(`${highScore.toLocaleString('pt-PT')} PTS`, LOGICAL_WIDTH / 2, 434);

    addButton(80, 495, 320, 66, 'CRIAR PERSONAGEM & JOGAR', 'Personalizar Nome, Sexo, País e Cidade', '#2563eb', '#ffffff', () => {
        sound.click();
        currentState = STATE.CUSTOMIZE;
        selectedButtonIndex = 0;
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Fundo Branco • Web Audio API • 100% Offline Ready', LOGICAL_WIDTH / 2, 620);

    drawButtons();
}
function renderCustomize() {
    buttons = [];

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 26px sans-serif';
    ctx.fillText('PERSONALIZAR PERSONAGEM', LOGICAL_WIDTH / 2, 54);

    drawRoundRect(30, 74, LOGICAL_WIDTH - 60, 130, 16, '#f8fafc', '#cbd5e1', 1.5);
    drawAvatar(95, 132, customSetup.gender, 20, 0, 90, 95, 'unemployed');

    const loc = LOCATIONS[customSetup.countryIndex];
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(getSetupName(), 155, 114);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Sexo: ${customSetup.gender === 'M' ? 'Masculino' : 'Feminino'}`, 155, 140);
    ctx.fillText(`Origem: ${loc.cities[customSetup.cityIndex]}, ${loc.country}`, 155, 164);

    addButton(30, 224, 205, 56, 'Sexo: Masculino', null, customSetup.gender === 'M' ? '#2563eb' : '#f1f5f9', customSetup.gender === 'M' ? '#ffffff' : '#0f172a', () => {
        sound.click();
        customSetup.gender = 'M';
        customSetup.customName = '';
    });

    addButton(245, 224, 205, 56, 'Sexo: Feminino', null, customSetup.gender === 'F' ? '#db2777' : '#f1f5f9', customSetup.gender === 'F' ? '#ffffff' : '#0f172a', () => {
        sound.click();
        customSetup.gender = 'F';
        customSetup.customName = '';
    });

    addButton(30, 296, 205, 60, 'Mudar Nome', 'Gerar nome aleatório', '#f8fafc', '#0f172a', () => {
        sound.click();
        customSetup.customName = '';
        customSetup.nameIndex = (customSetup.nameIndex + 1) % FIRST_NAMES_M.length;
        customSetup.lastNameIndex = (customSetup.lastNameIndex + 1) % LAST_NAMES.length;
    });

    addButton(245, 296, 205, 60, 'Escrever Nome', 'Digitar nome próprio', '#f8fafc', '#0f172a', () => {
        sound.click();
        const typed = prompt('Escreve o nome completo do teu personagem:', getSetupName());
        if (typed && typed.trim().length > 0) {
            customSetup.customName = typed.trim();
        }
    });

    addButton(30, 374, LOGICAL_WIDTH - 60, 62, `País: ${loc.country}`, 'Toca para alternar país', '#f8fafc', '#0f172a', () => {
        sound.click();
        customSetup.countryIndex = (customSetup.countryIndex + 1) % LOCATIONS.length;
        customSetup.cityIndex = 0;
    });

    addButton(30, 452, LOGICAL_WIDTH - 60, 62, `Cidade: ${loc.cities[customSetup.cityIndex]}`, 'Toca para alternar cidade', '#f8fafc', '#0f172a', () => {
        sound.click();
        customSetup.cityIndex = (customSetup.cityIndex + 1) % loc.cities.length;
    });

    addButton(30, 550, LOGICAL_WIDTH - 60, 68, 'INICIAR VIDA AGORA', 'Começar aos 0 anos e 0 meses', '#16a34a', '#ffffff', () => {
        sound.good();
        initNewGame();
        currentState = STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    addButton(110, 640, 260, 48, 'Voltar ao Menu', null, '#e2e8f0', '#334155', () => {
        sound.click();
        currentState = STATE.MENU;
        selectedButtonIndex = 0;
    });

    drawButtons();
}
function drawMiniBar(x, y, w, label, val, color) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(label, x, y - 4);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`${Math.round(val)}%`, x + w, y - 4);

    drawRoundRect(x, y, w, 9, 4, '#e2e8f0');
    const fw = Math.max(0, Math.min(w, (val / 100) * w));
    if (fw > 0) drawRoundRect(x, y, fw, 9, 4, color);
}

function renderPlaying() {
    buttons = [];

    drawRoundRect(14, 12, LOGICAL_WIDTH - 28, 48, 12, '#f8fafc', '#cbd5e1', 1.5);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`SCORE: ${player.score.toLocaleString('pt-PT')}`, 26, 33);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${player.city}, ${player.country}`, 26, 50);

    ctx.textAlign = 'right';
    ctx.fillStyle = player.money >= 0 ? '#16a34a' : '#dc2626';
    ctx.font = '900 17px sans-serif';
    ctx.fillText(`€${Math.round(player.money).toLocaleString('pt-PT')}`, LOGICAL_WIDTH - 26, 35);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    const netWorth = player.money + getPortfolioValue() + getBusinessesValue();
    ctx.fillText(`Património: €${Math.round(netWorth).toLocaleString('pt-PT')}`, LOGICAL_WIDTH - 26, 50);

    drawRoundRect(14, 68, LOGICAL_WIDTH - 28, 134, 14, '#f8fafc', '#cbd5e1', 1.5);
    drawAvatar(72, 126, player.gender, getAgeYears(), player.fame, player.happy, player.health, player.career.id);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(player.name, 130, 96);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Idade: ${getAgeYears()} anos e ${getAgeMonthsRemainder()} meses`, 130, 118);

    ctx.fillStyle = '#475569';
    ctx.font = '13px sans-serif';
    const eduStr = player.studyingTargetIndex !== -1
        ? `A estudar (${player.studyingMonthsLeft}m rest.)`
        : EDUCATION_LEVELS[player.eduIndex].name;
    ctx.fillText(`Educação: ${eduStr}`, 130, 140);
    ctx.fillText(`Carreira: ${player.career.title}`, 130, 160);

    if (player.isPregnant) {
        ctx.fillStyle = '#db2777';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`Grávida (${player.pregnancyMonths}/9 meses)`, 130, 182);
    } else if (player.career.monthlySalary > 0) {
        ctx.fillStyle = '#16a34a';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`Salário: €${player.career.monthlySalary.toLocaleString('pt-PT')}/mês`, 130, 182);
    }

    drawRoundRect(14, 210, LOGICAL_WIDTH - 28, 138, 14, '#f8fafc', '#cbd5e1', 1.5);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('NECESSIDADES & ATRIBUTOS', 28, 230);

    drawMiniBar(28, 255, 198, 'SAÚDE', player.health, '#ef4444');
    drawMiniBar(250, 255, 198, 'FELICIDADE', player.happy, '#f59e0b');
    drawMiniBar(28, 294, 198, 'ENERGIA', player.energy, '#10b981');
    drawMiniBar(250, 294, 198, 'INTELIGÊNCIA', player.int, '#3b82f6');
    drawMiniBar(28, 332, 420, 'FAMA (STAR)', player.fame, '#eab308');
    drawRoundRect(14, 356, LOGICAL_WIDTH - 28, 134, 14, '#f8fafc', '#cbd5e1', 1.5);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('REGISTO DE ACONTECIMENTOS', 28, 375);

    player.logs.forEach((log, idx) => {
        ctx.fillStyle = idx === 0 ? '#0f172a' : '#64748b';
        ctx.font = idx === 0 ? 'bold 12px sans-serif' : '11px sans-serif';
        const txt = log.length > 58 ? log.substring(0, 55) + '...' : log;
        ctx.fillText(`• ${txt}`, 26, 396 + idx * 20);
    });

    const timeY = 502;
    const timeW = 144;
    addButton(14, timeY, timeW, 56, '+1 MÊS', 'Avançar 1 mês', '#16a34a', '#ffffff', () => advanceMonths(1));
    addButton(168, timeY, timeW, 56, '+3 MESES', 'Avançar trimestre', '#15803d', '#ffffff', () => advanceMonths(3));
    addButton(322, timeY, timeW, 56, '+6 MESES', 'Avançar semestre', '#166534', '#ffffff', () => advanceMonths(6));

    const row1Y = 572;
    addButton(14, row1Y, 220, 62, 'FINANÇAS', 'Cripto, Ações, ETFs & Análise', '#2563eb', '#ffffff', () => {
        sound.click();
        currentState = STATE.FINANCE_HUB;
        selectedButtonIndex = 0;
    });

    addButton(246, row1Y, 220, 62, 'CARREIRA', 'Educação, Empregos & Especial', '#7c3aed', '#ffffff', () => {
        sound.click();
        currentState = STATE.CAREER_HUB;
        selectedButtonIndex = 0;
    });

    const row2Y = 644;
    addButton(14, row2Y, 144, 62, 'NEGÓCIOS', 'Criar Empresas', '#0284c7', '#ffffff', () => {
        sound.click();
        currentState = STATE.BUSINESS_HUB;
        selectedButtonIndex = 0;
    }, getAgeYears() < 18);

    addButton(168, row2Y, 144, 62, 'PESSOAS', 'Pais, Amor & Filhos', '#db2777', '#ffffff', () => {
        sound.click();
        currentState = STATE.PEOPLE_HUB;
        selectedButtonIndex = 0;
    });

    addButton(322, row2Y, 144, 62, 'CUIDADOS', 'Cuidar Necessidades', '#d97706', '#ffffff', () => {
        sound.click();
        currentState = STATE.NEEDS_ACTION;
        selectedButtonIndex = 0;
    });

    addButton(14, 718, 220, 42, sound.muted ? 'Som: Desligado' : 'Som: Ligado', null, '#e2e8f0', '#334155', () => {
        sound.muted = !sound.muted;
        if (!sound.muted) sound.click();
    });

    addButton(246, 718, 220, 42, 'Menu Inicial', null, '#e2e8f0', '#334155', () => {
        sound.click();
        currentState = STATE.MENU;
        selectedButtonIndex = 0;
    });

    drawButtons();
}
function renderFinanceHub() {
    buttons = [];
    drawRoundRect(16, 20, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 40, 18, '#ffffff', '#2563eb', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('CENTRO FINANCEIRO', LOGICAL_WIDTH / 2, 65);

    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Saldo Disponível: €${Math.round(player.money).toLocaleString('pt-PT')}`, LOGICAL_WIDTH / 2, 95);

    addButton(40, 130, LOGICAL_WIDTH - 80, 76, 'CRIPTOMOEDAS', 'Bitcoin, Ethereum, Solana (Alta Volatilidade)', '#f59e0b', '#ffffff', () => {
        sound.click();
        currentState = STATE.FINANCE_CRYPTO;
        selectedButtonIndex = 0;
    });

    addButton(40, 222, LOGICAL_WIDTH - 80, 76, 'AÇÕES DA BOLSA', 'Apple, NVIDIA, Tesla (Crescimento)', '#2563eb', '#ffffff', () => {
        sound.click();
        currentState = STATE.FINANCE_STOCKS;
        selectedButtonIndex = 0;
    });

    addButton(40, 314, LOGICAL_WIDTH - 80, 76, 'ETFs & FUNDOS ÍNDICE', 'S&P 500, MSCI World, Nasdaq 100 (Estável)', '#0d9488', '#ffffff', () => {
        sound.click();
        currentState = STATE.FINANCE_ETFS;
        selectedButtonIndex = 0;
    });

    addButton(40, 406, LOGICAL_WIDTH - 80, 76, 'ANÁLISE DO SISTEMA FINANCEIRO', 'Relatório completo de ativos, lucros e fluxos', '#0f172a', '#ffffff', () => {
        sound.click();
        currentState = STATE.FINANCE_ANALYSIS;
        selectedButtonIndex = 0;
    });

    addButton(90, 720, 300, 54, 'VOLTAR AO JOGO', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    drawButtons();
}

function renderAssetMarket(category, title, accentColor) {
    buttons = [];
    drawRoundRect(16, 20, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 40, 18, '#ffffff', accentColor, 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px sans-serif';
    ctx.fillText(title, LOGICAL_WIDTH / 2, 62);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Saldo: €${Math.round(player.money).toLocaleString('pt-PT')}`, LOGICAL_WIDTH / 2, 88);

    const list = marketAssets.filter(a => a.category === category);
    let yPos = 115;

    list.forEach(asset => {
        drawRoundRect(30, yPos, LOGICAL_WIDTH - 60, 155, 14, '#f8fafc', '#cbd5e1', 1.5);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(asset.name, 46, yPos + 28);

        ctx.textAlign = 'right';
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`€${asset.price.toLocaleString('pt-PT')}`, LOGICAL_WIDTH - 46, yPos + 28);

        const currentVal = asset.ownedQty * asset.price;
        const profit = currentVal - asset.totalInvested;

        ctx.textAlign = 'left';
        ctx.fillStyle = '#475569';
        ctx.font = '13px sans-serif';
        ctx.fillText(`Posição: ${asset.ownedQty.toFixed(2)} un. (€${Math.round(currentVal).toLocaleString('pt-PT')})`, 46, yPos + 54);

        ctx.fillStyle = profit >= 0 ? '#16a34a' : '#dc2626';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`Lucro/Prejuízo: ${profit >= 0 ? '+' : ''}€${Math.round(profit).toLocaleString('pt-PT')}`, 46, yPos + 74);

        addButton(44, yPos + 90, 122, 48, 'Comprar €500', null, '#16a34a', '#ffffff', () => {
            if (player.money >= 500) {
                sound.good();
                player.money -= 500;
                asset.ownedQty += 500 / asset.price;
                asset.totalInvested += 500;
                updateScore();
            }
        }, player.money < 500);

        addButton(176, yPos + 90, 130, 48, 'Comprar €2.500', null, '#15803d', '#ffffff', () => {
            if (player.money >= 2500) {
                sound.good();
                player.money -= 2500;
                asset.ownedQty += 2500 / asset.price;
                asset.totalInvested += 2500;
                updateScore();
            }
        }, player.money < 2500);

        addButton(316, yPos + 90, 120, 48, 'Vender Tudo', null, '#dc2626', '#ffffff', () => {
            if (asset.ownedQty > 0) {
                sound.good();
                const sale = asset.ownedQty * asset.price;
                player.money += sale;
                addLog(`Vendeste ${asset.name} por €${Math.round(sale).toLocaleString('pt-PT')}.`);
                asset.ownedQty = 0;
                asset.totalInvested = 0;
                updateScore();
            }
        }, asset.ownedQty <= 0);

        yPos += 172;
    });

    addButton(90, 725, 300, 52, 'VOLTAR A FINANÇAS', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.FINANCE_HUB;
        selectedButtonIndex = 0;
    });

    drawButtons();
}
function renderFinanceAnalysis() {
    buttons = [];
    drawRoundRect(16, 20, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 40, 18, '#ffffff', '#0f172a', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px sans-serif';
    ctx.fillText('ANÁLISE FINANCEIRA GLOBAL', LOGICAL_WIDTH / 2, 65);

    const portVal = getPortfolioValue();
    const portInv = getPortfolioInvested();
    const portProfit = portVal - portInv;
    const bizVal = getBusinessesValue();
    const totalWealth = player.money + portVal + bizVal;
    const monthlyIn = player.career.monthlySalary + getMonthlyBusinessIncome();
    const monthlyOut = getAgeYears() >= 18 ? (550 + getAgeYears() * 12 + player.children.length * 320) : 0;

    drawRoundRect(32, 92, LOGICAL_WIDTH - 64, 340, 14, '#f8fafc', '#cbd5e1', 1.5);

    const rows = [
        { k: 'Dinheiro em Conta:', v: `€${Math.round(player.money).toLocaleString('pt-PT')}`, c: '#0f172a' },
        { k: 'Valor em Cripto/Ações/ETFs:', v: `€${Math.round(portVal).toLocaleString('pt-PT')}`, c: '#2563eb' },
        { k: 'Lucro/Prejuízo Investimentos:', v: `${portProfit >= 0 ? '+' : ''}€${Math.round(portProfit).toLocaleString('pt-PT')}`, c: portProfit >= 0 ? '#16a34a' : '#dc2626' },
        { k: 'Valor das Empresas:', v: `€${Math.round(bizVal).toLocaleString('pt-PT')}`, c: '#0284c7' },
        { k: 'PATRIMÓNIO LÍQUIDO TOTAL:', v: `€${Math.round(totalWealth).toLocaleString('pt-PT')}`, c: '#16a34a' },
        { k: 'Receita Mensal (Salário+Emp.):', v: `+€${monthlyIn.toLocaleString('pt-PT')}/mês`, c: '#16a34a' },
        { k: 'Despesa Mensal Estimada:', v: `-€${monthlyOut.toLocaleString('pt-PT')}/mês`, c: '#dc2626' }
    ];

    rows.forEach((r, i) => {
        const y = 132 + i * 44;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#475569';
        ctx.font = '14px sans-serif';
        ctx.fillText(r.k, 48, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = r.c;
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(r.v, LOGICAL_WIDTH - 48, y);
    });

    const safeTotal = Math.max(1, totalWealth);
    const cashW = Math.max(0, (player.money / safeTotal) * (LOGICAL_WIDTH - 64));
    const invW = Math.max(0, (portVal / safeTotal) * (LOGICAL_WIDTH - 64));
    const bizW = Math.max(0, (bizVal / safeTotal) * (LOGICAL_WIDTH - 64));

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('DISTRIBUIÇÃO DE CAPITAL', 32, 468);

    drawRoundRect(32, 480, LOGICAL_WIDTH - 64, 24, 8, '#e2e8f0');
    if (cashW > 0) {
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(32, 480, cashW, 24);
    }
    if (invW > 0) {
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(32 + cashW, 480, invW, 24);
    }
    if (bizW > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(32 + cashW + invW, 480, bizW, 24);
    }

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#16a34a';
    ctx.fillText('■ Liquidez', 32, 526);
    ctx.fillStyle = '#2563eb';
    ctx.fillText('■ Mercados', 140, 526);
    ctx.fillStyle = '#d97706';
    ctx.fillText('■ Empresas', 255, 526);

    addButton(90, 720, 300, 54, 'VOLTAR A FINANÇAS', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.FINANCE_HUB;
        selectedButtonIndex = 0;
    });

    drawButtons();
}
function renderCareerHub() {
    buttons = [];
    drawRoundRect(16, 20, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 40, 18, '#ffffff', '#7c3aed', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px sans-serif';
    ctx.fillText('CARREIRA & EDUCAÇÃO', LOGICAL_WIDTH / 2, 65);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Atual: ${player.career.title}`, LOGICAL_WIDTH / 2, 92);

    addButton(40, 135, LOGICAL_WIDTH - 80, 82, 'EDUCAÇÃO & FORMAÇÃO', 'Cursos Técnicos, Licenciatura e Mestrado', '#2563eb', '#ffffff', () => {
        sound.click();
        currentState = STATE.CAREER_EDU;
        selectedButtonIndex = 0;
    }, getAgeYears() < 16);

    addButton(40, 238, LOGICAL_WIDTH - 80, 82, 'EMPREGOS TRADICIONAIS', 'Carreiras corporativas, saúde e engenharia', '#7c3aed', '#ffffff', () => {
        sound.click();
        currentState = STATE.CAREER_JOBS;
        selectedButtonIndex = 0;
    }, getAgeYears() < 18);

    addButton(40, 341, LOGICAL_WIDTH - 80, 82, 'CARREIRAS ESPECIAIS (FAMA)', 'Atleta Profissional, Ator de Cinema & Superestrela', '#d97706', '#ffffff', () => {
        sound.click();
        currentState = STATE.CAREER_SPECIAL;
        selectedButtonIndex = 0;
    }, getAgeYears() < 16);

    addButton(90, 720, 300, 54, 'VOLTAR AO JOGO', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    drawButtons();
}

function renderCareerEdu() {
    buttons = [];
    drawRoundRect(16, 20, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 40, 18, '#ffffff', '#2563eb', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px sans-serif';
    ctx.fillText('FORMAÇÃO ACADÉMICA', LOGICAL_WIDTH / 2, 62);

    let yPos = 105;
    for (let i = 2; i < EDUCATION_LEVELS.length; i++) {
        const edu = EDUCATION_LEVELS[i];
        const done = player.eduIndex >= i;
        const studying = player.studyingTargetIndex === i;
        const hasPrev = player.eduIndex >= i - 1;
        const hasInt = player.int >= edu.reqInt;
        const hasCash = player.money >= edu.cost;

        let sub = `€${edu.cost.toLocaleString('pt-PT')} | ${edu.months} meses | Req: ${edu.reqInt}% Int.`;
        let bg = '#2563eb';
        let disabled = false;

        if (done) {
            sub = 'CONCLUÍDO';
            bg = '#16a34a';
            disabled = true;
        } else if (studying) {
            sub = `EM CURSO (${player.studyingMonthsLeft} meses restantes)`;
            bg = '#d97706';
            disabled = true;
        } else if (player.studyingTargetIndex !== -1 || !hasPrev || !hasInt || !hasCash) {
            disabled = true;
            if (!hasPrev) sub = 'Requer grau anterior';
            else if (!hasInt) sub = `Requer ${edu.reqInt}% Inteligência`;
            else if (!hasCash) sub = 'Saldo insuficiente';
        }

        addButton(34, yPos, LOGICAL_WIDTH - 68, 76, edu.name, sub, bg, '#ffffff', () => {
            sound.good();
            player.money -= edu.cost;
            player.studyingTargetIndex = i;
            player.studyingMonthsLeft = edu.months;
            addLog(`Iniciaste: ${edu.name}.`);
            currentState = STATE.PLAYING;
            selectedButtonIndex = 0;
        }, disabled);

        yPos += 94;
    }

    addButton(90, 720, 300, 54, 'VOLTAR', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.CAREER_HUB;
        selectedButtonIndex = 0;
    });

    drawButtons();
}

function renderCareerJobs(isSpecial) {
    buttons = [];
    const list = isSpecial ? SPECIAL_CAREERS : REGULAR_CAREERS.slice(1);
    const title = isSpecial ? 'CARREIRAS ESPECIAIS' : 'EMPREGOS DISPONÍVEIS';
    const accent = isSpecial ? '#d97706' : '#7c3aed';

    drawRoundRect(16, 20, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 40, 18, '#ffffff', accent, 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px sans-serif';
    ctx.fillText(title, LOGICAL_WIDTH / 2, 62);

    let yPos = 100;
    list.forEach(job => {
        const reqEduIdx = EDUCATION_LEVELS.findIndex(e => e.id === job.reqEdu);
        const okEdu = player.eduIndex >= reqEduIdx;
        const okInt = player.int >= job.reqInt;
        const okFame = player.fame >= job.reqFame;
        const okHealth = !job.reqHealth || player.health >= job.reqHealth;
        const isCurrent = player.career.id === job.id;

        let sub = `€${job.monthlySalary.toLocaleString('pt-PT')}/mês | Int:${job.reqInt}% Fama:${job.reqFame}%`;
        let bg = accent;
        let disabled = false;

        if (isCurrent) {
            sub = 'CARREIRA ATUAL';
            bg = '#16a34a';
            disabled = true;
        } else if (!okEdu || !okInt || !okFame || !okHealth) {
            disabled = true;
            if (!okEdu) sub = `Requer ${EDUCATION_LEVELS[reqEduIdx].name}`;
            else if (!okHealth) sub = `Requer Saúde mínima de ${job.reqHealth}%`;
            else if (!okInt) sub = `Requer Inteligência de ${job.reqInt}%`;
            else sub = `Requer Fama mínima de ${job.reqFame}%`;
        }

        addButton(34, yPos, LOGICAL_WIDTH - 68, 76, job.title, sub, bg, '#ffffff', () => {
            sound.levelUp();
            player.career = job;
            addLog(`Novo trabalho: ${job.title}!`);
            currentState = STATE.PLAYING;
            selectedButtonIndex = 0;
        }, disabled);

        yPos += 90;
    });

    addButton(90, 720, 300, 54, 'VOLTAR', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.CAREER_HUB;
        selectedButtonIndex = 0;
    });

    drawButtons();
}
function renderBusinessHub() {
    buttons = [];
    drawRoundRect(16, 20, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 40, 18, '#ffffff', '#0284c7', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px sans-serif';
    ctx.fillText('AS MINHAS EMPRESAS', LOGICAL_WIDTH / 2, 60);

    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Rendimento Empresarial: +€${getMonthlyBusinessIncome().toLocaleString('pt-PT')}/mês`, LOGICAL_WIDTH / 2, 86);

    let yPos = 108;
    BUSINESS_TYPES.forEach(biz => {
        const owned = player.businesses.find(b => b.id === biz.id);
        if (owned) {
            const upgradeCost = Math.floor(biz.cost * 0.6 * owned.level);
            const profit = Math.floor(biz.baseMonthlyProfit * (1 + owned.level * 0.25));
            addButton(32, yPos, LOGICAL_WIDTH - 64, 76, `${biz.name} (Nível ${owned.level})`, `Lucro: €${profit.toLocaleString('pt-PT')}/mês | Expandir: €${upgradeCost.toLocaleString('pt-PT')}`, '#16a34a', '#ffffff', () => {
                if (player.money >= upgradeCost) {
                    sound.levelUp();
                    player.money -= upgradeCost;
                    owned.level += 1;
                    addLog(`Expandiste ${biz.name} para Nível ${owned.level}!`);
                    updateScore();
                }
            }, player.money < upgradeCost);
        } else {
            addButton(32, yPos, LOGICAL_WIDTH - 64, 76, `Fundar: ${biz.name}`, `Investimento: €${biz.cost.toLocaleString('pt-PT')} | Lucro base: €${biz.baseMonthlyProfit.toLocaleString('pt-PT')}/mês`, '#0284c7', '#ffffff', () => {
                if (player.money >= biz.cost) {
                    sound.levelUp();
                    player.money -= biz.cost;
                    player.businesses.push({ ...biz, level: 1 });
                    addLog(`Fundaste a empresa ${biz.name}!`);
                    updateScore();
                }
            }, player.money < biz.cost);
        }
        yPos += 88;
    });

    addButton(90, 720, 300, 54, 'VOLTAR AO JOGO', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    drawButtons();
}

function renderNeedsAction() {
    buttons = [];
    drawRoundRect(16, 20, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 40, 18, '#ffffff', '#d97706', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px sans-serif';
    ctx.fillText('CUIDAR DAS NECESSIDADES', LOGICAL_WIDTH / 2, 65);

    const actions = [
        { t: 'Dormir & Descansar (Grátis)', s: '+35% Energia, +5% Saúde', cost: 0, c: '#10b981', fn: () => { player.energy = Math.min(100, player.energy + 35); player.health = Math.min(100, player.health + 5); addLog('Dormiste profundamente e recuperaste energia.'); } },
        { t: 'Treinar no Ginásio (-€120)', s: '+15% Saúde, +8% Felicidade, -10% Energia', cost: 120, c: '#ef4444', fn: () => { player.money -= 120; player.health = Math.min(100, player.health + 15); player.happy = Math.min(100, player.happy + 8); player.energy = Math.max(0, player.energy - 10); addLog('Treinaste no ginásio!'); } },
        { t: 'Estudar na Biblioteca (Grátis)', s: '+8% Inteligência, -8% Energia', cost: 0, c: '#2563eb', fn: () => { player.int = Math.min(100, player.int + 8); player.energy = Math.max(0, player.energy - 8); addLog('Estudaste e aumentaste a tua inteligência.'); } },
        { t: 'Criar Conteúdo Viral (-€100)', s: '+8% Fama, +6% Felicidade', cost: 100, c: '#eab308', fn: () => { player.money -= 100; player.fame = Math.min(100, player.fame + 8); player.happy = Math.min(100, player.happy + 6); addLog('Publicaste conteúdo nas redes e ganhaste fama!'); } },
        { t: 'Férias & Spa de Luxo (-€1.800)', s: '+30% Felicidade, +25% Energia, +10% Saúde', cost: 1800, c: '#7c3aed', fn: () => { player.money -= 1800; player.happy = Math.min(100, player.happy + 30); player.energy = Math.min(100, player.energy + 25); player.health = Math.min(100, player.health + 10); addLog('Fizeste uma viagem relaxante!'); } }
    ];

    let yPos = 105;
    actions.forEach(act => {
        addButton(34, yPos, LOGICAL_WIDTH - 68, 76, act.t, act.s, act.c, '#ffffff', () => {
            sound.good();
            act.fn();
            updateScore();
            currentState = STATE.PLAYING;
            selectedButtonIndex = 0;
        }, player.money < act.cost);
        yPos += 92;
    });

    addButton(90, 720, 300, 54, 'VOLTAR AO JOGO', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    drawButtons();
}
function renderPeopleHub() {
    buttons = [];
    drawRoundRect(16, 20, LOGICAL_WIDTH - 32, LOGICAL_HEIGHT - 40, 18, '#ffffff', '#db2777', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px sans-serif';
    ctx.fillText('PESSOAS & FAMÍLIA', LOGICAL_WIDTH / 2, 60);

    drawRoundRect(30, 80, LOGICAL_WIDTH - 60, 86, 12, '#f8fafc', '#cbd5e1', 1.5);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Pais: ${player.parents.father} & ${player.parents.mother}`, 44, 106);
    ctx.fillStyle = '#475569';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Relação Familiar: ${player.parents.relation}%`, 44, 128);

    addButton(290, 96, 145, 52, 'Visitar Pais', '+Felicidade & Relação', '#2563eb', '#ffffff', () => {
        sound.good();
        player.parents.relation = Math.min(100, player.parents.relation + 8);
        player.happy = Math.min(100, player.happy + 8);
        addLog('Passaste tempo de qualidade com os teus pais.');
    });

    let yCursor = 182;
    if (!player.partner) {
        addButton(30, yCursor, LOGICAL_WIDTH - 60, 74, 'ENCONTRAR NAMORADO(A)', 'Conhecer alguém especial na cidade', '#db2777', '#ffffff', () => {
            sound.good();
            const pGender = player.gender === 'M' ? 'F' : 'M';
            const pName = pGender === 'M'
                ? `${FIRST_NAMES_M[Math.floor(Math.random() * FIRST_NAMES_M.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`
                : `${FIRST_NAMES_F[Math.floor(Math.random() * FIRST_NAMES_F.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
            player.partner = {
                name: pName,
                gender: pGender,
                married: false,
                love: 75
            };
            addLog(`Começaste a namorar com ${pName}!`);
        }, getAgeYears() < 16);
        yCursor += 90;
    } else {
        drawRoundRect(30, yCursor, LOGICAL_WIDTH - 60, 150, 12, '#fdf2f8', '#f9a8d4', 1.5);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#831843';
        ctx.font = 'bold 16px sans-serif';
        const statusLabel = player.partner.married ? 'Cônjuge' : 'Namorado(a)';
        ctx.fillText(`${statusLabel}: ${player.partner.name} (${player.partner.gender === 'M' ? 'H' : 'M'})`, 44, yCursor + 28);
        ctx.font = '13px sans-serif';
        ctx.fillText(`Amor & Cumplicidade: ${player.partner.love}%`, 44, yCursor + 50);

        addButton(42, yCursor + 68, 192, 64, 'Encontro Romântico', '-€150 | +Amor & Felicidade', '#db2777', '#ffffff', () => {
            if (player.money >= 150) {
                sound.good();
                player.money -= 150;
                player.partner.love = Math.min(100, player.partner.love + 12);
                player.happy = Math.min(100, player.happy + 10);
                addLog(`Tiveste um encontro inesquecível com ${player.partner.name}.`);
            }
        }, player.money < 150);

        if (!player.partner.married) {
            addButton(244, yCursor + 68, 192, 64, 'Pedir em Casamento', 'Custo: €3.000 (Requer 85% Amor)', '#7c3aed', '#ffffff', () => {
                if (player.money >= 3000 && player.partner.love >= 85) {
                    sound.levelUp();
                    player.money -= 3000;
                    player.partner.married = true;
                    player.happy = Math.min(100, player.happy + 20);
                    addLog(`Casaste-te com ${player.partner.name}!`);
                }
            }, player.money < 3000 || player.partner.love < 85);
        } else {
            const canConceive = !player.isPregnant && getAgeYears() >= 18 && getAgeYears() <= 46 && (player.gender === 'F' || player.partner.gender === 'F');
            addButton(244, yCursor + 68, 192, 64, 'Tentar Ter Filho', player.isPregnant ? `Gestação: ${player.pregnancyMonths}/9m` : 'Aumentar a família', '#16a34a', '#ffffff', () => {
                if (canConceive) {
                    sound.good();
                    player.isPregnant = true;
                    player.pregnancyMonths = 1;
                    const who = player.gender === 'F' ? 'Estás grávida' : `${player.partner.name} está grávida`;
                    addLog(`${who}! O bebé nasce dentro de 9 meses.`);
                }
            }, !canConceive);
        }
        yCursor += 166;
    }

    drawRoundRect(30, yCursor, LOGICAL_WIDTH - 60, 175, 12, '#f8fafc', '#cbd5e1', 1.5);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Filhos (${player.children.length})`, 44, yCursor + 26);

    if (player.children.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText('Ainda não tens filhos.', 44, yCursor + 54);
    } else {
        player.children.slice(0, 5).forEach((child, i) => {
            ctx.fillStyle = '#334155';
            ctx.font = '13px sans-serif';
            const cYears = Math.floor(child.ageMonths / 12);
            const cMonths = child.ageMonths % 12;
            ctx.fillText(`• ${child.name} (${child.gender === 'M' ? 'Menino' : 'Menina'}) - ${cYears}a ${cMonths}m`, 44, yCursor + 52 + i * 22);
        });
    }

    addButton(90, 720, 300, 54, 'VOLTAR AO JOGO', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    drawButtons();
}
function renderEventModal() {
    buttons = [];
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    drawRoundRect(26, 190, LOGICAL_WIDTH - 52, 420, 20, '#ffffff', '#f59e0b', 3);
    drawStar(LOGICAL_WIDTH / 2, 245, 5, 26, 12, '#f59e0b');

    ctx.textAlign = 'center';
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ACONTECIMENTO INESPERADO', LOGICAL_WIDTH / 2, 290);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(activeEvent.title, LOGICAL_WIDTH / 2, 322);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText(activeEvent.desc, LOGICAL_WIDTH / 2, 355);

    let btnY = 400;
    activeEvent.choices.forEach(ch => {
        addButton(46, btnY, LOGICAL_WIDTH - 92, 66, ch.text, null, '#2563eb', '#ffffff', () => {
            const res = ch.effect(player);
            addLog(res);
            updateScore();
            sound.good();
            currentState = STATE.PLAYING;
            selectedButtonIndex = 0;
        });
        btnY += 82;
    });

    drawButtons();
}

function renderGameOver() {
    buttons = [];
    drawRoundRect(20, 50, LOGICAL_WIDTH - 40, LOGICAL_HEIGHT - 100, 22, '#ffffff', '#dc2626', 3);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#dc2626';
    ctx.font = '900 40px sans-serif';
    ctx.fillText('FIM DA VIDA', LOGICAL_WIDTH / 2, 118);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText(deathReason, LOGICAL_WIDTH / 2, 150);

    drawRoundRect(42, 180, LOGICAL_WIDTH - 84, 300, 14, '#f8fafc', '#cbd5e1', 1.5);

    const netWorth = player.money + getPortfolioValue() + getBusinessesValue();
    const lines = [
        { k: 'Nome:', v: player.name },
        { k: 'Origem:', v: `${player.city}, ${player.country}` },
        { k: 'Idade Final:', v: `${getAgeYears()} anos e ${getAgeMonthsRemainder()} meses` },
        { k: 'Carreira:', v: player.career.title },
        { k: 'Filhos:', v: `${player.children.length}` },
        { k: 'Património Total:', v: `€${Math.round(netWorth).toLocaleString('pt-PT')}` }
    ];

    lines.forEach((item, idx) => {
        const y = 216 + idx * 42;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(item.k, 60, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(item.v, LOGICAL_WIDTH - 60, y);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('PONTUAÇÃO FINAL', LOGICAL_WIDTH / 2, 525);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 34px sans-serif';
    ctx.fillText(`${player.score.toLocaleString('pt-PT')} PTS`, LOGICAL_WIDTH / 2, 565);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`RECORDE GUARDADO: ${highScore.toLocaleString('pt-PT')} PTS`, LOGICAL_WIDTH / 2, 592);

    addButton(55, 625, LOGICAL_WIDTH - 110, 64, 'JOGAR NOVAMENTE', 'Reiniciar imediatamente', '#16a34a', '#ffffff', () => {
        sound.good();
        initNewGame();
        currentState = STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    addButton(55, 702, LOGICAL_WIDTH - 110, 46, 'VOLTAR AO MENU INICIAL', null, '#e2e8f0', '#0f172a', () => {
        sound.click();
        currentState = STATE.MENU;
        selectedButtonIndex = 0;
    });

    drawButtons();
}

function gameLoop() {
    animTime += 0.016;
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    if (currentState === STATE.MENU) renderMenu();
    else if (currentState === STATE.CUSTOMIZE) renderCustomize();
    else if (currentState === STATE.PLAYING) renderPlaying();
    else if (currentState === STATE.FINANCE_HUB) renderFinanceHub();
    else if (currentState === STATE.FINANCE_CRYPTO) renderAssetMarket('CRYPTO', 'MERCADO CRIPTO', '#f59e0b');
    else if (currentState === STATE.FINANCE_STOCKS) renderAssetMarket('STOCK', 'BOLSA DE AÇÕES', '#2563eb');
    else if (currentState === STATE.FINANCE_ETFS) renderAssetMarket('ETF', 'FUNDOS ETFs', '#0d9488');
    else if (currentState === STATE.FINANCE_ANALYSIS) renderFinanceAnalysis();
    else if (currentState === STATE.CAREER_HUB) renderCareerHub();
    else if (currentState === STATE.CAREER_EDU) renderCareerEdu();
    else if (currentState === STATE.CAREER_JOBS) renderCareerJobs(false);
    else if (currentState === STATE.CAREER_SPECIAL) renderCareerJobs(true);
    else if (currentState === STATE.BUSINESS_HUB) renderBusinessHub();
    else if (currentState === STATE.PEOPLE_HUB) renderPeopleHub();
    else if (currentState === STATE.NEEDS_ACTION) renderNeedsAction();
    else if (currentState === STATE.EVENT_MODAL) {
        renderPlaying();
        renderEventModal();
    } else if (currentState === STATE.GAMEOVER) renderGameOver();

    requestAnimationFrame(gameLoop);
}

function handlePointer(clientX, clientY) {
    sound.init();
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / rect.width;
    const scaleY = LOGICAL_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    for (let i = 0; i < buttons.length; i++) {
        const b = buttons[i];
        if (!b.disabled && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            selectedButtonIndex = i;
            b.action();
            break;
        }
    }
}

canvas.addEventListener('mousedown', (e) => handlePointer(e.clientX, e.clientY));

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });

window.addEventListener('keydown', (e) => {
    if (buttons.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        selectedButtonIndex = (selectedButtonIndex + 1) % buttons.length;
        sound.click();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        selectedButtonIndex = (selectedButtonIndex - 1 + buttons.length) % buttons.length;
        sound.click();
    } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const btn = buttons[selectedButtonIndex];
        if (btn && !btn.disabled) btn.action();
    }
});

requestAnimationFrame(gameLoop);
