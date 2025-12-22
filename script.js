/**
 * Kids Gift Vault - Interactive Christmas Gift Reveal
 * State machine + interactions for Sean (8) and Paloma (6)
 */

// ========================================
// Audio Manager
// ========================================

const AudioManager = {
    enabled: true,
    sounds: {},
    audioContext: null,

    init() {
        // Create sounds using oscillator for now (fallback if no audio files)
        // In production, replace with actual audio files
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    },

    // Simple beep sound generator
    beep(frequency = 440, duration = 0.1, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;

        // Resume audio context (required after user interaction)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },

    playClick() {
        this.beep(800, 0.05, 'sine');
    },

    playGoal() {
        // Celebratory sound - ascending notes
        this.beep(523, 0.1); // C
        setTimeout(() => this.beep(659, 0.1), 100); // E
        setTimeout(() => this.beep(784, 0.1), 200); // G
        setTimeout(() => this.beep(1047, 0.2), 300); // High C
    },

    playMicTap() {
        // Musical note
        const notes = [523, 587, 659, 698, 784]; // C, D, E, F, G
        const note = notes[Math.floor(Math.random() * notes.length)];
        this.beep(note, 0.3, 'triangle');
    },

    playMagic() {
        // Magical chime - descending sparkle
        this.beep(1318, 0.1);
        setTimeout(() => this.beep(1174, 0.1), 80);
        setTimeout(() => this.beep(987, 0.1), 160);
        setTimeout(() => this.beep(880, 0.15), 240);
    },

    playSuccess() {
        // Victory fanfare
        this.beep(784, 0.15);
        setTimeout(() => this.beep(784, 0.15), 180);
        setTimeout(() => this.beep(784, 0.15), 360);
        setTimeout(() => this.beep(1047, 0.3), 540);
    },

    playFail() {
        // Gentle "try again" sound
        this.beep(300, 0.15);
        setTimeout(() => this.beep(250, 0.2), 150);
    },

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
};

// ========================================
// State Management
// ========================================

let currentScreen = 'welcome';
let kickCount = 0;
let micCount = 0;
let ornamentTaps = { sean: 0, paloma: 0 };
let ornamentTimeout = null;

// ========================================
// Screen Navigation
// ========================================

function goToScreen(screenId) {
    // Handle finale variants
    let actualScreenId = screenId;
    let finaleFor = null;

    if (screenId.startsWith('finale-')) {
        finaleFor = screenId.replace('finale-', '');
        actualScreenId = 'finale';
    }

    // Hide current screen
    const currentEl = document.getElementById(`screen-${currentScreen}`);
    if (currentEl) {
        currentEl.classList.remove('active');
    }

    // Show new screen
    const newEl = document.getElementById(`screen-${actualScreenId}`);
    if (newEl) {
        newEl.classList.add('active');
        currentScreen = actualScreenId;

        // Play click sound
        AudioManager.playClick();

        // Special handling for finale
        if (actualScreenId === 'finale') {
            showFinale(finaleFor);
        }

        // Reset challenge states when going back to vault
        if (actualScreenId === 'vault') {
            resetChallenges();
        }
    }
}

function resetChallenges() {
    // Reset Sean's challenge
    kickCount = 0;
    document.getElementById('kick-count').textContent = '0';
    document.getElementById('sean-unlock').classList.add('hidden');

    // Reset Paloma's challenge
    micCount = 0;
    document.getElementById('mic-count').textContent = '0';
    document.getElementById('paloma-unlock').classList.add('hidden');
    document.getElementById('notes-container').innerHTML = '';

    // Reset Together challenge
    ornamentTaps = { sean: 0, paloma: 0 };
    document.getElementById('together-unlock').classList.add('hidden');
    document.getElementById('together-hint').textContent = 'Both tap together!';
    document.getElementById('together-hint').className = 'together-hint';
}

// ========================================
// Sean's Football Challenge
// ========================================

function kickBall() {
    if (kickCount >= 10) return;

    const football = document.getElementById('football');
    football.classList.add('kick');

    setTimeout(() => {
        football.classList.remove('kick');
    }, 300);

    kickCount++;
    document.getElementById('kick-count').textContent = kickCount;

    if (kickCount < 10) {
        AudioManager.playClick();
    }

    if (kickCount === 10) {
        // Goal celebration!
        AudioManager.playGoal();
        createConfetti();

        setTimeout(() => {
            document.getElementById('sean-unlock').classList.remove('hidden');
            AudioManager.playSuccess();
        }, 500);
    }
}

// ========================================
// Paloma's Microphone Challenge
// ========================================

function tapMic() {
    if (micCount >= 5) return;

    // Create floating music note
    const notesContainer = document.getElementById('notes-container');
    const notes = ['🎵', '🎶', '✨', '⭐', '🌟'];
    const note = document.createElement('span');
    note.className = 'music-note';
    note.textContent = notes[Math.floor(Math.random() * notes.length)];
    note.style.left = `${30 + Math.random() * 40}%`;
    note.style.bottom = '30%';
    notesContainer.appendChild(note);

    // Remove note after animation
    setTimeout(() => {
        note.remove();
    }, 1500);

    AudioManager.playMicTap();

    micCount++;
    document.getElementById('mic-count').textContent = micCount;

    if (micCount === 5) {
        // Stage celebration!
        createConfetti();

        setTimeout(() => {
            document.getElementById('paloma-unlock').classList.remove('hidden');
            AudioManager.playSuccess();
        }, 500);
    }
}

// ========================================
// Together's Co-op Challenge
// ========================================

function tapOrnament(who) {
    const ornament = document.getElementById(`ornament-${who}`);
    ornament.classList.add('tapped');

    setTimeout(() => {
        ornament.classList.remove('tapped');
    }, 500);

    const now = Date.now();
    ornamentTaps[who] = now;

    AudioManager.playClick();

    // Check if both tapped within 2 seconds
    const other = who === 'sean' ? 'paloma' : 'sean';
    const timeDiff = Math.abs(ornamentTaps[who] - ornamentTaps[other]);

    if (ornamentTaps[other] > 0 && timeDiff < 2000) {
        // Success!
        const hint = document.getElementById('together-hint');
        hint.textContent = 'You did it together!';
        hint.className = 'together-hint success';

        AudioManager.playMagic();
        createConfetti();

        setTimeout(() => {
            document.getElementById('together-unlock').classList.remove('hidden');
            AudioManager.playSuccess();
        }, 500);
    } else if (ornamentTaps.sean > 0 && ornamentTaps.paloma > 0 && timeDiff >= 2000) {
        // Failed - taps too far apart
        const hint = document.getElementById('together-hint');
        hint.textContent = 'Try again together!';
        hint.className = 'together-hint fail';

        AudioManager.playFail();

        // Reset after shake animation
        setTimeout(() => {
            ornamentTaps = { sean: 0, paloma: 0 };
            hint.textContent = 'Both tap together!';
            hint.className = 'together-hint';
        }, 1000);
    }
}

// ========================================
// Finale Screen
// ========================================

function showFinale(who) {
    const title = document.getElementById('finale-title');
    const names = document.getElementById('finale-names');

    if (who === 'sean') {
        title.textContent = 'Merry Christmas!';
        names.textContent = 'Sean';
    } else if (who === 'paloma') {
        title.textContent = 'Merry Christmas!';
        names.textContent = 'Paloma';
    } else {
        title.textContent = 'Merry Christmas!';
        names.textContent = 'Sean & Paloma';
    }

    // Trigger confetti
    createConfetti();
    AudioManager.playSuccess();
}

// ========================================
// Confetti Effect
// ========================================

function createConfetti() {
    const container = document.getElementById('confetti-container') ||
                      document.querySelector('.confetti-container') ||
                      document.body;

    const colors = ['#C41E3A', '#228B22', '#FFD700', '#FFFFFF', '#FF69B4', '#4169E1'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.setProperty('--fall-time', `${2 + Math.random() * 2}s`);
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;

        // Random shape
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        }

        container.appendChild(confetti);

        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, 4000);
    }
}

