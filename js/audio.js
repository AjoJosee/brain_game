// Web Audio API Sound Synthesizer for BrainBoost
const AudioEngine = {
    ctx: null,
    muted: false,

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
    },

    ensureContext() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    },

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error('Audio error', e);
        }
    },

    playClick() {
        this.playTone(600, 'sine', 0.05, 0.08);
    },

    playFlip() {
        this.playTone(400, 'triangle', 0.08, 0.1);
    },

    playMatch() {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        
        // Play harmonious ascending chord (C5 - E5 - G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.2, 0.12);
            }, idx * 60);
        });
    },

    playWrong() {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;

        // Low buzz frequency drop
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.25);

            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.25);
        } catch (e) {}
    },

    playSequenceBeep(index) {
        // Frequencies for Simon Says (Red, Blue, Green, Yellow)
        const freqs = [329.63, 261.63, 392.00, 440.00]; // E4, C4, G4, A4
        const freq = freqs[index % freqs.length] || 440;
        this.playTone(freq, 'sine', 0.3, 0.15);
    },

    playFanfare() {
        if (this.muted) return;
        const melody = [523.25, 659.25, 783.99, 1046.50];
        melody.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.3, 0.15);
            }, i * 100);
        });
    }
};

window.AudioEngine = AudioEngine;
