const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const LOGICAL_WIDTH = 480;
const LOGICAL_HEIGHT = 840;
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

    playTone(freq, type, duration, vol = 0.15, slideFreq = null) {
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
        this.playTone(520, 'sine', 0.08, 0.12, 680);
    }

    ageUp() {
        this.playTone(440, 'triangle', 0.12, 0.12, 580);
    }

    good() {
        this.playTone(523.25, 'sine', 0.12, 0.15);
        setTimeout(() => this.playTone(659.25, 'sine', 0.18, 0.15), 90);
    }

    bad() {
        this.playTone(220, 'sawtooth', 0.18, 0.12, 140);
    }

    levelUp() {
        this.playTone(440, 'triangle', 0.1, 0.15);
        setTimeout(() => this.playTone(554.37, 'triangle', 0.1, 0.15), 80);
        setTimeout(() => this.playTone(659.25, 'triangle', 0.25, 0.18), 160);
    }

    gameOver() {
        this.playTone(300, 'sawtooth', 0.25, 0.15, 220);
        setTimeout(() => this.playTone(210, 'sawtooth', 0.45, 0.15, 90), 220);
    }
}

const sound = new SoundEngine();

const EDUCATION_LEVELS = [
    { id: 'none', name: 'Sem Escolaridade', cost: 0, years: 0, reqInt: 0 },
    { id: 'school', name: 'Ensino Básico & Secundário', cost: 0, years: 12, reqInt: 0 },
    { id: 'tech', name: 'Curso Técnico Profissional', cost: 2500, years: 2, reqInt: 35 },
    { id: 'uni', name: 'Licenciatura Universitária', cost: 12000, years: 4, reqInt: 60 },
    { id: 'master', name: 'Mestrado & Doutoramento', cost: 28000, years: 3, reqInt: 80 }
];

