/**
 * Kids Gift Vault v2.0 - Enhanced Christmas Gift Reveal
 * Interactive games for Sean (8) and Paloma (6)
 */

// ========================================
// Audio Manager (Enhanced)
// ========================================

const AudioManager = {
    enabled: true,
    audioContext: null,
    masterGain: null,

    init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.5;
    },

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    // Play a musical note with envelope
    playNote(frequency, duration = 0.3, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = frequency;
        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.02);
        gain.gain.linearRampToValueAtTime(volume * 0.3, now + duration * 0.5);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    },

    // Play chord
    playChord(frequencies, duration = 0.5) {
        frequencies.forEach(f => this.playNote(f, duration, 'sine', 0.15));
    },

    // Simple click
    playClick() {
        this.playNote(800, 0.05, 'sine', 0.2);
    },

    // Whistle sound for penalty
    playWhistle() {
        this.playNote(1200, 0.15, 'sine', 0.4);
        setTimeout(() => this.playNote(1400, 0.1, 'sine', 0.3), 100);
    },

    // Ball kick sound
    playKick() {
        this.playNote(150, 0.1, 'triangle', 0.5);
        this.playNote(100, 0.15, 'sine', 0.3);
    },

    // Goal celebration with crowd roar
    playGoal() {
        // Ascending celebratory notes
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => {
            setTimeout(() => this.playNote(n, 0.2, 'triangle', 0.4), i * 100);
        });

        // Crowd roar effect (filtered noise)
        this.playCrowdRoar();
    },

    // Crowd roar (white noise with filter)
    playCrowdRoar() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const bufferSize = this.audioContext.sampleRate * 1.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        const gain = this.audioContext.createGain();
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
        gain.gain.linearRampToValueAtTime(0, now + 1.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    },

    // Save/miss sound
    playSave() {
        this.playNote(200, 0.2, 'sawtooth', 0.3);
        setTimeout(() => this.playNote(150, 0.3, 'sawtooth', 0.2), 150);
    },

    // Jingle Bells melody note
    playMelodyNote(frequency, duration = 0.4) {
        // Main note
        this.playNote(frequency, duration, 'sine', 0.4);
        // Add shimmer
        this.playNote(frequency * 2, duration * 0.5, 'triangle', 0.1);
    },

    // Magical sparkle
    playSparkle() {
        const notes = [1318, 1568, 1760];
        notes.forEach((n, i) => {
            setTimeout(() => this.playNote(n, 0.15, 'sine', 0.2), i * 50);
        });
    },

    // Grand finale for Paloma
    playGrandFinale() {
        // Chord progression
        this.playChord([523, 659, 784], 0.5);
        setTimeout(() => this.playChord([587, 740, 880], 0.5), 400);
        setTimeout(() => this.playChord([659, 784, 1047], 0.8), 800);
        setTimeout(() => this.playSparkle(), 1200);
    },

    // Portal charging sound
    playPortalCharge() {
        this.playNote(220, 0.5, 'sine', 0.2);
        this.playNote(330, 0.5, 'triangle', 0.15);
    },

    // Portal step complete
    playPortalStep() {
        const notes = [440, 554, 659];
        notes.forEach((n, i) => {
            setTimeout(() => this.playNote(n, 0.2, 'triangle', 0.3), i * 80);
        });
    },

    // Portal open magic
    playPortalOpen() {
        const notes = [220, 277, 330, 440, 554, 659, 880];
        notes.forEach((n, i) => {
            setTimeout(() => this.playNote(n, 0.4, 'triangle', 0.25), i * 100);
        });
    },

    // Victory fanfare
    playVictory() {
        this.playChord([523, 659, 784], 0.3);
        setTimeout(() => this.playChord([523, 659, 784], 0.3), 300);
        setTimeout(() => this.playChord([523, 659, 784], 0.3), 600);
        setTimeout(() => this.playChord([659, 784, 1047], 0.6), 900);
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

// ========================================
// Screen Navigation
// ========================================

function goToScreen(screenId) {
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

        AudioManager.playClick();

        // Initialize games when entering challenge screens
        if (actualScreenId === 'sean-challenge') {
            SeanGame.init();
        } else if (actualScreenId === 'paloma-challenge') {
            PalomaGame.init();
        } else if (actualScreenId === 'together-challenge') {
            PortalGame.init();
        } else if (actualScreenId === 'finale') {
            showFinale(finaleFor);
        } else if (actualScreenId === 'vault') {
            resetAllGames();
        }
    }
}

function resetAllGames() {
    SeanGame.reset();
    PalomaGame.reset();
    PortalGame.reset();
}

// ========================================
// Sean's Penalty Shootout Game
// ========================================

