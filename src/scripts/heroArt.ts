// ============================================================
// Animated Hero Art Console (typewriter boot + generative canvas)
// Exposes window.changeVantaArt + window.artModifiers for the console.
// ============================================================

// Art style presets (used to tint the hero glow).
const ART_STYLES: Record<string, { heroColor: string }> = {
	indigo:  { heroColor: 'rgba(99, 102, 241, 0.18)' },
	aurora:  { heroColor: 'rgba(16, 185, 129, 0.18)' },
	sunset:  { heroColor: 'rgba(239, 68, 68, 0.20)' },
	ocean:   { heroColor: 'rgba(59, 130, 246, 0.18)' },
	void:    { heroColor: 'rgba(0, 0, 0, 0)' },
	rose:    { heroColor: 'rgba(236, 72, 153, 0.18)' },
};

export const applyArt = (name: string) => {
	const style = ART_STYLES[name];
	if (!style) return;
	const heroEl = document.querySelector('.hero-tech') as HTMLElement | null;
	if (!heroEl) return;
	heroEl.style.setProperty('--hero-glow-color', style.heroColor);
	// Patch the pseudo-element via a dynamic <style>
	let dynStyle = document.getElementById('dyn-art-style') as HTMLStyleElement | null;
	if (!dynStyle) {
		dynStyle = document.createElement('style');
		dynStyle.id = 'dyn-art-style';
		document.head.appendChild(dynStyle);
	}
	dynStyle.textContent = `.hero-tech::before { background: radial-gradient(circle at var(--hero-x,50%) var(--hero-y,35%), ${style.heroColor} 0%, rgba(0,0,0,0) 55%) !important; }`;
};