const CAREERS = [
    { id: 'unemployed', title: 'Desempregado', salary: 0, reqEdu: 'none', reqInt: 0, reqFame: 0, stress: 5 },
    { id: 'cashier', title: 'Operador de Caixa', salary: 11000, reqEdu: 'school', reqInt: 15, reqFame: 0, stress: 12 },
    { id: 'mechanic', title: 'Técnico de Manutenção', salary: 24000, reqEdu: 'tech', reqInt: 35, reqFame: 0, stress: 15 },
    { id: 'developer', title: 'Engenheiro de Software', salary: 52000, reqEdu: 'uni', reqInt: 65, reqFame: 0, stress: 22 },
    { id: 'doctor', title: 'Médico Cirurgião', salary: 88000, reqEdu: 'master', reqInt: 85, reqFame: 10, stress: 32 },
    { id: 'streamer', title: 'Criador Digital / Streamer', salary: 45000, reqEdu: 'school', reqInt: 30, reqFame: 40, stress: 18 },
    { id: 'ceo', title: 'CEO Multinacional', salary: 165000, reqEdu: 'master', reqInt: 85, reqFame: 55, stress: 40 },
    { id: 'star', title: 'Superestrela Mundial', salary: 320000, reqEdu: 'school', reqInt: 40, reqFame: 85, stress: 35 }
];
const RANDOM_EVENTS = [
    {
        title: 'Achado na Rua!',
        desc: 'Encontraste uma carteira perdida cheia de notas sem identificação.',
        minAge: 8, maxAge: 90,
        choices: [
            { text: 'Ficar com o dinheiro (+€600)', effect: (p) => { p.money += 600; p.karma -= 10; return 'Guardaste €600 no bolso!'; } },
            { text: 'Entregar na polícia (+Fama)', effect: (p) => { p.fame = Math.min(100, p.fame + 8); p.happy = Math.min(100, p.happy + 10); return 'Foste notícia local pela tua honestidade!'; } }
        ]
    },
    {
        title: 'Oportunidade Viral',
        desc: 'Um vídeo teu a fazer uma dança estranha começou a circular na internet.',
        minAge: 13, maxAge: 75,
        choices: [
            { text: 'Aproveitar e fazer diretos', effect: (p) => { p.fame = Math.min(100, p.fame + 15); p.money += 1500; return 'Ganhaste seguidores e €1.500 em patrocínios!'; } },
            { text: 'Apagar a conta com vergonha', effect: (p) => { p.happy = Math.max(0, p.happy - 8); return 'Apagaste tudo antes que mais gente visse.'; } }
        ]
    },
    {
        title: 'Crise de Saúde Súbita',
        desc: 'Acordaste com uma febre muito alta e dores no corpo.',
        minAge: 5, maxAge: 105,
        choices: [
            { text: 'Ir ao hospital privado (-€1.200)', effect: (p) => { if (p.money >= 1200) { p.money -= 1200; p.health = Math.min(100, p.health + 15); return 'Tratamento rápido! Recuperaste totalmente.'; } else { p.health = Math.max(0, p.health - 20); return 'Sem dinheiro suficiente! Foste para a fila pública.'; } } },
            { text: 'Tomar chá e esperar que passe', effect: (p) => { p.health = Math.max(0, p.health - 18); return 'A recuperação foi lenta e deixou marcas na saúde.'; } }
        ]
    },
    {
        title: 'Investimento em Cripto',
        desc: 'Um amigo garante que uma nova moeda digital vai valorizar 500%.',
        minAge: 18, maxAge: 85,
        choices: [
            { text: 'Investir €3.000 agora', effect: (p) => { if (p.money < 3000) return 'Não tinhas €3.000 para investir.'; p.money -= 3000; if (Math.random() > 0.48) { p.money += 11000; return 'JACKPOT! Ganhaste €11.000 com a valorização!'; } else { return 'O projeto faliu. Perdeste os €3.000.'; } } },
            { text: 'Ignorar e poupar', effect: (p) => { p.int = Math.min(100, p.int + 3); return 'Mantiveste a cabeça fria e o dinheiro seguro.'; } }
        ]
    },
    {
        title: 'Concurso de Talentos',
        desc: 'Há audições abertas na cidade para um novo programa de televisão.',
        minAge: 12, maxAge: 65,
        choices: [
            { text: 'Participar no palco', effect: (p) => { if (p.fame + p.happy > 90) { p.fame = Math.min(100, p.fame + 20); p.money += 5000; return 'Brilhaste no palco! +20 Fama e €5.000!'; } else { p.happy = Math.max(0, p.happy - 10); return 'Os jurados não gostaram da atuação.'; } } },
            { text: 'Ficar em casa a ver TV', effect: (p) => { p.happy = Math.min(100, p.happy + 4); return 'Tiveste uma noite descansada no sofá.'; } }
        ]
    },
    {
        title: 'Bolsa de Mérito',
        desc: 'O teu desempenho intelectual chamou a atenção de uma fundação.',
        minAge: 16, maxAge: 35,
        choices: [
            { text: 'Aceitar prémio de estudo', effect: (p) => { p.int = Math.min(100, p.int + 10); p.money += 4000; return 'Recebeste €4.000 e aumentaste a inteligência!'; } },
            { text: 'Festejar com amigos (-€500)', effect: (p) => { p.money = Math.max(0, p.money - 500); p.happy = Math.min(100, p.happy + 18); return 'Festa inesquecível! Felicidade no máximo!'; } }
        ]
    }
];
const GAME_STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    MODAL_SCHOOL: 'MODAL_SCHOOL',
    MODAL_CAREER: 'MODAL_CAREER',
    MODAL_ACTIVITIES: 'MODAL_ACTIVITIES',
    MODAL_EVENT: 'MODAL_EVENT',
    GAMEOVER: 'GAMEOVER'
};

let currentState = GAME_STATE.MENU;
let highScore = parseInt(localStorage.getItem('starLifeHighScore')) || 0;
let buttons = [];
let particles = [];
let selectedButtonIndex = 0;
let activeEvent = null;
let deathReason = '';
let animTime = 0;

let player = {};

function resetPlayer() {
    const firstNames = ['Lucas', 'Sofia', 'Mateus', 'Beatriz', 'Tiago', 'Clara', 'Gabriel', 'Inês', 'André', 'Mariana'];
    const lastNames = ['Silva', 'Santos', 'Costa', 'Oliveira', 'Pereira', 'Martins', 'Ferreira', 'Almeida'];
    const name = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];

    player = {
        name: name,
        age: 0,
        health: 85 + Math.floor(Math.random() * 15),
        happy: 80 + Math.floor(Math.random() * 20),
        int: 20 + Math.floor(Math.random() * 35),
        fame: 0,
        money: 250,
        karma: 50,
        eduIndex: 0,
        studyingYearsLeft: 0,
        studyingTargetIndex: -1,
        career: CAREERS[0],
        yearsInJob: 0,
        logs: [
            `Nasceste como ${name}!`,
            'Os teus pais sonham que sejas uma estrela.'
        ],
        score: 0,
        difficultyLevel: 1
    };
    particles = [];
    deathReason = '';
    updateScore();
}