const SeanGame = {
    goals: 0,
    attempts: 7,
    targetGoals: 5,
    keeperPosition: 'center',
    keeperInterval: null,
    isKicking: false,
    gameOver: false,

    init() {
        this.reset();
        this.startKeeperMovement();
    },

    reset() {
        this.goals = 0;
        this.attempts = 7;
        this.isKicking = false;
        this.gameOver = false;

        if (this.keeperInterval) {
            clearInterval(this.keeperInterval);
            this.keeperInterval = null;
        }

        // Reset UI
        document.getElementById('sean-goals').textContent = '0';
        document.getElementById('kicks-left').textContent = '7';
        document.getElementById('sean-unlock').classList.add('hidden');
        document.getElementById('goal-text').classList.add('hidden');
        document.getElementById('save-text').classList.add('hidden');

        // Reset goalkeeper
        const keeper = document.getElementById('goalkeeper');
        keeper.classList.remove('dive-left', 'dive-right');
        keeper.style.left = '50%';

        // Reset aim buttons
        document.querySelectorAll('.aim-btn').forEach(btn => btn.classList.remove('selected'));
    },

    startKeeperMovement() {
        const positions = ['left', 'center', 'right'];
        const keeper = document.getElementById('goalkeeper');

        this.keeperInterval = setInterval(() => {
            if (this.isKicking || this.gameOver) return;

            this.keeperPosition = positions[Math.floor(Math.random() * 3)];

            // Move keeper visually
            switch (this.keeperPosition) {
                case 'left':
                    keeper.style.left = '25%';
                    break;
                case 'center':
                    keeper.style.left = '50%';
                    break;
                case 'right':
                    keeper.style.left = '75%';
                    break;
            }
        }, 800);
    },

    aim(direction) {
        if (this.isKicking || this.gameOver || this.attempts <= 0) return;

        // Highlight selected aim
        document.querySelectorAll('.aim-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelector(`.aim-btn[data-aim="${direction}"]`).classList.add('selected');

        // Kick after short delay
        setTimeout(() => this.kick(direction), 200);
    },

    kick(direction) {
        if (this.isKicking || this.gameOver) return;

        this.isKicking = true;
        this.attempts--;

        document.getElementById('kicks-left').textContent = this.attempts;

        // Play kick sound
        AudioManager.playKick();

        // Animate ball
        const ball = document.getElementById('ball');
        ball.classList.add(`kick-${direction}`);

        // Keeper dives to try to save
        const keeper = document.getElementById('goalkeeper');
        const keeperDive = this.keeperPosition;

        // Determine if goal
        const isGoal = direction !== keeperDive;

        // Show keeper dive animation
        if (keeperDive === 'left') {
            keeper.classList.add('dive-left');
        } else if (keeperDive === 'right') {
            keeper.classList.add('dive-right');
        }

        // Show result after ball animation
        setTimeout(() => {
            if (isGoal) {
                this.goals++;
                document.getElementById('sean-goals').textContent = this.goals;

                // Show GOAL text
                const goalText = document.getElementById('goal-text');
                goalText.classList.remove('hidden');
                AudioManager.playGoal();

                setTimeout(() => goalText.classList.add('hidden'), 1500);

                // Check win
                if (this.goals >= this.targetGoals) {
                    this.win();
                }
            } else {
                // Show SAVED text
                const saveText = document.getElementById('save-text');
                saveText.classList.remove('hidden');
                AudioManager.playSave();

                setTimeout(() => saveText.classList.add('hidden'), 1500);
            }

            // Reset for next kick
            setTimeout(() => {
                ball.classList.remove('kick-left', 'kick-center', 'kick-right');
                keeper.classList.remove('dive-left', 'dive-right');
                keeper.style.left = '50%';
                document.querySelectorAll('.aim-btn').forEach(btn => btn.classList.remove('selected'));

                this.isKicking = false;

                // Check if out of attempts
                if (this.attempts <= 0 && this.goals < this.targetGoals) {
                    this.lose();
                }
            }, 800);
        }, 500);
    },

    win() {
        this.gameOver = true;
        if (this.keeperInterval) clearInterval(this.keeperInterval);

        createConfetti();
        AudioManager.playVictory();

        setTimeout(() => {
            document.getElementById('sean-unlock').classList.remove('hidden');
        }, 1000);
    },

    lose() {
        // Give another chance - reset attempts
        this.attempts = 3;
        document.getElementById('kicks-left').textContent = '3';

        // Show encouraging message (could add UI for this)
        console.log('Almost! Try again with 3 more kicks!');
    }
};

// ========================================
// Paloma's Jingle Bells Melody Game
// ========================================

const PalomaGame = {
    currentNote: 0,
    totalNotes: 8,
    isPlaying: false,

    // Jingle Bells melody
    melody: [
        { note: 659, lyric: 'Jin-', duration: 0.3 },      // E4
        { note: 659, lyric: 'gle', duration: 0.3 },       // E4
        { note: 659, lyric: 'Bells', duration: 0.5 },     // E4
        { note: 659, lyric: 'Jin-', duration: 0.3 },      // E4
        { note: 659, lyric: 'gle', duration: 0.3 },       // E4
        { note: 659, lyric: 'Bells', duration: 0.5 },     // E4
        { note: 659, lyric: 'Jin-gle', duration: 0.3 },   // E4
        { note: 784, lyric: 'all the way!', duration: 0.8, finale: true } // G4
    ],

    init() {
        this.reset();
    },

    reset() {
        this.currentNote = 0;
        this.isPlaying = false;

        // Reset UI
        document.getElementById('melody-progress').textContent = 'Tap to start!';
        document.getElementById('lyrics-display').textContent = '';
        document.getElementById('paloma-unlock').classList.add('hidden');

        // Reset stars
        document.querySelectorAll('#star-progress .star').forEach(star => {
            star.classList.remove('lit');
            star.textContent = '\u2606';
        });

        // Reset stage
        document.querySelector('.stage-enhanced').classList.remove('active');
    },

    tap() {
        if (this.currentNote >= this.totalNotes) return;

        const noteData = this.melody[this.currentNote];

        // Play the note
        AudioManager.playMelodyNote(noteData.note, noteData.duration);

        // Show lyric
        const lyricsDisplay = document.getElementById('lyrics-display');
        lyricsDisplay.textContent = noteData.lyric;

        // Light up star
        const star = document.querySelector(`.star[data-index="${this.currentNote}"]`);
        if (star) {
            star.classList.add('lit');
            star.textContent = '\u2605';
        }

        // Add sparkles
        this.createSparkles();

        // Create floating music note
        this.createFloatingNote();

        // Activate stage
        document.querySelector('.stage-enhanced').classList.add('active');

        // Update progress
        this.currentNote++;
        const remaining = this.totalNotes - this.currentNote;
        if (remaining > 0) {
            document.getElementById('melody-progress').textContent = `${remaining} notes left!`;
        }

        // Check if complete
        if (this.currentNote >= this.totalNotes) {
            this.complete();
        }
    },

    createSparkles() {
        const container = document.getElementById('sparkle-container');
        const sparkles = ['\u2728', '\u2B50', '\u2727', '\u26A1'];

        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('span');
            sparkle.className = 'sparkle';
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            sparkle.style.left = `${20 + Math.random() * 60}%`;
            sparkle.style.top = `${20 + Math.random() * 60}%`;
            container.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 1000);
        }
    },

    createFloatingNote() {
        const container = document.getElementById('notes-container');
        const notes = ['\uD83C\uDFB5', '\uD83C\uDFB6', '\u2728', '\u2B50'];

        const note = document.createElement('span');
        note.className = 'music-note';
        note.textContent = notes[Math.floor(Math.random() * notes.length)];
        note.style.left = `${30 + Math.random() * 40}%`;
        note.style.bottom = '40%';
        container.appendChild(note);

        setTimeout(() => note.remove(), 1500);
    },

    complete() {
        document.getElementById('melody-progress').textContent = 'Perfect!';

        // Grand finale
        AudioManager.playGrandFinale();
        createConfetti();

        setTimeout(() => {
            document.getElementById('paloma-unlock').classList.remove('hidden');
            AudioManager.playVictory();
        }, 1500);
    }
};