const artBody = document.getElementById('hero-art-body');
if (artBody) {
	const bootSequence = [
		"[INFO] Init kernel...",
		"[OK] Boot verified",
		"[INFO] Loading UI...",
		" > @design/glass... DONE",
		" > @physics/mag... DONE",
		"[OK] Modules loaded",
		"[WARN] Root bypass...",
		"[OK] System ready.",
		" ",
		"INIT ART SEQUENCE..."
	];

	let lineIdx = 0;
	let charIdx = 0;

	let currentCanvasAnim: number | null = null;
	window.artModifiers = { noise: 1, scale: 1, velocity: 1 };

	const initCanvasArt = (effectIdx?: number) => {
		if (!artBody) return;
		if (artBody.classList.contains('typing')) return; // Do not interrupt boot sequence

		if (currentCanvasAnim) {
			cancelAnimationFrame(currentCanvasAnim);
			currentCanvasAnim = null;
		}

		artBody.innerHTML = '<canvas id="hero-canvas" style="width:100%; height:100%; display:block;"></canvas>';
		const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const resize = () => {
			if (!canvas.parentElement) return;
			canvas.width = canvas.parentElement.clientWidth;
			canvas.height = canvas.parentElement.clientHeight;
		};
		resize();
		window.addEventListener('resize', resize);

		const seed = effectIdx !== undefined ? effectIdx : Math.floor(Math.random() * 1000);
		const mods = window.artModifiers || { noise: 1, scale: 1, velocity: 1 };

		// Pseudo-random generator based on seed
		const prng = (offset: number) => {
			let x = Math.sin(seed + offset * 1.2345) * 10000;
			return x - Math.floor(x);
		};

		const baseMode = Math.floor(prng(1) * 5); // 5 base algorithms

		if (baseMode === 0) {
			// 1. MATRIX RAIN
			const charSets = ['01', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*', 'アカサタナハマヤラワいきしちにひみりゐぐずぶづ', '0123456789ABCDEF'];
			const chars = charSets[Math.floor(prng(2) * charSets.length)].split('');
			const fontSize = (10 + Math.floor(prng(3) * 14)) * mods.scale;
			const columns = Math.floor(canvas.width / Math.max(fontSize, 1)) + 1;
			const drops: number[] = [];
			for(let x = 0; x < columns; x++) drops[x] = prng(4+x) * -100;
			const fade = Math.min((0.05 + prng(5) * 0.15) * mods.noise, 1);
			const speed = (20 + prng(6) * 50) / mods.velocity;

			let lastDraw = 0;
			const draw = (now: number) => {
				currentCanvasAnim = requestAnimationFrame(draw);
				if (now - lastDraw < speed) return;
				lastDraw = now;
				ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = '#4ade80';
				ctx.font = fontSize + 'px ui-monospace, monospace';
				for(let i = 0; i < drops.length; i++) {
					const text = chars[Math.floor(Math.random() * chars.length)];
					ctx.fillText(text, i * fontSize, drops[i] * fontSize);
					if(drops[i] * fontSize > canvas.height && Math.random() > 0.95) drops[i] = 0;
					drops[i]++;
				}
			};
			requestAnimationFrame(draw);

		} else if (baseMode === 1) {
			// 2. WAVES
			const lines = Math.floor((2 + Math.floor(prng(2) * 8)) * mods.noise);
			const speedMultiplier = (0.01 + prng(3) * 0.08) * mods.velocity;
			const amp1 = (10 + prng(4) * 50) * mods.scale;
			const amp2 = (10 + prng(5) * 40) * mods.scale;
			const freq1 = (0.005 + prng(6) * 0.03) * mods.noise;
			const freq2 = (0.1 + prng(7) * 0.8) * mods.noise;
			const isVertical = prng(8) > 0.5;

			let time = 0;
			const draw = () => {
				ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
				ctx.lineWidth = Math.max(1, (1 + prng(9) * 2) * mods.scale);
				ctx.beginPath();

				for(let i = 0; i < lines; i++) {
					for(let x = 0; x < (isVertical ? canvas.height : canvas.width); x += 5) {
						const wave = Math.sin(x * freq1 + time + i) * (amp1 + Math.sin(time * freq2 + i) * amp2);
						const drawX = isVertical ? canvas.width/2 + wave : x;
						const drawY = isVertical ? x : canvas.height/2 + wave;
						if (x === 0) ctx.moveTo(drawX, drawY);
						else ctx.lineTo(drawX, drawY);
					}
				}
				ctx.stroke();
				time += speedMultiplier;
				currentCanvasAnim = requestAnimationFrame(draw);
			};
			draw();

		} else if (baseMode === 2) {
			// 3. CONSTELLATION NETWORK
			const particles: any[] = [];
			const num = Math.floor(((canvas.width * canvas.height) / (3000 + prng(2)*8000)) * mods.noise);
			const connectDist = (50 + prng(3) * 100) * mods.scale;
			const maxSpeed = (0.5 + prng(4) * 2) * mods.velocity;

			for(let i=0; i<num; i++) {
				particles.push({
					x: Math.random() * canvas.width, y: Math.random() * canvas.height,
					vx: (Math.random() - 0.5) * maxSpeed, vy: (Math.random() - 0.5) * maxSpeed
				});
			}

			const draw = () => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = '#4ade80';
				particles.forEach(p => {
					p.x += p.vx; p.y += p.vy;
					if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
					if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
					ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, 2 * mods.scale), 0, Math.PI*2); ctx.fill();
				});

				ctx.lineWidth = 0.5;
				for(let i=0; i<particles.length; i++) {
					for(let j=i+1; j<particles.length; j++) {
						const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
						if (dist < connectDist) {
							ctx.strokeStyle = `rgba(74, 222, 128, ${1 - dist/connectDist})`;
							ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
						}
					}
				}
				currentCanvasAnim = requestAnimationFrame(draw);
			};
			draw();
		} else if (baseMode === 3) {
			// 4. ORBITING GEOMETRY
			const numRings = Math.floor((3 + Math.floor(prng(2) * 10)) * mods.noise);
			const centerX = canvas.width / 2;
			const centerY = canvas.height / 2;
			const baseRadius = (20 + prng(3) * 50) * mods.scale;

			let time = 0;
			const draw = () => {
				ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.strokeStyle = '#4ade80';

				for(let i = 1; i <= numRings; i++) {
					ctx.beginPath();
					const radius = baseRadius * i + Math.sin(time * 2 + i) * 20 * mods.scale;
					ctx.arc(
						centerX + Math.cos(time + i) * 30 * mods.scale,
						centerY + Math.sin(time * 0.5 + i) * 30 * mods.scale,
						Math.max(1, Math.abs(radius)), 0, Math.PI * 2
					);
					ctx.stroke();
				}
				time += 0.02 * mods.velocity;
				currentCanvasAnim = requestAnimationFrame(draw);
			};
			draw();
		} else {
			// 5. VOXEL/GRID TUNNEL
			let time = 0;
			const gridSize = Math.max(5, (20 + Math.floor(prng(2)*30)) * mods.scale);
			const draw = () => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';

				for(let x = 0; x < canvas.width; x += gridSize) {
					for(let y = 0; y < canvas.height; y += gridSize) {
						const dx = x - canvas.width/2;
						const dy = y - canvas.height/2;
						const dist = Math.hypot(dx, dy);
						const scale = (Math.sin(dist * 0.02 * mods.noise - time * 3) + 1) * 0.5;

						if (scale > 0.2) {
							ctx.strokeRect(
								x + gridSize/2 - (gridSize*scale)/2,
								y + gridSize/2 - (gridSize*scale)/2,
								gridSize*scale,
								gridSize*scale
							);
						}
					}
				}
				time += 0.05 * mods.velocity;
				currentCanvasAnim = requestAnimationFrame(draw);
			};
			draw();
		}
	};

	window.changeVantaArt = initCanvasArt;

	artBody.classList.add('typing');

	const typeArt = () => {
		if (lineIdx >= bootSequence.length) {
			setTimeout(() => {
				artBody.classList.remove('typing');
				initCanvasArt();
			}, 800);
			return;
		}

		const currentLine = bootSequence[lineIdx];

		if (charIdx === 0 && lineIdx > 0) {
			artBody.innerHTML += '<br>';
		}

		if (charIdx < currentLine.length) {
			artBody.innerHTML += currentLine[charIdx];
			charIdx++;
			setTimeout(typeArt, Math.random() * 30 + 10);
		} else {
			lineIdx++;
			charIdx = 0;
			setTimeout(typeArt, Math.random() * 400 + 100);
		}
	};

	setTimeout(typeArt, 800);
}