function addLog(text) {
    player.logs.unshift(`Idade ${player.age}: ${text}`);
    if (player.logs.length > 6) {
        player.logs.pop();
    }
}

function spawnParticles(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 1.5 + Math.random() * 3.5;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 1.0,
            color: color,
            size: 3 + Math.random() * 4
        });
    }
}

function updateScore() {
    const netWorthPoints = Math.max(0, Math.floor(player.money / 250));
    const statPoints = (player.health + player.happy + player.int + player.fame * 3) * 2;
    const agePoints = player.age * 25;
    player.score = netWorthPoints + statPoints + agePoints;

    if (player.score > highScore) {
        highScore = player.score;
        localStorage.setItem('starLifeHighScore', highScore);
    }
}
function advanceYear() {
    sound.ageUp();
    player.age += 1;

    player.difficultyLevel = 1 + Math.floor(player.age / 15);
    const difficultyMultiplier = 1 + (player.age * 0.015);

    if (player.age === 6 && player.eduIndex === 0 && player.studyingTargetIndex === -1) {
        player.studyingTargetIndex = 1;
        player.studyingYearsLeft = 12;
        addLog('Entraste na escola primária!');
    }

    if (player.studyingTargetIndex !== -1) {
        player.studyingYearsLeft -= 1;
        player.int = Math.min(100, player.int + 3);
        if (player.studyingYearsLeft <= 0) {
            player.eduIndex = player.studyingTargetIndex;
            const eduObj = EDUCATION_LEVELS[player.eduIndex];
            player.studyingTargetIndex = -1;
            sound.levelUp();
            addLog(`Concluíste: ${eduObj.name}!`);
            spawnParticles(LOGICAL_WIDTH / 2, 230, '#38bdf8', 22);
        }
    }

    if (player.career.salary > 0) {
        const bonus = Math.floor(player.career.salary * (player.yearsInJob * 0.03));
        const netIncome = player.career.salary + bonus;
        player.money += netIncome;
        player.yearsInJob += 1;

        if (player.career.id === 'streamer' || player.career.id === 'star') {
            player.fame = Math.min(100, player.fame + 3);
        }
    }

    if (player.age >= 18) {
        const livingCost = Math.floor((3500 + (player.age * 110)) * (1 + player.fame * 0.01));
        player.money -= livingCost;
        if (player.money < 0) {
            player.happy = Math.max(0, player.happy - 8);
            player.health = Math.max(0, player.health - 5);
            addLog(`Dívidas! Custo de vida de €${livingCost} deixou saldo negativo.`);
        }
    }

    const stressImpact = Math.floor((player.career.stress / 10) * difficultyMultiplier);
    player.happy = Math.max(0, Math.min(100, player.happy - stressImpact + (player.fame > 50 ? 2 : 0)));

    if (player.age > 45) {
        const agingLoss = Math.floor((player.age - 42) * 0.22);
        player.health = Math.max(0, player.health - agingLoss);
    }

    if (player.fame > 0 && player.career.id !== 'star' && player.career.id !== 'streamer') {
        player.fame = Math.max(0, player.fame - 2);
    }

    updateScore();
    spawnParticles(LOGICAL_WIDTH / 2, 575, '#fbbf24', 12);

    if (player.health <= 0) {
        triggerGameOver('A tua saúde chegou a zero.');
        return;
    }
    if (player.age >= 115) {
        triggerGameOver('Morreste de velhice após uma vida lendária!');
        return;
    }

    const eventChance = Math.min(0.65, 0.35 + (player.difficultyLevel * 0.04));
    if (player.age >= 5 && Math.random() < eventChance) {
        const validEvents = RANDOM_EVENTS.filter(e => player.age >= e.minAge && player.age <= e.maxAge);
        if (validEvents.length > 0) {
            activeEvent = validEvents[Math.floor(Math.random() * validEvents.length)];
            currentState = GAME_STATE.MODAL_EVENT;
            selectedButtonIndex = 0;
        }
    }
}

