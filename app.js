// Initialisation
const supabaseUrl = 'https://vrlosgclkggwcdnjswqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybG9zZ2Nsa2dnd2Nkbmpzd3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NzY2MTUsImV4cCI6MjA5ODA1MjYxNX0.OOo1F9egIJ0OqOiNT56_Y94ekT_75hvXUmBd6oW2-Os';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Fonction pour sauvegarder (Appelle cette fonction au lieu de ton localStorage.setItem)
async function saveGameToCloud(userId, gameState) {
    const { data, error } = await supabase
        .from('saves')
        .upsert({ 
            user_id: userId, 
            data: gameState, 
            updated_at: new Date() 
        });
    
    if (error) console.error('Erreur sauvegarde:', error);
    else console.log('Sauvegarde réussie !');
}

// Fonction pour charger (Appelle cette fonction au lieu de ton localStorage.getItem)
async function loadGameFromCloud(userId) {
    const { data, error } = await supabase
        .from('saves')
        .select('data')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Erreur chargement:', error);
        return null;
    }
    return data ? data.data : null;
}
// =========================================================================
// 0. DONNÉES GLOBALES DES SUCCÈS (20 TROPHÉES)
// =========================================================================
const ALL_ACHIEVEMENTS = [
    { id: 'first_win', title: 'Premier Décryptage', desc: 'Résoudre une équation avec succès.' },
    { id: 'streak_10', title: 'Hacker Émérite', desc: 'Série de 10 bonnes réponses consécutives.' },
    { id: 'streak_50', title: 'Machine Humaine', desc: 'Série de 50 bonnes réponses consécutives.' },
    { id: 'lvl_10', title: 'Script Kiddie', desc: 'Atteindre le niveau 10.' },
    { id: 'lvl_50', title: 'Cyber Mercenaire', desc: 'Atteindre le niveau 50.' },
    { id: 'lvl_100', title: 'Dieu du Net', desc: 'Atteindre le niveau 100.' },
    { id: 'ram_first', title: 'Mémoire Étendue', desc: 'Première amélioration de RAM.' },
    { id: 'ram_max', title: 'God Mode Memory', desc: 'RAM au niveau 100.' },
    { id: 'miner_first', title: 'Premier Daemon', desc: 'Activer le premier Auto-Miner.' },
    { id: 'miner_max', title: 'Seigneur des Daemons', desc: 'Auto-Miner au niveau 100.' },
    { id: 'cooler_first', title: 'Brise Fraîche', desc: 'Première unité thermique.' },
    { id: 'cooler_max', title: 'Zéro Absolu', desc: 'Refroidissement au niveau 100.' },
    { id: 'wealth_1m', title: 'Start-up Tech', desc: 'Accumuler 1 Million de CC.' },
    { id: 'wealth_1b', title: 'Licorne Numérique', desc: 'Accumuler 1 Milliard de CC.' },
    { id: 'wealth_1t', title: 'Maître du Monde', desc: 'Accumuler 1 Trillion de CC.' },
    { id: 'wealth_1qa', title: 'Fortune Stellaire', desc: 'Accumuler 1 Quadrillion de CC.' },
    { id: 'lab_physics', title: 'Résonance', desc: 'Résoudre un problème de Physique.' },
    { id: 'lab_chem', title: 'Chimiste Amateur', desc: 'Résoudre un problème de Chimie.' },
    { id: 'nitrogen_first', title: 'Stockage Froid', desc: 'Acheter un pack d\'azote.' },
    { id: 'hacker_attack', title: 'Firewall Actif', desc: 'Contrer une intrusion réseau.' }
];

// =========================================================================
// 1. CONFIGURATION & ÉTAT DE L'APPLICATION
// =========================================================================
let currentUser = null;
let currentPassword = null;
let currentGrade = '2nde';
let cryptoCredits = 0, cpuTemperature = 35, ramLevel = 0, minerLevel = 0, hackerLevel = 1, coolerLevel = 0;
let currentTheme = 'matrix', actionLogs = [], mathStreak = 0, nitrogenCharges = 0, unlockedAchievements = [];

// Variables des laboratoires
let currentAnswer = 0;
let expectedFrequency = 0; // Utilisé pour la Physique
let expectedMass = 0;      // Utilisé pour la Chimie

let isBoosted = false, minerInterval = null, isPaused = true, isCpuThrottled = false;
let inactivityTime = 0, isGambleActive = false, nitrogenTimerCount = 0;
let boostCcActive = false, boostTargetActive = false, attackAnswer = 0, attackTimeLeft = 100, attackTimerInterval = null;
const MAX_INACTIVITY = 25;

// Variables du tutoriel
let isTutorialActive = false;
let tutorialStep = 0;
let hasCompletedTutorial = false;

// Liste officielle des classes
const GRADES_LIST = [
    {val: '6eme', txt: '6ème'}, {val: '5eme', txt: '5ème'}, {val: '4eme', txt: '4ème'}, 
    {val: '3eme', txt: '3ème'}, {val: '2nde', txt: '2nde'}, {val: '1ere', txt: '1ère'}, 
    {val: 'Terminale', txt: 'Terminale'}, {val: 'Prepa1', txt: 'Prépa 1A'}, {val: 'Prepa2', txt: 'Prépa 2A'}
];

function getGradeDisplay(grade) {
    let found = GRADES_LIST.find(g => g.val === grade);
    return found ? found.txt : grade;
}

// =========================================================================
// 2. DOM SELECTION
// =========================================================================
const DOM = {
    creditCount: document.getElementById('credit-count'), cpuTemp: document.getElementById('cpu-temp-status'),
    cpuWarn: document.getElementById('cpu-warning'), ramStatus: document.getElementById('ram-status'),
    hackLvl: document.getElementById('hacker-level'), streak: document.getElementById('streak-count'),
    n2: document.getElementById('nitrogen-charges'), feedback: document.getElementById('feedback'),
    logs: document.getElementById('log-container'), btnTheme: document.getElementById('btn-theme-switch'),
    btnPause: document.getElementById('btn-pause'), btnResume: document.getElementById('btn-resume'),
    pauseOverlay: document.getElementById('pause-overlay'),
    achievements: document.getElementById('achievements-list'), qMath: document.getElementById('math-question'),
    ansMath: document.getElementById('user-answer'), btnSubMath: document.getElementById('btn-submit'),
    btnHint: document.getElementById('btn-hint'), hintCost: document.getElementById('hint-cost'),
    bRam: document.getElementById('btn-buy-ram'), bMiner: document.getElementById('btn-buy-miner'),
    bHack: document.getElementById('btn-buy-level2'), bCooler: document.getElementById('btn-buy-cooler'),
    shopRamT: document.getElementById('ram-shop-title'), shopRamC: document.getElementById('ram-shop-cost'),
    shopMinerT: document.getElementById('miner-shop-title'), shopMinerC: document.getElementById('miner-shop-cost'),
    shopHackT: document.getElementById('hacker-shop-title'), shopHackC: document.getElementById('hacker-shop-cost'),
    shopCoolT: document.getElementById('heat-shop-title'), shopCoolC: document.getElementById('heat-shop-cost'),
    bN2_1: document.getElementById('btn-buy-n2-1'), bN2_2: document.getElementById('btn-buy-n2-2'),
    bN2_3: document.getElementById('btn-buy-n2-3'), n2Lock: document.getElementById('nitrogen-lock-status'),
    bBoostCc: document.getElementById('btn-buy-boost-cc'), bBoostTgt: document.getElementById('btn-buy-boost-target'),
    bFlush: document.getElementById('btn-flush-temp'), flushCost: document.getElementById('flush-temp-cost'),
    ramMod: document.getElementById('ram-module'), qPhys: document.getElementById('physics-question'),
    ansPhys: document.getElementById('physics-answer'), btnPhys: document.getElementById('btn-physics-submit'),
    instPhys: document.getElementById('physics-instruction'), qChem: document.getElementById('chemistry-question'),
    ansChem: document.getElementById('chemistry-answer'), btnChem: document.getElementById('btn-chemistry-submit'),
    atkOver: document.getElementById('attack-overlay'), qAtk: document.getElementById('attack-question'),
    ansAtk: document.getElementById('attack-user-answer'), btnAtk: document.getElementById('btn-attack-submit'),
    atkBar: document.getElementById('attack-timer-bar'), netBar: document.getElementById('net-load'),
    effBar: document.getElementById('miner-efficiency'), inactBar: document.getElementById('inactivity-bar'),
    btnReset: document.getElementById('btn-reset')
};