// ========================================
// Together's Magic Portal Game
// ========================================

const PortalGame = {
    currentStep: 1,
    seanPressed: false,
    palomaPressed: false,
    holdProgress: 0,
    holdInterval: null,
    stepTimeout: null,
    gameComplete: false,

    init() {
        this.reset();
    },

    reset() {
        this.currentStep = 1;
        this.seanPressed = false;
        this.palomaPressed = false;
        this.holdProgress = 0;
        this.gameComplete = false;

        if (this.holdInterval) clearInterval(this.holdInterval);
        if (this.stepTimeout) clearTimeout(this.stepTimeout);

        // Reset UI
        document.getElementById('power-fill').style.width = '0%';
        document.getElementById('portal-progress').style.height = '0%';
        document.getElementById('portal-instruction').textContent = 'Both hold your orbs for 3 seconds!';
        document.getElementById('portal-instruction').classList.remove('success');
        document.getElementById('together-unlock').classList.add('hidden');
        document.getElementById('sackboy-reveal').classList.add('hidden');

        // Reset steps
        document.querySelectorAll('.step').forEach(s => {
            s.classList.remove('active', 'complete');
        });
        document.querySelector('.step[data-step="1"]').classList.add('active');

        // Reset orbs
        document.querySelectorAll('.magic-orb').forEach(orb => {
            orb.classList.remove('active', 'pressed');
        });

        // Reset portal
        document.getElementById('portal').classList.remove('charging', 'open');
    },

    orbPress(who) {
        if (this.gameComplete) return;

        if (who === 'sean') {
            this.seanPressed = true;
            document.getElementById('sean-orb').classList.add('pressed');
        } else {
            this.palomaPressed = true;
            document.getElementById('paloma-orb').classList.add('pressed');
        }

        AudioManager.playClick();

        // Handle based on current step
        if (this.currentStep === 1) {
            this.checkStep1();
        } else if (this.currentStep === 3) {
            this.checkStep3();
        }
    },

    orbRelease(who) {
        if (this.gameComplete) return;

        if (who === 'sean') {
            this.seanPressed = false;
            document.getElementById('sean-orb').classList.remove('pressed', 'active');
        } else {
            this.palomaPressed = false;
            document.getElementById('paloma-orb').classList.remove('pressed', 'active');
        }

        // If Step 1, reset hold progress
        if (this.currentStep === 1 && this.holdInterval) {
            clearInterval(this.holdInterval);
            this.holdInterval = null;

            // Reset progress if not complete
            if (this.holdProgress < 100) {
                this.holdProgress = 0;
                document.getElementById('power-fill').style.width = '0%';
                document.getElementById('portal-progress').style.height = '0%';
                document.getElementById('portal').classList.remove('charging');
            }
        }
    },

    checkStep1() {
        // Both must be pressed
        if (this.seanPressed && this.palomaPressed) {
            // Start hold timer
            document.getElementById('sean-orb').classList.add('active');
            document.getElementById('paloma-orb').classList.add('active');
            document.getElementById('portal').classList.add('charging');

            AudioManager.playPortalCharge();

            this.holdInterval = setInterval(() => {
                if (this.seanPressed && this.palomaPressed) {
                    this.holdProgress += 3.33; // 3 seconds = 100%
                    document.getElementById('power-fill').style.width = `${this.holdProgress}%`;
                    document.getElementById('portal-progress').style.height = `${this.holdProgress}%`;

                    if (this.holdProgress >= 100) {
                        clearInterval(this.holdInterval);
                        this.completeStep(1);
                    }
                }
            }, 100);
        }
    },

    checkStep3() {
        // Both must tap within 1 second
        if (!this.stepTimeout) {
            this.stepTimeout = setTimeout(() => {
                this.stepTimeout = null;
                this.seanPressed = false;
                this.palomaPressed = false;
            }, 1000);
        }

        if (this.seanPressed && this.palomaPressed) {
            if (this.stepTimeout) clearTimeout(this.stepTimeout);
            this.completeStep(3);
        }
    },

    completeStep(step) {
        AudioManager.playPortalStep();

        // Mark step complete
        document.querySelector(`.step[data-step="${step}"]`).classList.remove('active');
        document.querySelector(`.step[data-step="${step}"]`).classList.add('complete');

        if (step === 1) {
            // Move to step 2 (we'll simplify to just tap)
            this.currentStep = 2;
            document.querySelector('.step[data-step="2"]').classList.add('active');
            document.getElementById('portal-instruction').textContent = 'Now both tap together!';

            // For simplicity, skip step 2 swipe and go to step 3 tap
            setTimeout(() => {
                document.querySelector('.step[data-step="2"]').classList.remove('active');
                document.querySelector('.step[data-step="2"]').classList.add('complete');
                this.currentStep = 3;
                document.querySelector('.step[data-step="3"]').classList.add('active');
                document.getElementById('portal-instruction').textContent = 'Final tap together!';
            }, 500);

        } else if (step === 3) {
            this.openPortal();
        }
    },

    openPortal() {
        this.gameComplete = true;

        // Portal open animation
        document.getElementById('portal').classList.add('open');
        AudioManager.playPortalOpen();

        setTimeout(() => {
            // Reveal Sackboy
            document.getElementById('sackboy-reveal').classList.remove('hidden');
            document.getElementById('portal-instruction').textContent = 'You did it together!';
            document.getElementById('portal-instruction').classList.add('success');

            createConfetti();
            AudioManager.playVictory();

            setTimeout(() => {
                document.getElementById('together-unlock').classList.remove('hidden');
            }, 1000);
        }, 500);
    }
};

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

    createConfetti();
    AudioManager.playVictory();
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

        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        }

        container.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4000);
    }
}

// ========================================
// Snowfall Effect
// ========================================

function createSnowfall() {
    const container = document.getElementById('snowfall');
    const flakes = ['\u2744', '\u2745', '\u2746', '\u2022'];

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
        AudioManager.resume();
    }, { once: true });

    // Prevent context menu on long press (mobile)
    document.addEventListener('contextmenu', e => e.preventDefault());

    console.log('Gift Vault v2.0 initialized! Merry Christmas, Sean & Paloma! \uD83C\uDF84');
});