function triggerGameOver(reason) {
    deathReason = reason;
    currentState = GAME_STATE.GAMEOVER;
    selectedButtonIndex = 0;
    sound.gameOver();
    updateScore();
}
function drawRoundRect(x, y, w, h, r, fill, stroke = null, lineWidth = 2) {
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
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawCharacterAvatar(cx, cy) {
    const bounce = Math.sin(animTime * 3) * 3;
    const y = cy + bounce;

    if (player.fame >= 40) {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(animTime * 4) * 0.1;
        drawStar(cx, y, 8, 62, 34, '#fbbf24');
        ctx.restore();
    }

    let shirtColor = '#3b82f6';
    if (player.career.id === 'doctor') shirtColor = '#f8fafc';
    if (player.career.id === 'ceo' || player.career.id === 'star') shirtColor = '#eab308';
    if (player.career.id === 'developer') shirtColor = '#8b5cf6';
    if (player.age < 6) shirtColor = '#38bdf8';

    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.arc(cx, y + 48, 32, Math.PI, 0);
    ctx.fill();

    const headRadius = player.age < 6 ? 24 : 27;
    ctx.fillStyle = player.health < 30 ? '#cbd5e1' : '#fed7aa';
    ctx.beginPath();
    ctx.arc(cx, y, headRadius, 0, Math.PI * 2);
    ctx.fill();

    if (player.age >= 3) {
        ctx.fillStyle = player.age >= 60 ? '#e2e8f0' : '#1e293b';
        ctx.beginPath();
        ctx.arc(cx, y - 6, headRadius + 1, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fill();
    }

    if (player.fame >= 65) {
        drawRoundRect(cx - 19, y - 7, 16, 10, 3, '#0f172a', '#fbbf24', 1.5);
        drawRoundRect(cx + 3, y - 7, 16, 10, 3, '#0f172a', '#fbbf24', 1.5);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx - 3, y - 4, 6, 2);
    } else {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cx - 9, y - 2, 3, 0, Math.PI * 2);
        ctx.arc(cx + 9, y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (player.happy >= 55) {
        ctx.arc(cx, y + 5, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    } else if (player.happy >= 30) {
        ctx.moveTo(cx - 8, y + 9);
        ctx.lineTo(cx + 8, y + 9);
    } else {
        ctx.arc(cx, y + 15, 9, 1.15 * Math.PI, 1.85 * Math.PI);
    }
    ctx.stroke();
}
function addButton(x, y, w, h, label, sublabel, color, action, disabled = false) {
    buttons.push({ x, y, w, h, label, sublabel, color, action, disabled });
}

function drawButtons() {
    buttons.forEach((btn, idx) => {
        const isSelected = idx === selectedButtonIndex;
        const fill = btn.disabled ? '#1e293b' : btn.color;
        const stroke = isSelected ? '#ffffff' : (btn.disabled ? '#334155' : 'rgba(255,255,255,0.25)');
        const lineWidth = isSelected ? 3 : 1.5;

        drawRoundRect(btn.x, btn.y, btn.w, btn.h, 12, fill, stroke, lineWidth);

        ctx.textAlign = 'center';
        ctx.fillStyle = btn.disabled ? '#64748b' : '#ffffff';
        ctx.font = btn.sublabel ? 'bold 16px sans-serif' : 'bold 18px sans-serif';
        const textY = btn.sublabel ? btn.y + btn.h / 2 - 3 : btn.y + btn.h / 2 + 6;
        ctx.fillText(btn.label, btn.x + btn.w / 2, textY);

        if (btn.sublabel) {
            ctx.font = '12px sans-serif';
            ctx.fillStyle = btn.disabled ? '#475569' : '#e2e8f0';
            ctx.fillText(btn.sublabel, btn.x + btn.w / 2, btn.y + btn.h / 2 + 15);
        }
    });
}

function renderMenu() {
    buttons = [];

    for (let i = 0; i < 28; i++) {
        const sx = (i * 73) % LOGICAL_WIDTH;
        const sy = ((i * 137) + animTime * (15 + (i % 4) * 8)) % LOGICAL_HEIGHT;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(251, 191, 36, 0.35)' : 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 3) + 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    const pulse = 1 + Math.sin(animTime * 3) * 0.06;
    ctx.save();
    ctx.translate(LOGICAL_WIDTH / 2, 210);
    ctx.scale(pulse, pulse);
    drawStar(0, 0, 5, 78, 36, '#fbbf24');
    drawStar(0, 0, 5, 52, 24, '#fef08a');
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 54px sans-serif';
    ctx.fillText('STAR LIFE', LOGICAL_WIDTH / 2, 345);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '17px sans-serif';
    ctx.fillText('Simulador de Vida, Carreira e Fama', LOGICAL_WIDTH / 2, 378);

    drawRoundRect(70, 420, 340, 68, 14, '#1e293b', '#334155', 2);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('RECORDE GUARDADO (PONTUAÇÃO)', LOGICAL_WIDTH / 2, 446);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${highScore.toLocaleString('pt-PT')} PTS`, LOGICAL_WIDTH / 2, 474);

    addButton(90, 535, 300, 68, 'JOGAR NOVA VIDA', 'Começar do zero aos 0 anos', '#2563eb', () => {
        sound.good();
        resetPlayer();
        currentState = GAME_STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText('Controlos: Toque/Rato ou Setas + Enter', LOGICAL_WIDTH / 2, 655);
    ctx.fillText('100% Canvas HTML5 & Web Audio API', LOGICAL_WIDTH / 2, 678);

    drawButtons();
}
function drawStatBar(x, y, w, label, value, color) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(label, x, y - 6);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.round(value)}%`, x + w, y - 6);

    drawRoundRect(x, y, w, 12, 6, '#0f172a');
    const fillW = Math.max(0, Math.min(w, (value / 100) * w));
    if (fillW > 0) {
        drawRoundRect(x, y, fillW, 12, 6, color);
    }
}

function renderPlaying() {
    buttons = [];

    drawRoundRect(16, 14, LOGICAL_WIDTH - 32, 54, 12, '#1e293b', '#334155', 1.5);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`SCORE: ${player.score.toLocaleString('pt-PT')}`, 30, 36);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Recorde: ${highScore.toLocaleString('pt-PT')}`, 30, 55);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`DIFICULDADE: NV.${player.difficultyLevel}`, LOGICAL_WIDTH - 30, 36);
    ctx.fillStyle = player.money >= 0 ? '#4ade80' : '#f87171';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`€${player.money.toLocaleString('pt-PT')}`, LOGICAL_WIDTH - 30, 56);

    drawRoundRect(16, 80, LOGICAL_WIDTH - 32, 165, 16, '#1e293b', '#334155', 1.5);
    drawCharacterAvatar(82, 148);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(player.name, 148, 114);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Idade: ${player.age} anos`, 148, 138);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px sans-serif';
    const eduText = player.studyingTargetIndex !== -1
        ? `A estudar (${player.studyingYearsLeft}a restantes)`
        : EDUCATION_LEVELS[player.eduIndex].name;
    ctx.fillText(`Educação: ${eduText}`, 148, 162);
    ctx.fillText(`Carreira: ${player.career.title}`, 148, 184);

    if (player.career.salary > 0) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`Salário: €${player.career.salary.toLocaleString('pt-PT')}/ano`, 148, 206);
    }

    drawRoundRect(16, 256, LOGICAL_WIDTH - 32, 115, 16, '#1e293b', '#334155', 1.5);
    drawStatBar(32, 290, 195, 'SAÚDE', player.health, '#ef4444');
    drawStatBar(252, 290, 195, 'FELICIDADE', player.happy, '#f59e0b');
    drawStatBar(32, 342, 195, 'INTELIGÊNCIA', player.int, '#3b82f6');
    drawStatBar(252, 342, 195, 'FAMA (STAR)', player.fame, '#eab308');

    drawRoundRect(16, 382, LOGICAL_WIDTH - 32, 168, 16, '#0f172a', '#1e293b', 1.5);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('DIÁRIO DE VIDA', 32, 404);

    player.logs.forEach((log, index) => {
        ctx.fillStyle = index === 0 ? '#f8fafc' : '#94a3b8';
        ctx.font = index === 0 ? 'bold 13px sans-serif' : '12px sans-serif';
        const displayLog = log.length > 56 ? log.substring(0, 53) + '...' : log;
        ctx.fillText(`• ${displayLog}`, 30, 428 + index * 21);
    });

    addButton(130, 564, 220, 66, '+1 ANO DE VIDA', 'Avançar idade', '#16a34a', () => {
        advanceYear();
    });

    const navY = 646;
    const navW = 140;
    const navH = 64;

    addButton(16, navY, navW, navH, 'ESCOLA', 'Cursos & Graus', '#2563eb', () => {
        sound.click();
        currentState = GAME_STATE.MODAL_SCHOOL;
        selectedButtonIndex = 0;
    }, player.age < 16);

    addButton(170, navY, navW, navH, 'CARREIRA', 'Empregos', '#7c3aed', () => {
        sound.click();
        currentState = GAME_STATE.MODAL_CAREER;
        selectedButtonIndex = 0;
    }, player.age < 18);

    addButton(324, navY, navW, navH, 'ATIVIDADES', 'Treinar & Fama', '#d97706', () => {
        sound.click();
        currentState = GAME_STATE.MODAL_ACTIVITIES;
        selectedButtonIndex = 0;
    }, player.age < 4);

    addButton(16, 726, 215, 44, sound.muted ? 'SOM: DESLIGADO' : 'SOM: LIGADO', null, '#334155', () => {
        sound.muted = !sound.muted;
        if (!sound.muted) sound.click();
    });

    addButton(249, 726, 215, 44, 'DESISTIR / MENU', null, '#475569', () => {
        sound.click();
        currentState = GAME_STATE.MENU;
        selectedButtonIndex = 0;
    });

    drawButtons();
}
function renderSchoolModal() {
    buttons = [];
    drawRoundRect(20, 40, LOGICAL_WIDTH - 40, LOGICAL_HEIGHT - 80, 18, '#1e293b', '#38bdf8', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('EDUCAÇÃO & CURSOS', LOGICAL_WIDTH / 2, 85);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Saldo: €${player.money.toLocaleString('pt-PT')} | Inteligência: ${player.int}%`, LOGICAL_WIDTH / 2, 112);

    let yPos = 140;
    for (let i = 2; i < EDUCATION_LEVELS.length; i++) {
        const edu = EDUCATION_LEVELS[i];
        const alreadyDone = player.eduIndex >= i;
        const isStudying = player.studyingTargetIndex === i;
        const canAfford = player.money >= edu.cost;
        const hasInt = player.int >= edu.reqInt;
        const hasPrev = player.eduIndex >= i - 1;

        let statusText = `Custo: €${edu.cost.toLocaleString('pt-PT')} | ${edu.years} anos | Req: ${edu.reqInt}% Int.`;
        let btnColor = '#2563eb';
        let disabled = false;

        if (alreadyDone) {
            statusText = 'CONCLUÍDO';
            btnColor = '#15803d';
            disabled = true;
        } else if (isStudying) {
            statusText = `A ESTUDAR (${player.studyingYearsLeft} anos restantes)`;
            btnColor = '#d97706';
            disabled = true;
        } else if (player.studyingTargetIndex !== -1 || !hasPrev || !canAfford || !hasInt) {
            disabled = true;
            if (!hasPrev) statusText = 'Requer grau anterior concluído';
            else if (!hasInt) statusText = `Requer ${edu.reqInt}% de Inteligência`;
            else if (!canAfford) statusText = `Dinheiro insuficiente (€${edu.cost})`;
        }

        addButton(40, yPos, LOGICAL_WIDTH - 80, 76, edu.name, statusText, btnColor, () => {
            sound.good();
            player.money -= edu.cost;
            player.studyingTargetIndex = i;
            player.studyingYearsLeft = edu.years;
            addLog(`Matriculaste-te em ${edu.name}!`);
            currentState = GAME_STATE.PLAYING;
            selectedButtonIndex = 0;
        }, disabled);

        yPos += 92;
    }

    addButton(90, 680, 300, 56, 'VOLTAR', null, '#475569', () => {
        sound.click();
        currentState = GAME_STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    drawButtons();
}

function renderCareerModal() {
    buttons = [];
    drawRoundRect(20, 30, LOGICAL_WIDTH - 40, LOGICAL_HEIGHT - 60, 18, '#1e293b', '#a855f7', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('MERCADO DE TRABALHO', LOGICAL_WIDTH / 2, 72);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Atual: ${player.career.title} | Int: ${player.int}% | Fama: ${player.fame}%`, LOGICAL_WIDTH / 2, 96);

    let yPos = 115;
    for (let i = 1; i < CAREERS.length; i++) {
        const job = CAREERS[i];
        const reqEduIdx = EDUCATION_LEVELS.findIndex(e => e.id === job.reqEdu);
        const meetsEdu = player.eduIndex >= reqEduIdx;
        const meetsInt = player.int >= job.reqInt;
        const meetsFame = player.fame >= job.reqFame;
        const isCurrent = player.career.id === job.id;

        let sub = `€${job.salary.toLocaleString('pt-PT')}/ano | Int:${job.reqInt}% Fama:${job.reqFame}%`;
        let color = '#7c3aed';
        let disabled = false;

        if (isCurrent) {
            sub = 'EMPREGO ATUAL';
            color = '#15803d';
            disabled = true;
        } else if (!meetsEdu || !meetsInt || !meetsFame) {
            disabled = true;
            if (!meetsEdu) sub = `Requer: ${EDUCATION_LEVELS[reqEduIdx].name}`;
            else if (!meetsInt) sub = `Requer Inteligência mínima de ${job.reqInt}%`;
            else sub = `Requer Fama mínima de ${job.reqFame}%`;
        }

        addButton(38, yPos, LOGICAL_WIDTH - 76, 66, job.title, sub, color, () => {
            sound.levelUp();
            player.career = job;
            player.yearsInJob = 0;
            addLog(`Foste contratado como ${job.title}!`);
            spawnParticles(LOGICAL_WIDTH / 2, 200, '#a855f7', 18);
            currentState = GAME_STATE.PLAYING;
            selectedButtonIndex = 0;
        }, disabled);

        yPos += 76;
    }

    addButton(90, 715, 300, 52, 'VOLTAR', null, '#475569', () => {
        sound.click();
        currentState = GAME_STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    drawButtons();
}

function renderActivitiesModal() {
    buttons = [];
    drawRoundRect(20, 40, LOGICAL_WIDTH - 40, LOGICAL_HEIGHT - 80, 18, '#1e293b', '#f59e0b', 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ATIVIDADES & ESTILO DE VIDA', LOGICAL_WIDTH / 2, 85);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Saldo disponível: €${player.money.toLocaleString('pt-PT')}`, LOGICAL_WIDTH / 2, 112);

    const actions = [
        {
            title: 'Ginásio & Corrida (-€150)',
            sub: '+Saúde, +Felicidade',
            cost: 150,
            color: '#dc2626',
            run: () => {
                player.money -= 150;
                player.health = Math.min(100, player.health + 10);
                player.happy = Math.min(100, player.happy + 5);
                addLog('Fizeste exercício intenso no ginásio!');
            }
        },
        {
            title: 'Ler Livros & Estudar (Grátis)',
            sub: '+6% Inteligência',
            cost: 0,
            color: '#2563eb',
            run: () => {
                player.int = Math.min(100, player.int + 6);
                player.happy = Math.max(0, player.happy - 2);
                addLog('Passaste horas a estudar na biblioteca.');
            }
        },
        {
            title: 'Publicar Vídeos nas Redes (-€100)',
            sub: '+Fama, +Felicidade',
            cost: 100,
            color: '#d97706',
            run: () => {
                player.money -= 100;
                const gain = 4 + Math.floor(Math.random() * 6);
                player.fame = Math.min(100, player.fame + gain);
                player.happy = Math.min(100, player.happy + 6);
                addLog(`Publicaste conteúdo viral! +${gain}% Fama.`);
            }
        },
        {
            title: 'Férias de Luxo (-€2.500)',
            sub: '+25% Felicidade, +10% Saúde',
            cost: 2500,
            color: '#059669',
            run: () => {
                player.money -= 2500;
                player.happy = Math.min(100, player.happy + 25);
                player.health = Math.min(100, player.health + 10);
                addLog('Viajaste para uma ilha paradisíaca!');
            }
        },
        {
            title: 'Consulta Médica Check-up (-€400)',
            sub: '+15% Saúde garantida',
            cost: 400,
            color: '#0284c7',
            run: () => {
                player.money -= 400;
                player.health = Math.min(100, player.health + 15);
                addLog('Fizeste exames médicos completos.');
            }
        }
    ];

    let yPos = 140;
    actions.forEach(act => {
        const disabled = player.money < act.cost;
        addButton(40, yPos, LOGICAL_WIDTH - 80, 74, act.title, act.sub, act.color, () => {
            sound.good();
            act.run();
            updateScore();
            spawnParticles(LOGICAL_WIDTH / 2, 220, '#fbbf24', 15);
            currentState = GAME_STATE.PLAYING;
            selectedButtonIndex = 0;
        }, disabled);
        yPos += 88;
    });

    addButton(90, 680, 300, 56, 'VOLTAR', null, '#475569', () => {
        sound.click();
        currentState = GAME_STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    drawButtons();
}
function renderEventModal() {
    buttons = [];
    ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    drawRoundRect(30, 180, LOGICAL_WIDTH - 60, 440, 20, '#1e293b', '#fbbf24', 3);

    drawStar(LOGICAL_WIDTH / 2, 235, 5, 28, 13, '#fbbf24');

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('ACONTECIMENTO INESPERADO', LOGICAL_WIDTH / 2, 282);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(activeEvent.title, LOGICAL_WIDTH / 2, 315);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px sans-serif';
    const words = activeEvent.desc.split(' ');
    let line = '';
    let lineY = 352;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > 360 && n > 0) {
            ctx.fillText(line, LOGICAL_WIDTH / 2, lineY);
            line = words[n] + ' ';
            lineY += 22;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, LOGICAL_WIDTH / 2, lineY);

    let btnY = 435;
    activeEvent.choices.forEach((choice) => {
        addButton(50, btnY, LOGICAL_WIDTH - 100, 68, choice.text, null, '#2563eb', () => {
            const outcome = choice.effect(player);
            addLog(outcome);
            updateScore();
            if (player.health <= 0) {
                triggerGameOver('Morreste na sequência de uma má decisão.');
                return;
            }
            sound.good();
            currentState = GAME_STATE.PLAYING;
            selectedButtonIndex = 0;
        });
        btnY += 84;
    });

    drawButtons();
}

function renderGameOver() {
    buttons = [];

    drawRoundRect(24, 60, LOGICAL_WIDTH - 48, LOGICAL_HEIGHT - 120, 22, '#1e293b', '#ef4444', 3);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 42px sans-serif';
    ctx.fillText('FIM DA VIDA', LOGICAL_WIDTH / 2, 130);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px sans-serif';
    ctx.fillText(deathReason, LOGICAL_WIDTH / 2, 165);

    drawRoundRect(50, 195, LOGICAL_WIDTH - 100, 295, 16, '#0f172a', '#334155', 1.5);

    const summary = [
        { label: 'Nome:', val: player.name },
        { label: 'Idade Alcançada:', val: `${player.age} anos` },
        { label: 'Carreira Final:', val: player.career.title },
        { label: 'Património Final:', val: `€${player.money.toLocaleString('pt-PT')}` },
        { label: 'Fama Máxima:', val: `${player.fame}%` }
    ];

    summary.forEach((item, idx) => {
        const y = 235 + idx * 42;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '15px sans-serif';
        ctx.fillText(item.label, 72, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(item.val, LOGICAL_WIDTH - 72, y);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('PONTUAÇÃO FINAL (SCORE)', LOGICAL_WIDTH / 2, 535);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px sans-serif';
    ctx.fillText(`${player.score.toLocaleString('pt-PT')} PTS`, LOGICAL_WIDTH / 2, 575);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`RECORDE PESSOAL: ${highScore.toLocaleString('pt-PT')} PTS`, LOGICAL_WIDTH / 2, 605);

    addButton(65, 640, LOGICAL_WIDTH - 130, 68, 'JOGAR NOVAMENTE', 'Reiniciar imediatamente', '#16a34a', () => {
        sound.good();
        resetPlayer();
        currentState = GAME_STATE.PLAYING;
        selectedButtonIndex = 0;
    });

    addButton(65, 722, LOGICAL_WIDTH - 130, 46, 'VOLTAR AO MENU INICIAL', null, '#475569', () => {
        sound.click();
        currentState = GAME_STATE.MENU;
        selectedButtonIndex = 0;
    });

    drawButtons();
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.025;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function gameLoop() {
    animTime += 0.016;
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.fillStyle = '#131b2e';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    if (currentState === GAME_STATE.MENU) {
        renderMenu();
    } else if (currentState === GAME_STATE.PLAYING) {
        renderPlaying();
    } else if (currentState === GAME_STATE.MODAL_SCHOOL) {
        renderPlaying();
        renderSchoolModal();
    } else if (currentState === GAME_STATE.MODAL_CAREER) {
        renderPlaying();
        renderCareerModal();
    } else if (currentState === GAME_STATE.MODAL_ACTIVITIES) {
        renderPlaying();
        renderActivitiesModal();
    } else if (currentState === GAME_STATE.MODAL_EVENT) {
        renderPlaying();
        renderEventModal();
    } else if (currentState === GAME_STATE.GAMEOVER) {
        renderGameOver();
    }

    updateAndDrawParticles();
    requestAnimationFrame(gameLoop);
}

function handlePointerInput(clientX, clientY) {
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

canvas.addEventListener('mousedown', (e) => {
    handlePointerInput(e.clientX, e.clientY);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        handlePointerInput(e.touches[0].clientX, e.touches[0].clientY);
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
        if (btn && !btn.disabled) {
            btn.action();
        }
    }
});

requestAnimationFrame(gameLoop);