// Désactivation de l'ancien bouton reset
if (DOM.btnReset) DOM.btnReset.style.display = 'none';

const RAM_UPGRADES = [], MINER_UPGRADES = [], COOLER_UPGRADES = [], HACKER_UPGRADES = [];
for (let i = 1; i <= 100; i++) {
    let scale = Math.pow(1.95, i - 1);
    RAM_UPGRADES.push({ level: i, cost: Math.floor(200 * scale), size: `${Math.pow(2, i-1) * 8} Go`, name: `Upgrade RAM v${i}` });
    MINER_UPGRADES.push({ level: i, cost: Math.floor(100 * scale), gain: Math.floor(5 * scale), heat: 2 + i, ramRequired: i, name: `Miner v${i}` });
    COOLER_UPGRADES.push({ level: i, cost: Math.floor(150 * scale), maxHeat: 110 + (i*10), name: `Cooler v${i}` });
    HACKER_UPGRADES.push({ level: i, cost: Math.floor(300 * scale), baseGain: Math.floor(50 * scale), name: `Licence v${i}` });
}
RAM_UPGRADES.push({ level: 101, cost: Infinity, size: "MAX", name: "MAX" });
MINER_UPGRADES.push({ level: 101, cost: Infinity, name: "MAX" });
COOLER_UPGRADES.push({ level: 101, cost: Infinity, name: "MAX" });
HACKER_UPGRADES.push({ level: 101, cost: Infinity, name: "MAX" });

function getMaxHeat() { return coolerLevel === 0 ? 100 : COOLER_UPGRADES[coolerLevel - 1].maxHeat; }

function formatShort(num) {
    if (num >= 1e24) return (num / 1e24).toFixed(1) + "Sept";
    if (num >= 1e21) return (num / 1e21).toFixed(1) + "Sx";
    if (num >= 1e18) return (num / 1e18).toFixed(1) + "Qui";
    if (num >= 1e15) return (num / 1e15).toFixed(1) + "Qa";
    if (num >= 1e12) return (num / 1e12).toFixed(1) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "k";
    return Math.floor(num).toLocaleString('fr-FR');
}

function getSaveKey() {
    return `IdleTycoon_Save_${currentUser}_${currentGrade}`;
}

function saveGame() {
    if (!currentUser) return;
    localStorage.setItem(getSaveKey(), JSON.stringify({
        password: currentPassword, cryptoCredits, cpuTemperature, ramLevel, minerLevel, hackerLevel, coolerLevel, currentTheme, actionLogs, mathStreak, nitrogenCharges, unlockedAchievements, hasCompletedTutorial
    }));
}

function addLog(message, typeClass) {
    const timeStr = new Date().toTimeString().split(' ')[0];
    const fullLog = `[${timeStr}] ${message}`;
    actionLogs.unshift({ text: fullLog, type: typeClass });
    if (actionLogs.length > 15) actionLogs.pop();
    const p = document.createElement('p'); p.className = `log-line ${typeClass}`; p.textContent = fullLog;
    if (DOM.logs) DOM.logs.prepend(p);
    saveGame();
}

function checkAndUnlockAchievement(id) {
    if (!unlockedAchievements.includes(id)) {
        unlockedAchievements.push(id); saveGame();
        const ach = ALL_ACHIEVEMENTS.find(a => a.id === id);
        if (ach) addLog(`🏆 ACCRÉDITATION ACQUISE : ${ach.title}`, "text-upgrade");
    }
}

function checkGameProgressAchievements() {
    checkWealthAchievements();
    if (ramLevel >= 1) checkAndUnlockAchievement('ram_first');
    if (ramLevel >= 100) checkAndUnlockAchievement('ram_max');
    if (minerLevel >= 1) checkAndUnlockAchievement('miner_first');
    if (minerLevel >= 100) checkAndUnlockAchievement('miner_max');
    if (coolerLevel >= 1) checkAndUnlockAchievement('cooler_first');
    if (coolerLevel >= 100) checkAndUnlockAchievement('cooler_max');
    if (hackerLevel >= 10) checkAndUnlockAchievement('lvl_10');
    if (hackerLevel >= 50) checkAndUnlockAchievement('lvl_50');
    if (hackerLevel >= 100) checkAndUnlockAchievement('lvl_100');
}

function checkWealthAchievements() {
    if (cryptoCredits >= 1e6) checkAndUnlockAchievement('wealth_1m');
    if (cryptoCredits >= 1e9) checkAndUnlockAchievement('wealth_1b');
    if (cryptoCredits >= 1e12) checkAndUnlockAchievement('wealth_1t');
    if (cryptoCredits >= 1e15) checkAndUnlockAchievement('wealth_1qa');
}

function renderAchievements() {
    if (!DOM.achievements) return;
    DOM.achievements.innerHTML = ''; let unlockedCount = 0;
    [...ALL_ACHIEVEMENTS].sort((a, b) => (unlockedAchievements.includes(b.id)?1:0) - (unlockedAchievements.includes(a.id)?1:0)).forEach(ach => {
        const isUnl = unlockedAchievements.includes(ach.id);
        if (isUnl) unlockedCount++;
        const div = document.createElement('div'); div.className = `achievement-card ${isUnl ? 'unlocked' : ''}`;
        div.innerHTML = `<span class="ach-title">${isUnl ? '🏆' : '🔒'} ${ach.title}</span><span class="ach-desc">${ach.desc}</span>`;
        DOM.achievements.appendChild(div);
    });
    const header = document.querySelector('.pause-box h3');
    if(header) header.innerHTML = `SUCCÈS (${unlockedCount}/${ALL_ACHIEVEMENTS.length})`;
}

function applyThemeVisuals() {
    document.body.classList.remove('theme-matrix', 'theme-neon');
    document.body.classList.add(`theme-${currentTheme}`);
}

function applyRamVisuals() {
    document.body.classList.remove('ram-phase-2', 'ram-phase-3', 'ram-phase-4');
    if (ramLevel >= 80) document.body.classList.add('ram-phase-4');
    else if (ramLevel >= 50) document.body.classList.add('ram-phase-3');
    else if (ramLevel >= 20) document.body.classList.add('ram-phase-2');
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) { saveGame(); renderAchievements(); DOM.pauseOverlay.classList.remove('hidden'); } 
    else { DOM.pauseOverlay.classList.add('hidden'); DOM.ansMath.focus(); }
}
if (DOM.btnPause) DOM.btnPause.addEventListener('click', togglePause);
if (DOM.btnResume) DOM.btnResume.addEventListener('click', togglePause);

// =========================================================================
// 3. SYSTEME DE TUTORIEL
// =========================================================================
function startTutorial() {
    isTutorialActive = true;
    tutorialStep = 0;
    
    const tutDiv = document.createElement('div');
    tutDiv.id = 'tut-overlay';
    tutDiv.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:90%; max-width:600px; background:#09090b; border:2px solid #00ff66; padding:15px; z-index:10000; text-align:center; box-shadow:0 0 20px #00ff66;';
    
    tutDiv.innerHTML = `
        <h3 style="color:#00ff66; margin-top:0;">SYSTÈME INITIALISÉ</h3>
        <p id="tut-text" style="color:#fff; font-size:1rem; margin:15px 0;">Bienvenue Hacker. Pour accéder au réseau, prouve ta valeur. <strong style="color:#ffaa00;">Résous l'équation dans le terminal (CORE)</strong>.</p>
        <button id="btn-tut-skip" style="background:#ff3333; color:#fff; border:none; padding:8px 15px; cursor:pointer; font-weight:bold;">PASSER LE TUTORIEL</button>
    `;
    document.body.appendChild(tutDiv);
    
    document.getElementById('btn-tut-skip').onclick = endTutorial;
}