// ========================================
// Snowfall Effect
// ========================================

function createSnowfall() {
    const container = document.getElementById('snowfall');
    const flakes = ['❄', '❅', '❆', '•'];

    for (let i = 0; i < 30; i++) {
        const snowflake = document.createElement('span');
        snowflake.className = 'snowflake';
        snowflake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
        snowflake.style.left = `${Math.random() * 100}%`;
        snowflake.style.fontSize = `${0.5 + Math.random() * 1}rem`;
        snowflake.style.setProperty('--fall-time', `${8 + Math.random() * 8}s`);
        snowflake.style.animationDelay = `${Math.random() * 8}s`;
        snowflake.style.opacity = 0.3 + Math.random() * 0.5;

        container.appendChild(snowflake);
    }
}

// ========================================
// Sound Toggle
// ========================================

function setupSoundToggle() {
    const toggle = document.getElementById('sound-toggle');
    const soundOn = toggle.querySelector('.sound-on');
    const soundOff = toggle.querySelector('.sound-off');

    toggle.addEventListener('click', () => {
        const enabled = AudioManager.toggle();
        soundOn.style.display = enabled ? 'inline' : 'none';
        soundOff.style.display = enabled ? 'none' : 'inline';
    });
}

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio manager
    AudioManager.init();

    // Create snowfall
    createSnowfall();

    // Setup sound toggle
    setupSoundToggle();

    // First interaction to enable audio
    document.body.addEventListener('click', () => {
        if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
            AudioManager.audioContext.resume();
        }
    }, { once: true });

    console.log('Gift Vault initialized! Merry Christmas, Sean & Paloma! 🎄');
});
