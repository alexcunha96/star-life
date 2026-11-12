
    
            
    
    ctx
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