function updateTutorial(step) {
    if (!isTutorialActive) return;
    const text = document.getElementById('tut-text');
    if (!text) return;
    
    if (step === 1) text.innerHTML = "Accès autorisé. Je t'ai versé un bonus système. Va dans l'onglet <strong style='color:#00d2ff;'>SHOP</strong> et <strong style='color:#ffaa00;'>Achète ta première amélioration RAM</strong>.";
    if (step === 2) text.innerHTML = "La RAM permet de lancer des scripts. Toujours dans le SHOP, <strong style='color:#ffaa00;'>Achète le script Auto-Miner</strong> pour générer des CC automatiques.";
    if (step === 3) text.innerHTML = "L'Auto-Miner chauffe ton processeur (voir la température en haut à droite). <strong style='color:#ffaa00;'>Achète un composant COOLER</strong> pour résister à la surchauffe.";
    if (step === 4) {
        text.innerHTML = "Parfait ! Reste vigilant : si la température monte trop, utilise l'Azote (Labo) ou le Reboot. <strong style='color:#00ff66;'>Tutoriel terminé. Hacker le monde !</strong>";
        const btn = document.getElementById('btn-tut-skip');
        btn.textContent = "TERMINER";
        btn.style.background = "#00ff66";
        btn.style.color = "#000";
    }
}

function endTutorial() {
    isTutorialActive = false;
    hasCompletedTutorial = true;
    const tutDiv = document.getElementById('tut-overlay');
    if (tutDiv) tutDiv.remove();
    saveGame();
}

// =========================================================================
// 4. INFRASTRUCTURE CLASSEMENT MULTI-SUPPORT (GLOBAL)
// =========================================================================
function initLiveLeaderboard() {
    if (document.getElementById('live-leaderboard-styles')) {
        document.getElementById('live-leaderboard-styles').remove();
    }
    const style = document.createElement('style'); 
    style.id = 'live-leaderboard-styles';
    style.innerHTML = `
        @media (min-width: 801px) {
            body { padding-left: 260px !important; }
            #live-leaderboard { 
                position: fixed !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 260px !important; 
                height: 100vh !important; 
                background: #09090b !important; 
                border-right: 2px solid #00ff66 !important; 
                padding: 15px !important; 
                box-sizing: border-box !important; 
                overflow-y: auto !important; 
                z-index: 1000 !important; 
                display: block !important; 
            }
            #tab-leaderboard, .nav-item[data-target="tab-leaderboard"] { display: none !important; }
        }
        @media (max-width: 800px) {
            #live-leaderboard { display: none !important; } 
            
            #tab-leaderboard.active { 
                position: fixed !important; 
                top: 0 !important; 
                left: 0 !important; 
                width: 100vw !important; 
                height: calc(100vh - 60px) !important; 
                background: #09090b !important; 
                z-index: 8000 !important; 
                padding: 20px !important; 
                box-sizing: border-box !important; 
                overflow-y: auto !important; 
                display: block !important; 
            }
            #mobile-leaderboard-list { width: 100%; max-width: 500px; margin: 0 auto; display: block; }
        }
        .lb-header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #00ff66; }
        .lb-title { color: #00ff66; font-size: 1.1rem; font-weight: bold; }
        .lb-subtitle { color: #888; font-size: 0.8rem; }
        .lb-entry { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; margin-bottom: 5px; border-bottom: 1px solid #222; padding: 10px 5px; }
        .lb-score { color: #ffaa00; font-family: monospace; font-weight: bold; }
        .lb-entry.is-me { background: rgba(0, 255, 102, 0.1); border-left: 3px solid #00ff66; }
    `;
    document.head.appendChild(style);
    
    if (!document.getElementById('live-leaderboard')) {
        const lb = document.createElement('div'); 
        lb.id = 'live-leaderboard'; 
        document.body.appendChild(lb);
    }
}

function refreshLiveLeaderboard() {
    let bestScores = {}; 

    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.startsWith('IdleTycoon_Save_')) {
            try {
                let d = JSON.parse(localStorage.getItem(key));
                let cc = d.cryptoCredits || 0;
                
                let p = key.replace('IdleTycoon_Save_', '');
                GRADES_LIST.forEach(g => {
                    if (p.endsWith('_' + g.val)) {
                        p = p.substring(0, p.length - ('_' + g.val).length);
                    }
                });

                if (p === currentUser) { cc = Math.max(cc, cryptoCredits); }
                if (!bestScores[p] || cc > bestScores[p]) { bestScores[p] = cc; }
            } catch(e) {}
        }
    }

    let players = [];
    for (let pseudo in bestScores) { players.push({ name: pseudo, cc: bestScores[pseudo] }); }
    players.sort((a, b) => b.cc - a.cc);

    const pc = document.getElementById('live-leaderboard');
    if (pc) {
        pc.innerHTML = `<div class="lb-header"><div class="lb-title">🏆 CLASSEMENT GLOBAL</div><div class="lb-subtitle">Toutes classes confondues</div></div>` + 
        players.map((p, i) => `<div class="lb-entry ${p.name===currentUser?'is-me':''}"><span style="color:${p.name===currentUser?'#00ff66':'#fff'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px;">#${i+1} ${p.name===currentUser?'► ':''}${p.name}</span><span class="lb-score">${formatShort(p.cc)}</span></div>`).join('');
    }

    const mobTab = document.getElementById('tab-leaderboard');
    if (mobTab) {
        let mobList = document.getElementById('mobile-leaderboard-list');
        if (!mobList) { mobList = document.createElement('div'); mobList.id = 'mobile-leaderboard-list'; mobTab.appendChild(mobList); }
        mobList.innerHTML = `<div style="text-align:center;color:#888;margin-bottom:10px;">Classement Global</div>` + players.map((p, i) => `<div class="lb-entry ${p.name===currentUser?'is-me':''}"><span style="color:${p.name===currentUser?'#00ff66':'#fff'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">#${i+1} ${p.name===currentUser?'► ':''}${p.name}</span><span class="lb-score">${formatShort(p.cc)} CC</span></div>`).join('');
    }
}

// =========================================================================
// GESTION DU MENU PAUSE (Switch de Classe + Déconnexion)
// =========================================================================
const pauseBody = document.querySelector('.pause-box .alert-body');
if (pauseBody) {
    const switchLabel = document.createElement('p');
    switchLabel.textContent = "CHANGER DE CLASSE :";
    switchLabel.style.cssText = "color:#00ff66; margin-top:15px; margin-bottom:5px; font-size:0.9rem; font-weight:bold; text-transform:uppercase;";
    pauseBody.appendChild(switchLabel);

    const gradeSelectMenu = document.createElement('select');
    gradeSelectMenu.id = "pause-grade-select";
    gradeSelectMenu.style.cssText = "width:100%;padding:10px;background:#000;border:1px solid #00ff66;color:#00ff66;text-align:center;cursor:pointer;font-weight:bold;";
    
    GRADES_LIST.forEach(g => {
        let opt = document.createElement('option');
        opt.value = g.val; opt.textContent = g.txt;
        gradeSelectMenu.appendChild(opt);
    });
    
    gradeSelectMenu.addEventListener('change', (e) => {
        switchGrade(e.target.value);
    });
    pauseBody.appendChild(gradeSelectMenu);

    const btnLogout = document.createElement('button'); 
    btnLogout.textContent = "DÉCONNEXION COMPLÈTE"; 
    btnLogout.style.cssText = "margin-top:15px;width:100%;padding:10px;background:#00d2ff;color:#000;border:none;font-weight:bold;cursor:pointer;";
    pauseBody.appendChild(btnLogout);
    btnLogout.addEventListener('click', () => { saveGame(); location.reload(); });
}

if (DOM.btnTheme) DOM.btnTheme.addEventListener('click', () => { currentTheme = currentTheme === 'matrix' ? 'neon' : 'matrix'; applyThemeVisuals(); saveGame(); });

