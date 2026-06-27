// ============================================================
// Web Audio API Sound Engine — tactile mechanical keyboard
// Exposes window.playSound so other modules can trigger clicks.
// ============================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext!;
const audioCtx = new AudioCtx();

// Pre-build a short white-noise buffer for the key "click" transient
const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
const noiseData = noiseBuffer.getChannelData(0);
for (let i = 0; i < noiseData.length; i++) {
	noiseData[i] = Math.random() * 2 - 1;
}

// Browser autoplay policy: audio stays suspended until the first user
// gesture of ANY kind. Unlock on the first one anywhere on the page.
const unlockAudio = () => {
	if (audioCtx.state === 'suspended') audioCtx.resume();
	window.removeEventListener('pointerdown', unlockAudio);
	window.removeEventListener('keydown', unlockAudio);
	window.removeEventListener('touchstart', unlockAudio);
	window.removeEventListener('scroll', unlockAudio);
	window.removeEventListener('mousemove', unlockAudio);
};
['pointerdown', 'keydown', 'touchstart', 'scroll', 'mousemove'].forEach(ev =>
	window.addEventListener(ev, unlockAudio, { once: true, passive: true })
);

// Tactile keyboard switch: noise burst (key contact) + low "thock" body.
const emit = (type: 'click' | 'hover') => {
	const t = audioCtx.currentTime;
	const out = audioCtx.createGain();
	out.gain.value = type === 'click' ? 0.35 : 0.18; // hover quieter
	out.connect(audioCtx.destination);

	// 1) Contact transient — filtered noise, very fast decay
	const noise = audioCtx.createBufferSource();
	noise.buffer = noiseBuffer;
	const bp = audioCtx.createBiquadFilter();
	bp.type = 'bandpass';
	bp.frequency.value = type === 'click' ? 2200 : 3200;
	bp.Q.value = 0.8;
	const nGain = audioCtx.createGain();
	nGain.gain.setValueAtTime(0.6, t);
	nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
	noise.connect(bp).connect(nGain).connect(out);
	noise.start(t);
	noise.stop(t + 0.05);

	// 2) Thock body — low triangle thump for the keycap bottom-out
	const osc = audioCtx.createOscillator();
	osc.type = 'triangle';
	const f0 = type === 'click' ? 180 : 260;
	osc.frequency.setValueAtTime(f0, t);
	osc.frequency.exponentialRampToValueAtTime(f0 * 0.45, t + 0.04);
	const oGain = audioCtx.createGain();
	oGain.gain.setValueAtTime(0.0001, t);
	oGain.gain.exponentialRampToValueAtTime(type === 'click' ? 0.35 : 0.18, t + 0.004);
	oGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
	osc.connect(oGain).connect(out);
	osc.start(t);
	osc.stop(t + 0.08);
};

export const playSound = (type: 'click' | 'hover') => {
	// If still suspended (e.g. first interaction's resume hasn't
	// resolved yet), resume then play once it's actually running.
	if (audioCtx.state !== 'running') {
		audioCtx.resume().then(() => emit(type)).catch(() => {});
		return;
	}
	emit(type);
};

// Keep the global hook so legacy inline references keep working.
window.playSound = playSound;