function switchGrade(newGrade) {
    if (newGrade === currentGrade) return;
    saveGame(); 
    
    if(minerInterval) clearInterval(minerInterval);
    if(attackTimerInterval) clearInterval(attackTimerInterval);
    if(DOM.atkOver) DOM.atkOver.classList.add('hidden');
    isTutorialActive = false;
    let tutDiv = document.getElementById('tut-overlay');
    if(tutDiv) tutDiv.remove();
    
    currentGrade = newGrade;
    let d = JSON.parse(localStorage.getItem(getSaveKey()));
    if(d) { 
        cryptoCredits=d.cryptoCredits||0; cpuTemperature=d.cpuTemperature||35; ramLevel=d.ramLevel||0; minerLevel=d.minerLevel||0; 
        hackerLevel=d.hackerLevel||1; coolerLevel=d.coolerLevel||0; currentTheme=d.currentTheme||'matrix'; 
        actionLogs=d.actionLogs||[]; mathStreak=d.mathStreak||0; nitrogenCharges=d.nitrogenCharges||0; unlockedAchievements=d.unlockedAchievements||[];
        hasCompletedTutorial=d.hasCompletedTutorial||false;
    } else { 
        cryptoCredits=0; cpuTemperature=35; ramLevel=0; minerLevel=0; hackerLevel=1; coolerLevel=0; currentTheme='matrix'; actionLogs=[]; mathStreak=0; nitrogenCharges=0; unlockedAchievements=[]; hasCompletedTutorial=false;
        saveGame(); 
    }
    
    let h = document.querySelector('#tab-core .terminal-header'); 
    if(h) h.textContent = `SYSTEM_CORE.EXE - USER: [${currentUser}] - CLASSE: [${getGradeDisplay(currentGrade).toUpperCase()}]`;
    
    initGame();
    if (!hasCompletedTutorial) startTutorial();
    
    DOM.pauseOverlay.classList.add('hidden');
    DOM.ansMath.focus();
}

// =========================================================================
// 5. MOTEUR MATHÉMATIQUE ADAPTATIF PAR CLASSE
// =========================================================================
function generateEquation() {
    if (isPaused) return; DOM.ansMath.value = ''; DOM.ansMath.focus(); inactivityTime = 0;
    isGambleActive = Math.random() < 0.15;
    if (isGambleActive) { DOM.feedback.style.color = "#ffaa00"; DOM.feedback.textContent = "⚠️ [FLUX INSTABLE] Équation TRIPLE (ou perte 15%)."; }
    let lvl = boostTargetActive ? hackerLevel : Math.floor(Math.random() * hackerLevel) + 1;
    let a, b, c, x;

    switch(currentGrade) {
        case '6eme':
            a = Math.floor(Math.random()*10)+lvl; b = Math.floor(Math.random()*10)+lvl;
            if (Math.random() > 0.5) { currentAnswer = a+b; DOM.qMath.textContent = `[6ème Niv.${lvl}] ${a} + ${b} = ?`; }
            else { currentAnswer = a*b; DOM.qMath.textContent = `[6ème Niv.${lvl}] ${a} x ${b} = ?`; }
            break;
        case '5eme':
            a = Math.floor(Math.random()*5)+2; b = Math.floor(Math.random()*5)+2; c = Math.floor(Math.random()*5)+1;
            if (Math.random() > 0.5) { currentAnswer = a + (b*c); DOM.qMath.textContent = `[5ème Niv.${lvl}] ${a} + ${b} x ${c} = ?`; }
            else { currentAnswer = a * (b-c); DOM.qMath.textContent = `[5ème Niv.${lvl}] ${a} x (${b} - ${c}) = ?`; }
            break;
        case '4eme':
            a = Math.floor(Math.random()*15)+lvl; b = Math.floor(Math.random()*30)+lvl+15;
            currentAnswer = b - a; DOM.qMath.textContent = `[4ème Niv.${lvl}] x + ${a} = ${b}. Valeur de x ?`;
            break;
        case '3eme':
            a = Math.floor(Math.random()*5)+2; x = Math.floor(Math.random()*10)+1; b = Math.floor(Math.random()*10)+1;
            c = (a * x) + b; currentAnswer = x; DOM.qMath.textContent = `[3ème Niv.${lvl}] ${a}x + ${b} = ${c}`;
            break;
        case '1ere':
            a = Math.floor(Math.random()*3)+1; b = Math.floor(Math.random()*6)+2; c = Math.floor(Math.random()*3)+1;
            currentAnswer = (b*b) - (4*a*c); DOM.qMath.textContent = `[1ère Niv.${lvl}] Δ de ${a}x² + ${b}x + ${c} = 0`;
            break;
        case 'Terminale':
            a = Math.floor(Math.random()*4)+1; b = Math.floor(Math.random()*5)+1;
            currentAnswer = (4*a) + b; DOM.qMath.textContent = `[Term Niv.${lvl}] f(x)=${a}x² + ${b}x. f'(2) = ?`;
            break;
        case 'Prepa1':
            a = Math.floor(Math.random()*4)+2; b = Math.floor(Math.random()*4)+2;
            if (Math.random() > 0.5) {
                currentAnswer = a * b; DOM.qMath.textContent = `[Prépa 1A Niv.${lvl}] det([[${a}, 1], [0, ${b}]]) = ?`;
            } else {
                currentAnswer = a; DOM.qMath.textContent = `[Prépa 1A Niv.${lvl}] ∫(0 à 1) ${a*3}x² dx = ?`;
            }
            break;
        case 'Prepa2':
            a = Math.floor(Math.random()*5)+2; b = Math.floor(Math.random()*3)+1; c = a * b;
            if (Math.random() > 0.5) {
                currentAnswer = a * 2; DOM.qMath.textContent = `[Prépa 2A Niv.${lvl}] Σ(n=0 à ∞) ${a}(1/2)ⁿ = ?`;
            } else {
                currentAnswer = a; DOM.qMath.textContent = `[Prépa 2A Niv.${lvl}] lim(x→∞) (${c}x²)/(${b}x² + 1) = ?`;
            }
            break;
        case '2nde':
        default:
            switch(lvl%5 + 1) { 
                case 1: a = Math.floor(Math.random()*5)+2; x = Math.floor(Math.random()*9)+1; b = Math.floor(Math.random()*10)+1; currentAnswer = x; DOM.qMath.textContent = `[2nde Niv.${lvl}] ${a}x + ${b} = ${(a*x)+b}`; break;
                case 2: a = Math.floor(Math.random()*4)+2; x = Math.floor(Math.random()*7)+1; b = Math.floor(Math.random()*4)+1; currentAnswer = x; DOM.qMath.textContent = `[2nde Niv.${lvl}] ${a}(x + ${b}) = ${a*(x+b)}`; break;
                case 3: x = Math.floor(Math.random()*6)+1; c = Math.floor(Math.random()*4)+1; a = c+Math.floor(Math.random()*4)+2; b = Math.floor(Math.random()*10)+2; currentAnswer = x; DOM.qMath.textContent = `[2nde Niv.${lvl}] ${a}x + ${b} = ${c}x + ${(a*x)+b-(c*x)}`; break;
                case 4: a = Math.floor(Math.random()*8)+2; currentAnswer = a*a; DOM.qMath.textContent = `[2nde Niv.${lvl}] (x + ${a})² = x² + ${2*a}x + [?]. [?] = ?`; break;
                case 5: x = Math.floor(Math.random()*5)+2; a = x*2; b = Math.floor(Math.random()*5)+1; currentAnswer = x; DOM.qMath.textContent = `[2nde Niv.${lvl}] (2x - ${a})(3x - ${b}) = 0. Solution ENTIÈRE.`; break;
            }
            break;
    }
}

function checkAnswer() {
    if (isPaused) return; const pg = parseInt(DOM.ansMath.value, 10); if (isNaN(pg)) return;
    if (pg === currentAnswer) {
        mathStreak++; DOM.streak.textContent = `${mathStreak} 🔥`;
        let fg = Math.round(50 * Math.pow(2.1, hackerLevel - 1) * (1 + mathStreak * 0.1));
        if (boostCcActive) fg *= 2; if (isGambleActive) fg *= 3;
        cryptoCredits += fg; DOM.creditCount.textContent = formatShort(cryptoCredits);
        DOM.feedback.style.color = "#00ff66"; DOM.feedback.textContent = `[OK] +${formatShort(fg)} CC`;
        addLog(`+${formatShort(fg)} CC (Série: ${mathStreak})`, "text-success");
        
        if (isTutorialActive && tutorialStep === 0) {
            cryptoCredits += 500; DOM.creditCount.textContent = formatShort(cryptoCredits);
            addLog("[SYSTÈME] Bonus de formation: +500 CC", "text-warning");
            tutorialStep = 1; updateTutorial(1);
        }

        checkGameProgressAchievements(); saveGame(); refreshLiveLeaderboard(); setTimeout(generateEquation, 1200);
    } else {
        mathStreak = 0; DOM.streak.textContent = `0 🔥`;
        if (isGambleActive) { let pen = Math.round(cryptoCredits*0.15); cryptoCredits = Math.max(0, cryptoCredits-pen); DOM.creditCount.textContent = formatShort(cryptoCredits); addLog(`🎲 RETOUR FLAMME : -${formatShort(pen)} CC`, "critical-heat"); }
        DOM.feedback.style.color = "#ff3333"; DOM.feedback.textContent = `[FAIL] Syntaxe incorrecte.`; saveGame(); refreshLiveLeaderboard();
    }
}
if (DOM.btnSubMath) DOM.btnSubMath.addEventListener('click', checkAnswer); 
if (DOM.ansMath) DOM.ansMath.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });

if (DOM.btnHint) {
    DOM.btnHint.addEventListener('click', () => {
        if (isTutorialActive) return alert("Fonction bloquée pendant le tutoriel.");
        let hc = Math.floor(1500 * Math.pow(2.00, hackerLevel - 1));
        if (cryptoCredits >= hc && !isPaused) {
            cryptoCredits -= hc; DOM.creditCount.textContent = formatShort(cryptoCredits);
            DOM.feedback.style.color = "#00d2ff"; DOM.feedback.textContent = `[ASTUCE] Réponse proche de ${currentAnswer + Math.floor(Math.random()*3-1)}.`;
            addLog(`Astuce achetée (-${formatShort(hc)} CC).`, "text-warning"); updateShopUI(); saveGame(); refreshLiveLeaderboard();
        }
    });
}

// =========================================================================
// 6. LABORATOIRES (PHYSIQUE ET CHIMIE ADAPTÉS)
// =========================================================================
function generateWaveSignal() { 
    DOM.ansPhys.value = ''; 
    let d, t, m, v, r, i, f, c, q, B, S;

    switch(currentGrade) {
        case '6eme': 
            d = Math.floor(Math.random() * 50) + 10; t = Math.floor(Math.random() * 5) + 2;
            expectedFrequency = Math.round(d / t);
            if (DOM.instPhys) DOM.instPhys.textContent = "Calcul de vitesse v = d/t (Arrondir) :";
            if (DOM.qPhys) DOM.qPhys.textContent = `d = ${d}m | t = ${t}s`;
            break;
        case '5eme': 
            m = Math.floor(Math.random() * 20) + 5;
            expectedFrequency = m * 10;
            if (DOM.instPhys) DOM.instPhys.textContent = "Poids P = m.g (g≈10) :";
            if (DOM.qPhys) DOM.qPhys.textContent = `m = ${m} kg`;
            break;
        case '4eme': 
            r = Math.floor(Math.random() * 100) + 10; i = Math.floor(Math.random() * 5) + 1;
            expectedFrequency = r * i;
            if (DOM.instPhys) DOM.instPhys.textContent = "Loi d'Ohm U = R.I :";
            if (DOM.qPhys) DOM.qPhys.textContent = `R = ${r}Ω | I = ${i}A`;
            break;
        case '3eme': 
            m = Math.floor(Math.random() * 10) * 2 + 2; v = Math.floor(Math.random() * 10) + 2;
            expectedFrequency = 0.5 * m * (v * v);
            if (DOM.instPhys) DOM.instPhys.textContent = "Énergie Cinétique Ec = 0.5*m*v² :";
            if (DOM.qPhys) DOM.qPhys.textContent = `m = ${m}kg | v = ${v}m/s`;
            break;
        case '1ere': 
            f = Math.floor(Math.random() * 50) + 10; d = Math.floor(Math.random() * 20) + 5;
            expectedFrequency = f * d;
            if (DOM.instPhys) DOM.instPhys.textContent = "Travail W = F.d :";
            if (DOM.qPhys) DOM.qPhys.textContent = `F = ${f}N | d = ${d}m`;
            break;
        case 'Terminale': 
            r = Math.floor(Math.random() * 50) + 10; c = Math.floor(Math.random() * 10) + 2;
            expectedFrequency = r * c;
            if (DOM.instPhys) DOM.instPhys.textContent = "Constante de temps τ = R.C :";
            if (DOM.qPhys) DOM.qPhys.textContent = `R = ${r}Ω | C = ${c}F`;
            break;
        case 'Prepa1': 
            q = Math.floor(Math.random() * 5) + 1; v = Math.floor(Math.random() * 10) + 2; B = Math.floor(Math.random() * 5) + 1;
            expectedFrequency = q * v * B;
            if (DOM.instPhys) DOM.instPhys.textContent = "Force de Lorentz F = qvB :";
            if (DOM.qPhys) DOM.qPhys.textContent = `q = ${q}C | v = ${v}m/s | B = ${B}T`;
            break;
        case 'Prepa2': 
            B = Math.floor(Math.random() * 10) + 2; S = Math.floor(Math.random() * 10) + 2;
            expectedFrequency = B * S;
            if (DOM.instPhys) DOM.instPhys.textContent = "Flux Magnétique Φ = B.S :";
            if (DOM.qPhys) DOM.qPhys.textContent = `B = ${B}T | S = ${S}m²`;
            break;
        case '2nde':
        default:
            let period = [0.1, 0.2, 0.5, 0.05, 0.04][Math.floor(Math.random() * 5)] / (1 + (hackerLevel * 0.1));
            expectedFrequency = Math.round(1 / period);
            if (DOM.instPhys) DOM.instPhys.textContent = "Fréquence f = 1/T (Arrondir) :";
            if (DOM.qPhys) DOM.qPhys.textContent = `T = ${period.toFixed(3)} s`;
            break;
    }
}
if (DOM.btnPhys) DOM.btnPhys.addEventListener('click', () => {
    if (isTutorialActive) return alert("Fonction bloquée pendant le tutoriel.");
    if (parseFloat(DOM.ansPhys.value) === expectedFrequency) {
        checkAndUnlockAchievement('lab_physics'); addLog(`[PHYSIQUE] Bonus appliqué !`, "text-success");
        isBoosted = true; let dur = 10000+(hackerLevel*1000); setTimeout(()=>{isBoosted=false;}, dur); setTimeout(generateWaveSignal, dur+2000);
    } else DOM.feedback.textContent = "[ERREUR] Valeur incorrecte.";
});

function generateChemExercise() { 
    DOM.ansChem.value = ''; 
    let m, v, n, ph, k, c, h, tS, z, neu;

    switch(currentGrade) {
        case '6eme': 
            m = Math.floor(Math.random() * 100) * 10; v = Math.floor(Math.random() * 5) + 2;
            expectedMass = Math.round(m / v);
            if (DOM.qChem) DOM.qChem.textContent = `Masse Volumique ρ = m/V ? (m=${m}g, V=${v}L)`;
            break;
        case '5eme': 
            let m1 = Math.floor(Math.random() * 50) + 10; let m2 = Math.floor(Math.random() * 50) + 10;
            expectedMass = m1 + m2;
            if (DOM.qChem) DOM.qChem.textContent = `Masse Totale ? (${m1}g C + ${m2}g O2)`;
            break;
        case '4eme': 
            z = Math.floor(Math.random() * 20) + 5; neu = Math.floor(Math.random() * 25) + 5;
            expectedMass = z + neu;
            if (DOM.qChem) DOM.qChem.textContent = `Nucléons A = Z+N ? (Z=${z}, N=${neu})`;
            break;
        case '3eme': 
            let molecules = Math.floor(Math.random() * 10) + 2;
            expectedMass = molecules * 18; 
            if (DOM.qChem) DOM.qChem.textContent = `Masse de ${molecules} mol d'H2O ? (M=18g/mol)`;
            break;
        case '1ere': 
            n = Math.floor(Math.random() * 10) + 2; v = Math.floor(Math.random() * 5) + 1;
            expectedMass = Math.round(n / v);
            if (DOM.qChem) DOM.qChem.textContent = `Concentration C = n/V ? (n=${n}mol, V=${v}L)`;
            break;
        case 'Terminale': 
            ph = Math.floor(Math.random() * 6) + 1;
            expectedMass = ph;
            if (DOM.qChem) DOM.qChem.textContent = `pH ? ([H3O+] = 10^-${ph} mol/L)`;
            break;
        case 'Prepa1': 
            k = Math.floor(Math.random() * 5) + 2; c = Math.floor(Math.random() * 10) + 2;
            expectedMass = k * c;
            if (DOM.qChem) DOM.qChem.textContent = `Vitesse v = k[A] ? (k=${k}, [A]=${c})`;
            break;
        case 'Prepa2': 
            h = Math.floor(Math.random() * 500) + 100; tS = Math.floor(Math.random() * 200) + 50;
            expectedMass = h - tS;
            if (DOM.qChem) DOM.qChem.textContent = `ΔG = ΔH - TΔS ? (ΔH=${h}, TΔS=${tS})`;
            break;
        case '2nde':
        default:
            let moles = Math.floor(Math.random() * (10 + hackerLevel)) + 4;
            expectedMass = moles * 28;
            if (DOM.qChem) DOM.qChem.textContent = `Masse de ${moles} mol de N2 ? (M=28g/mol)`;
            break;
    }
}
if (DOM.btnChem) DOM.btnChem.addEventListener('click', () => {
    if (isTutorialActive) return alert("Fonction bloquée pendant le tutoriel.");
    if (parseInt(DOM.ansChem.value, 10) === expectedMass) {
        checkAndUnlockAchievement('lab_chem'); let n2 = (3+Math.floor(coolerLevel/2))+Math.floor(hackerLevel/2); nitrogenCharges += n2; DOM.n2.textContent = formatShort(nitrogenCharges)+' U';
        addLog(`[CHIMIE] +${n2} U Azote.`, "text-success"); saveGame(); setTimeout(generateChemExercise, 5000);
    } else DOM.feedback.textContent = "[ERREUR] Masse/Valeur invalide.";
});

// =========================================================================
// 7. ALERTES ET PIRATAGES (ADAPTÉS PAR CLASSE)
// =========================================================================
function triggerCyberAttack() {
    if (isPaused || minerLevel === 0 || isTutorialActive) return;
    
    let qStr = "";
    
    if (currentGrade === '6eme') {
        let a = Math.floor(Math.random() * 9) + 2;
        let b = Math.floor(Math.random() * 9) + 2;
        if (Math.random() > 0.5) {
            attackAnswer = a + b;
            qStr = `${a} + ${b} = ?`;
        } else {
            attackAnswer = a * b;
            qStr = `${a} x ${b} = ?`;
        }
    } else if (['5eme', '4eme', '3eme'].includes(currentGrade)) {
        let a = Math.floor(Math.random()*10)+5, x = Math.floor(Math.random()*10)+5;
        attackAnswer = x; qStr = `${a} + x = ${a+x}`;
    } else if (currentGrade === 'Prepa1') {
        let p1a = Math.floor(Math.random()*4)+2, p1b = Math.floor(Math.random()*4)+2;
        attackAnswer = (p1a*p1a) + (p1b*p1b); qStr = `|${p1a} + ${p1b}i|² = ?`;
    } else if (currentGrade === 'Prepa2') {
        let p2a = Math.floor(Math.random()*10)+5, p2b = Math.floor(Math.random()*10)+5;
        attackAnswer = Math.max(p2a, p2b); qStr = `Max Val. Propre [[${p2a}, 1], [0, ${p2b}]] = ?`;
    } else {
        let a = Math.floor(Math.random()*4)+3, x = Math.floor(Math.random()*5)+2, b = Math.floor(Math.random()*6)+1;
        attackAnswer = x; qStr = `${a}x - ${b} = ${(a*x)-b}`;
    }
    
    DOM.qAtk.textContent = qStr; DOM.ansAtk.value = ''; DOM.atkOver.classList.remove('hidden'); DOM.ansAtk.focus(); attackTimeLeft = 100;
    
    attackTimerInterval = setInterval(() => {
        if (isPaused) return; attackTimeLeft -= 3; DOM.atkBar.style.width = `${attackTimeLeft}%`;
        if (attackTimeLeft <= 0) { clearInterval(attackTimerInterval); DOM.atkOver.classList.add('hidden'); let loss = Math.round(cryptoCredits*0.15); cryptoCredits -= loss; DOM.creditCount.textContent = formatShort(cryptoCredits); addLog(`[SÉCURITÉ] Brèche : -${formatShort(loss)} CC.`, "critical-heat"); saveGame(); refreshLiveLeaderboard(); }
    }, 300);
}

if (DOM.btnAtk) DOM.btnAtk.addEventListener('click', () => {
    if (parseInt(DOM.ansAtk.value, 10) === attackAnswer) { clearInterval(attackTimerInterval); DOM.atkOver.classList.add('hidden'); checkAndUnlockAchievement('hacker_attack'); addLog(`[SÉCURITÉ] Colmatée.`, "text-success"); DOM.ansMath.focus(); } 
    else { attackTimeLeft -= 15; DOM.ansAtk.value = ''; }
});

// =========================================================================
// 8. BOUTIQUE DE COMPOSANTS
// =========================================================================
function updateShopUI() {
    if (!DOM.bRam) return;
    DOM.shopRamT.textContent = `${RAM_UPGRADES[ramLevel].name} (${ramLevel}/100)`; DOM.shopRamC.textContent = ramLevel>=100?"MAX":`${formatShort(RAM_UPGRADES[ramLevel].cost)} CC`; DOM.ramStatus.textContent = ramLevel===0?"4 Go":RAM_UPGRADES[ramLevel-1].size; DOM.bRam.textContent = ramLevel>=100?"MAXED":"UPGRADE"; if(ramLevel>0) DOM.ramMod.classList.remove('hidden');
    DOM.shopMinerT.textContent = `${MINER_UPGRADES[minerLevel].name} (${minerLevel}/100)`; DOM.shopMinerC.textContent = minerLevel>=100?"MAX":`${formatShort(MINER_UPGRADES[minerLevel].cost)} CC`; DOM.bMiner.textContent = minerLevel>=100?"MAXED":(minerLevel===0?"RUN":"UPGRADE");
    DOM.shopHackT.textContent = `${HACKER_UPGRADES[hackerLevel].name||"MAX"} (${hackerLevel}/100)`; DOM.shopHackC.textContent = hackerLevel>=100?"MAX":`${formatShort(HACKER_UPGRADES[hackerLevel].cost)} CC`; DOM.bHack.textContent = hackerLevel>=100?"MAXED":"UPGRADE";
    DOM.shopCoolT.textContent = `${COOLER_UPGRADES[coolerLevel].name} (${coolerLevel}/100)`; DOM.shopCoolC.textContent = coolerLevel>=100?"MAX":`${formatShort(COOLER_UPGRADES[coolerLevel].cost)} CC`; DOM.bCooler.textContent = coolerLevel>=100?"MAXED":"UPGRADE";
    if(DOM.hintCost) DOM.hintCost.textContent = formatShort(Math.floor(1500*Math.pow(2, hackerLevel-1)));
    if(DOM.flushCost) DOM.flushCost.textContent = `${formatShort(Math.floor(50000*Math.pow(2, hackerLevel-1)))} CC`;

    let priceMult = Math.pow(1.75, hackerLevel-1), qtyMult = Math.pow(1.45, hackerLevel-1);
    let lck = coolerLevel < 7; DOM.n2Lock.textContent = lck ? "VERROUILLÉ (THERMAL 7)" : "DÉVERROUILLÉ"; DOM.n2Lock.style.color = lck ? "#ff3333" : "#00ff66";
    [DOM.bN2_1, DOM.bN2_2, DOM.bN2_3].forEach(b => { b.disabled = lck; });
    DOM.bN2_1.innerHTML = `+${formatShort(Math.floor(10*qtyMult))} U<br><span style="font-size:0.58rem;">${formatShort(Math.floor(2000*priceMult))} CC</span>`;
    DOM.bN2_2.innerHTML = `+${formatShort(Math.floor(100*qtyMult))} U<br><span style="font-size:0.58rem;">${formatShort(Math.floor(25000*priceMult))} CC</span>`;
    DOM.bN2_3.innerHTML = `+${formatShort(Math.floor(1000*qtyMult))} U<br><span style="font-size:0.58rem;">${formatShort(Math.floor(300000*priceMult))} CC</span>`;
}

if (DOM.bRam) DOM.bRam.addEventListener('click', () => { 
    if (isTutorialActive && tutorialStep !== 1) return alert("Suis les instructions du tutoriel !");
    if(ramLevel<100 && cryptoCredits>=RAM_UPGRADES[ramLevel].cost){ 
        cryptoCredits-=RAM_UPGRADES[ramLevel].cost; ramLevel++; DOM.creditCount.textContent=formatShort(cryptoCredits); applyRamVisuals(); checkGameProgressAchievements(); updateShopUI(); saveGame(); refreshLiveLeaderboard();
        if (isTutorialActive && tutorialStep === 1) { tutorialStep = 2; updateTutorial(2); }
    } 
});

if (DOM.bMiner) DOM.bMiner.addEventListener('click', () => { 
    if (isTutorialActive && tutorialStep !== 2) return alert("Suis les instructions du tutoriel !");
    if(minerLevel<100 && ramLevel>=MINER_UPGRADES[minerLevel].ramRequired && cryptoCredits>=MINER_UPGRADES[minerLevel].cost){ 
        cryptoCredits-=MINER_UPGRADES[minerLevel].cost; minerLevel++; DOM.creditCount.textContent=formatShort(cryptoCredits); checkGameProgressAchievements(); updateShopUI(); saveGame(); clearInterval(minerInterval); startMinerLoop(); refreshLiveLeaderboard();
        if (isTutorialActive && tutorialStep === 2) { tutorialStep = 3; updateTutorial(3); }
    } 
});

if (DOM.bHack) DOM.bHack.addEventListener('click', () => { 
    if (isTutorialActive) return alert("Fonction bloquée pendant le tutoriel.");
    if(hackerLevel<100 && cryptoCredits>=HACKER_UPGRADES[hackerLevel].cost){ cryptoCredits-=HACKER_UPGRADES[hackerLevel].cost; hackerLevel++; DOM.creditCount.textContent=formatShort(cryptoCredits); DOM.hackLvl.textContent=`LEVEL ${hackerLevel}`; checkGameProgressAchievements(); updateShopUI(); saveGame(); generateEquation(); refreshLiveLeaderboard();} 
});

if (DOM.bCooler) DOM.bCooler.addEventListener('click', () => { 
    if (isTutorialActive && tutorialStep !== 3) return alert("Suis les instructions du tutoriel !");
    if(coolerLevel<100 && cryptoCredits>=COOLER_UPGRADES[coolerLevel].cost){ 
        cryptoCredits-=COOLER_UPGRADES[coolerLevel].cost; coolerLevel++; DOM.creditCount.textContent=formatShort(cryptoCredits); checkGameProgressAchievements(); updateShopUI(); saveGame(); refreshLiveLeaderboard();
        if (isTutorialActive && tutorialStep === 3) { tutorialStep = 4; updateTutorial(4); }
    } 
});

if(DOM.bFlush) DOM.bFlush.addEventListener('click', () => { 
    if (isTutorialActive) return alert("Fonction bloquée pendant le tutoriel.");
    let c = Math.floor(50000*Math.pow(2, hackerLevel-1)); if(cryptoCredits>=c && !isPaused){ cryptoCredits-=c; DOM.creditCount.textContent=formatShort(cryptoCredits); cpuTemperature=35; DOM.cpuTemp.textContent="35°C"; DOM.cpuTemp.classList.remove('critical-heat'); checkAndUnlockAchievement('flush_used'); if(isCpuThrottled){isCpuThrottled=false;DOM.cpuWarn.style.display='none';let z=document.getElementById("thermal-rescue-actions");if(z)z.remove();generateEquation();} updateShopUI(); saveGame(); refreshLiveLeaderboard(); } 
});

function buyN2(a, c) { 
    if (isTutorialActive) return alert("Fonction bloquée pendant le tutoriel.");
    if(cryptoCredits>=c && coolerLevel>=7 && !isPaused){ cryptoCredits-=c; nitrogenCharges+=a; DOM.creditCount.textContent=formatShort(cryptoCredits); DOM.n2.textContent=formatShort(nitrogenCharges)+' U'; checkAndUnlockAchievement('nitrogen_first'); updateShopUI(); saveGame(); refreshLiveLeaderboard(); } 
}
if (DOM.bN2_1) DOM.bN2_1.addEventListener('click', () => buyN2(Math.floor(10*Math.pow(1.45,hackerLevel-1)), Math.floor(2000*Math.pow(1.75,hackerLevel-1))));
if (DOM.bN2_2) DOM.bN2_2.addEventListener('click', () => buyN2(Math.floor(100*Math.pow(1.45,hackerLevel-1)), Math.floor(25000*Math.pow(1.75,hackerLevel-1))));
if (DOM.bN2_3) DOM.bN2_3.addEventListener('click', () => buyN2(Math.floor(1000*Math.pow(1.45,hackerLevel-1)), Math.floor(300000*Math.pow(1.75,hackerLevel-1))));

if (DOM.bBoostCc) DOM.bBoostCc.addEventListener('click', () => { 
    if (isTutorialActive) return alert("Fonction bloquée pendant le tutoriel.");
    if(cryptoCredits>=5000000 && !boostCcActive && !isPaused){ cryptoCredits-=5000000; boostCcActive=true; DOM.bBoostCc.disabled=true; DOM.bBoostCc.textContent="ACTIF (30s)"; setTimeout(()=>{boostCcActive=false;DOM.bBoostCc.disabled=false;DOM.bBoostCc.textContent="BOOST (30s)";},30000); updateShopUI(); saveGame(); refreshLiveLeaderboard(); } 
});
if (DOM.bBoostTgt) DOM.bBoostTgt.addEventListener('click', () => { 
    if (isTutorialActive) return alert("Fonction bloquée pendant le tutoriel.");
    if(cryptoCredits>=15000000 && !boostTargetActive && !isPaused){ cryptoCredits-=15000000; boostTargetActive=true; DOM.bBoostTgt.disabled=true; DOM.bBoostTgt.textContent="ACTIF (30s)"; generateEquation(); setTimeout(()=>{boostTargetActive=false;DOM.bBoostTgt.disabled=false;DOM.bBoostTgt.textContent="BOOST (30s)";generateEquation();},30000); updateShopUI(); saveGame(); refreshLiveLeaderboard(); } 
});

function startMinerLoop() {
    if(minerInterval) clearInterval(minerInterval);
    minerInterval = setInterval(() => {
        if (isPaused) return; checkGameProgressAchievements(); let maxH = getMaxHeat();
        if (nitrogenCharges > 0 && !isCpuThrottled) {
            if (++nitrogenTimerCount >= 2) { 
                let cost = minerLevel===0?1:Math.floor(2*Math.pow(1.48, minerLevel));
                nitrogenCharges = Math.max(0, nitrogenCharges - cost); 
                DOM.n2.textContent = formatShort(nitrogenCharges)+' U'; 
                updateShopUI(); nitrogenTimerCount=0; 
                addLog(`[CLIMATISATION] -${formatShort(cost)} U d'Azote.`, "text-success");
            }
            if (cpuTemperature > 35) { cpuTemperature = Math.max(35, cpuTemperature-2); DOM.cpuTemp.textContent = `${cpuTemperature}°C`; }
        } else if (!isCpuThrottled && minerLevel > 0) { cpuTemperature += MINER_UPGRADES[minerLevel-1].heat; DOM.cpuTemp.textContent = `${cpuTemperature}°C`; }

        inactivityTime++; if (DOM.inactBar) DOM.inactBar.style.width = `${Math.max(0, 100-(inactivityTime/MAX_INACTIVITY)*100)}%`;
        if (inactivityTime >= MAX_INACTIVITY) { cryptoCredits = Math.max(0, cryptoCredits-2); DOM.creditCount.textContent = formatShort(cryptoCredits); }

        if (cpuTemperature >= maxH && !isCpuThrottled) {
            isCpuThrottled = true; if (DOM.cpuWarn) DOM.cpuWarn.style.display = 'inline'; DOM.cpuTemp.classList.add('critical-heat');
            let nCost = 15+Math.floor(coolerLevel/2), cCost = hackerLevel*150;
            let div = document.createElement('div'); div.id = "thermal-rescue-actions"; div.style.cssText="margin:8px 0;display:flex;gap:8px;";
            let b1 = document.createElement('button'); b1.textContent=`Injecter ${formatShort(nCost)} U`; b1.onclick = () => { if(nitrogenCharges>=nCost){ nitrogenCharges-=nCost; DOM.n2.textContent=formatShort(nitrogenCharges)+' U'; updateShopUI(); fix(); } };
            let b2 = document.createElement('button'); b2.textContent=`Reboot (${formatShort(cCost)} CC)`; b2.onclick = () => { if(cryptoCredits>=cCost){ cryptoCredits-=cCost; DOM.creditCount.textContent=formatShort(cryptoCredits); fix(); } };
            div.append(b1, b2); DOM.feedback.appendChild(div);
            let to = setTimeout(() => { if(isCpuThrottled) fix(); }, 300000);
            function fix() { isCpuThrottled=false; clearTimeout(to); if (DOM.cpuWarn) DOM.cpuWarn.style.display='none'; DOM.cpuTemp.classList.remove('critical-heat'); cpuTemperature=35; DOM.cpuTemp.textContent=`35°C`; let z=document.getElementById("thermal-rescue-actions"); if(z)z.remove(); generateEquation(); }
        }

        if (minerLevel > 0 && !isCpuThrottled) {
            cryptoCredits += isBoosted ? (MINER_UPGRADES[minerLevel-1].gain*2) : MINER_UPGRADES[minerLevel-1].gain;
            DOM.creditCount.textContent = formatShort(cryptoCredits);
            if (cpuTemperature >= (maxH-20)) DOM.cpuTemp.classList.add('critical-heat'); else DOM.cpuTemp.classList.remove('critical-heat');
            if (ramLevel > 0) { DOM.effBar.style.width = isBoosted ? "100%" : `${(minerLevel/100)*100}%`; DOM.netBar.style.width = `${Math.floor(Math.random()*20)+(isBoosted?75:1.8*minerLevel)}%`; }
        } else if (isCpuThrottled && ramLevel > 0) { DOM.effBar.style.width = "0%"; }
        
        if (Math.random() < 0.02 && DOM.atkOver && DOM.atkOver.classList.contains('hidden') && !isTutorialActive) triggerCyberAttack();
        saveGame(); refreshLiveLeaderboard();
    }, 1000);
}

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.mobile-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active'); let t = document.getElementById(btn.getAttribute('data-target')); if(t) t.classList.add('active');
        if(btn.getAttribute('data-target') === 'tab-leaderboard') {
            let tb = document.getElementById('tab-leaderboard'); if(tb) tb.classList.add('active');
            refreshLiveLeaderboard();
        }
    });
});

// =========================================================================
// 11. GESTION DU LOGIN ET SÉCURITÉ DES COMPTES
// =========================================================================
function showLoginScreen() {
    isPaused = true;
    const overlay = document.createElement('div'); overlay.id = 'login-overlay'; overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:9999;display:flex;justify-content:center;align-items:center;';
    
    overlay.innerHTML = `
        <div class="alert-box" style="width:300px;text-align:center;border-color:#00ff66;">
            <div class="alert-header" style="background:#00ff66;color:#000;">=== SYSTEM LOGIN ===</div>
            <div class="alert-body">
                <input type="text" id="login-username" placeholder="Pseudo..." style="width:100%;padding:10px;margin-bottom:10px;background:#000;border:1px solid #00ff66;color:#fff;text-align:center;text-transform:uppercase;">
                <input type="password" id="login-password" placeholder="Mot de passe..." style="width:100%;padding:10px;margin-bottom:10px;background:#000;border:1px solid #00ff66;color:#fff;text-align:center;">
                <select id="login-grade" style="width:100%;padding:10px;margin-bottom:10px;background:#000;border:1px solid #00ff66;color:#00ff66;text-align:center;cursor:pointer;">
                    <option value="6eme">6ème</option>
                    <option value="5eme">5ème</option>
                    <option value="4eme">4ème</option>
                    <option value="3eme">3ème</option>
                    <option value="2nde" selected>2nde</option>
                    <option value="1ere">1ère</option>
                    <option value="Terminale">Terminale</option>
                    <option value="Prepa1">Prépa 1A</option>
                    <option value="Prepa2">Prépa 2A</option>
                </select>
                <button id="btn-login" style="width:100%;padding:10px;background:#00ff66;color:#000;border:none;font-weight:bold;cursor:pointer;">CONNEXION</button>
                <p id="login-error" style="color:#ff3333; font-size:0.8rem; margin-top:10px; height:15px;"></p>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    
    const inpU = document.getElementById('login-username'), inpP = document.getElementById('login-password'), selectGrade = document.getElementById('login-grade'), btn = document.getElementById('btn-login'), err = document.getElementById('login-error'); 
    inpU.focus();
    
    function login() { 
        const u = inpU.value.trim().toUpperCase(); 
        const p = inpP.value.trim();
        const g = selectGrade.value;
        if(!u || !p) { err.textContent = "Champs requis."; return; }
        
        let existingPassword = null;
        let isUsernameUsed = false;
        
        for (let i = 0; i < localStorage.length; i++) {
            let k = localStorage.key(i);
            if (k.startsWith(`IdleTycoon_Save_${u}_`)) {
                isUsernameUsed = true;
                try {
                    let d = JSON.parse(localStorage.getItem(k));
                    if (d.password) { existingPassword = d.password; break; }
                } catch(e) {}
            }
        }
        
        if (isUsernameUsed && existingPassword && existingPassword !== p) {
            err.textContent = "Ce pseudo est déjà utilisé avec un autre mot de passe.";
            return;
        }

        overlay.remove(); loadSave(u, p, g); 
    }
    
    btn.addEventListener('click', login); 
    inpU.addEventListener('keydown', e => { if(e.key==='Enter') inpP.focus(); });
    inpP.addEventListener('keydown', e => { if(e.key==='Enter') login(); });
}

function loadSave(username, password, grade) {
    currentUser = username; currentPassword = password; currentGrade = grade;
    let h = document.querySelector('#tab-core .terminal-header'); if(h) h.textContent = `SYSTEM_CORE.EXE - USER: [${currentUser}] - CLASSE: [${getGradeDisplay(currentGrade).toUpperCase()}]`;
    
    let d = JSON.parse(localStorage.getItem(getSaveKey()));
    
    if(d) { 
        cryptoCredits=d.cryptoCredits||0; cpuTemperature=d.cpuTemperature||35; ramLevel=d.ramLevel||0; minerLevel=d.minerLevel||0; 
        hackerLevel=d.hackerLevel||1; coolerLevel=d.coolerLevel||0; currentTheme=d.currentTheme||'matrix'; 
        actionLogs=d.actionLogs||[]; mathStreak=d.mathStreak||0; nitrogenCharges=d.nitrogenCharges||0; unlockedAchievements=d.unlockedAchievements||[];
        hasCompletedTutorial=d.hasCompletedTutorial||false;
    } else { 
        cryptoCredits=0; cpuTemperature=35; ramLevel=0; minerLevel=0; hackerLevel=1; coolerLevel=0; currentTheme='matrix'; actionLogs=[]; mathStreak=0; nitrogenCharges=0; unlockedAchievements=[]; hasCompletedTutorial=false;
        saveGame(); 
    }
    
    let pSelect = document.getElementById('pause-grade-select');
    if (pSelect) pSelect.value = currentGrade;

    initLiveLeaderboard(); initGame();
    if (!hasCompletedTutorial) startTutorial();
}

function initGame() {
    isPaused = false; applyThemeVisuals(); applyRamVisuals();
    DOM.creditCount.textContent = formatShort(cryptoCredits); DOM.streak.textContent = `${mathStreak} 🔥`; DOM.n2.textContent = formatShort(nitrogenCharges)+' U'; DOM.cpuTemp.textContent = `${cpuTemperature}°C`; DOM.hackLvl.textContent = `LEVEL ${hackerLevel}`;
    DOM.logs.innerHTML = ''; actionLogs.slice().reverse().forEach(l => { let p = document.createElement('p'); p.className = `log-line ${l.type}`; p.textContent = l.text; DOM.logs.prepend(p); });
    
    let pSelect = document.getElementById('pause-grade-select');
    if (pSelect) pSelect.value = currentGrade;

    startMinerLoop(); updateShopUI(); generateEquation(); generateWaveSignal(); generateChemExercise(); refreshLiveLeaderboard();
}

showLoginScreen();