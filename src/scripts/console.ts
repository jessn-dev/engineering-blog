// ============================================================
// Interactive Console (global app UI) + music & theme engines
// ============================================================

// ---- Music Engine (Lo-Fi Radio Stream) ----
let musicAudio: HTMLAudioElement | null = null;
let musicPlaying = false;
let musicVol = 0.25;
const LOFI_STREAM_URL = 'https://ice1.somafm.com/groovesalad-128-mp3';

const startMusic = (printFn: (s: string, c?: string) => void) => {
	if (musicPlaying) { printFn('Already playing. Use "music stop" first.', 'muted'); return; }
	if (!musicAudio) {
		musicAudio = new Audio(LOFI_STREAM_URL);
		musicAudio.crossOrigin = 'anonymous';
	}
	musicAudio.volume = musicVol;
	musicAudio.play().then(() => {
		musicPlaying = true;
		printFn('&#9835; Playing SomaFM Groove Salad (100% ad-free stream)...', 'success');
	}).catch(err => {
		printFn('Failed to connect to stream: ' + err.message, 'error');
	});
};

const stopMusic = (printFn: (s: string, c?: string) => void) => {
	if (!musicPlaying || !musicAudio) { printFn('Nothing is playing.', 'muted'); return; }
	musicAudio.pause();
	musicPlaying = false;
	printFn('&#9646; Stopped.', 'muted');
};

// ---- Theme Engine ----
const THEMES: Record<string, Record<string, string>> = {
	default: { '--bg-color': '#000000', '--accent': '#6366f1', '--accent-secondary': '#818cf8', '--text-muted': '#888888' },
	purple:  { '--bg-color': '#07000f', '--accent': '#a855f7', '--accent-secondary': '#d946ef', '--text-muted': '#9ca3af' },
	green:   { '--bg-color': '#000a02', '--accent': '#22c55e', '--accent-secondary': '#4ade80', '--text-muted': '#6b7280' },
	red:     { '--bg-color': '#0f0000', '--accent': '#ef4444', '--accent-secondary': '#f97316', '--text-muted': '#9ca3af' },
	blue:    { '--bg-color': '#00000f', '--accent': '#3b82f6', '--accent-secondary': '#06b6d4', '--text-muted': '#9ca3af' },
	mono:    { '--bg-color': '#000000', '--accent': '#e5e7eb', '--accent-secondary': '#9ca3af', '--text-muted': '#6b7280' },
};

const applyTheme = (name: string) => {
	const vars = THEMES[name];
	if (!vars) return;
	Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
};

// ---- Console UI ----
(() => {
	const term = document.getElementById('term');
	const toggleBtn = document.getElementById('term-toggle');
	const closeBtn = document.getElementById('term-close');
	const body = document.getElementById('term-body');
	const output = document.getElementById('term-output');
	const input = document.getElementById('term-input') as HTMLInputElement | null;
	if (!term || !toggleBtn || !closeBtn || !body || !output || !input) return;

	let cdata: { posts: any[]; categories: string[] } = { posts: [], categories: [] };
	try {
		cdata = JSON.parse(document.getElementById('console-data')?.textContent || '{}');
	} catch (e) { /* noop */ }

	const history: string[] = [];
	let histIdx = -1;

	const scrollDown = () => { body.scrollTop = body.scrollHeight; };
	const print = (html: string, cls = '') => {
		const line = document.createElement('div');
		line.className = 'term-line' + (cls ? ' ' + cls : '');
		line.innerHTML = html;
		output.appendChild(line);
		scrollDown();
	};
	const printPrompt = (cmd: string) => {
		print('<span style="color:#4ade80;font-weight:600">visitor@jbn</span>'
			+ '<span style="color:rgba(255,255,255,.4)">:</span>~$ '
			+ '<span style="color:#fff">' + escapeHtml(cmd) + '</span>', 'cmd');
	};
	const escapeHtml = (s: string) =>
		s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	const commands: Record<string, (args: string[]) => void> = {
		help: () => {
			print('Available commands:', 'accent');
			const cmds: [string, string][] = [
				['help',           'show this list'],
				['music',          'play some tunes'],
				['art',            'configure hero artwork'],
				['footer',         'set footer text'],
				['snake',          'play snake'],
				['history',        'command history'],
				['date',           'current date'],
				['clear',          'clear the screen'],
				['exit',           'close the console'],
			];
			const cells = cmds.map(([c, d]) =>
				'<div style="display:flex;flex-direction:column;gap:1px;min-width:0">'
				+ '<span style="color:#818cf8;white-space:nowrap">' + c + '</span>'
				+ '<span style="color:rgba(255,255,255,.4);font-size:0.78em;white-space:nowrap">' + d + '</span>'
				+ '</div>'
			).join('');
			const grid = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.6rem 1rem;padding:0.5rem 0">' + cells + '</div>';
			const wrapper = document.createElement('div');
			wrapper.className = 'term-line';
			wrapper.innerHTML = grid;
			output.appendChild(wrapper);
			scrollDown();
		},
		date: () => print(new Date().toString(), 'muted'),
		echo: (args) => print(escapeHtml(args.join(' '))),
		clear: () => { output.innerHTML = ''; },
		exit: () => closeConsole(),
		close: () => closeConsole(),
		sudo: () => print('Nice try. 😏', 'muted'),
		whoami: () => print('visitor', 'muted'),
		history: () => {
			if (!history.length) { print('No history yet.', 'muted'); return; }
			[...history].reverse().forEach((cmd, i) =>
				print('  <span class="muted">' + (history.length - i) + '</span>  ' + escapeHtml(cmd)));
		},
		music: (args) => {
			const sub = args[0];
			if (!sub) {
				print('Usage: music &lt;subcommand&gt;', 'accent');
				[['play','play music'],['stop','stop music'],['volume','set volume [0-10]']].forEach(
					([c,d]) => print('  <span class="accent">' + c.padEnd(8).replace(/ /g,'&nbsp;') + '</span><span class="muted">' + d + '</span>'));
				return;
			}
			if (sub === 'play') { startMusic(print); }
			else if (sub === 'stop') { stopMusic(print); }
			else if (sub === 'volume') {
				const v = parseFloat(args[1]);
				if (isNaN(v) || v < 0 || v > 10) { print('Usage: music volume &lt;0-10&gt;', 'error'); return; }
				musicVol = (v / 10) * 0.4;
				if (musicAudio) musicAudio.volume = musicVol;
				print('Volume: ' + args[1] + '/10', 'success');
			} else print('Unknown subcommand: ' + escapeHtml(sub), 'error');
		},
		art: (args) => {
			const sub = args[0];
			if (!sub) {
				print('Usage: art &lt;subcommand&gt;', 'accent');
				[['set','set art seed (e.g. art set 42)'],
				 ['random','generate random art'],
				 ['noise','set global noise multiplier (e.g. art noise 1.5)'],
				 ['scale','set global scale multiplier'],
				 ['velocity','set global velocity multiplier']].forEach(
					([c,d]) => print('  <span class="accent">' + c.padEnd(10).replace(/ /g,'&nbsp;') + '</span><span class="muted">' + d + '</span>'));
				return;
			}

			const mods = window.artModifiers || { noise: 1, scale: 1, velocity: 1 };
			window.artModifiers = mods;

			if (sub === 'set') {
				const seed = parseInt(args[1]);
				if (isNaN(seed)) { print('Usage: art set &lt;number&gt;', 'error'); return; }
				if (window.changeVantaArt) window.changeVantaArt(seed);
				print('Art generated with seed: ' + seed, 'success');
			} else if (sub === 'random') {
				const seed = Math.floor(Math.random() * 10000);
				if (window.changeVantaArt) window.changeVantaArt(seed);
				print('Art generated with random seed: ' + seed, 'success');
			} else if (sub === 'noise' || sub === 'scale' || sub === 'velocity') {
				const val = parseFloat(args[1]);
				if (isNaN(val) || val <= 0) { print('Usage: art ' + sub + ' &lt;number&gt; (must be > 0)', 'error'); return; }
				mods[sub] = val;
				print('Global ' + sub + ' set to ' + val, 'success');
			} else {
				print('Unknown subcommand: ' + escapeHtml(sub), 'error');
			}
		},
		footer: (args) => {
			const sub = args[0];
			const footerEl = document.querySelector('footer');
			if (!sub) {
				print('Usage: footer set &lt;text&gt; | footer reset', 'muted');
				return;
			}
			if (sub === 'set') {
				const text = args.slice(1).join(' ');
				if (!text) { print('Usage: footer set &lt;text&gt;', 'error'); return; }
				if (!footerEl) { print('No footer found.', 'error'); return; }
				if (!footerEl.dataset.orig) footerEl.dataset.orig = footerEl.innerHTML;
				// Keep social links, replace only the text node
				const textNode = [...footerEl.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
				if (textNode) textNode.textContent = text + ' ';
				else footerEl.prepend(document.createTextNode(text + ' '));
				print('Footer updated.', 'success');
			} else if (sub === 'reset') {
				if (footerEl && footerEl.dataset.orig) {
					footerEl.innerHTML = footerEl.dataset.orig;
					delete footerEl.dataset.orig;
					print('Footer reset.', 'success');
				} else print('Nothing to reset.', 'muted');
			} else print('Usage: footer set &lt;text&gt; | footer reset', 'error');
		},
		snake: () => {
			// Fullscreen canvas overlay inside the terminal
			const termEl = document.getElementById('term');
			const barEl = termEl?.querySelector('.term-bar') as HTMLElement | null;
			if (!termEl || !barEl) { print('Terminal not found.', 'error'); return; }

			const CELL = 16;
			const overlay = document.createElement('div');
			overlay.style.cssText = 'position:absolute;inset:0;top:' + barEl.offsetHeight + 'px;background:rgba(13,13,18,0.97);z-index:10;display:flex;flex-direction:column';
			termEl.appendChild(overlay);

			// HUD bar
			const hud = document.createElement('div');
			hud.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.85rem;font-family:monospace;font-size:0.78rem;color:rgba(255,255,255,.5);border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0';
			hud.innerHTML = '<span style="color:#818cf8;font-weight:700">SNAKE</span><span id="snake-score">Score: 0</span><span>arrows = move &nbsp; q = quit</span>';
			overlay.appendChild(hud);

			// Canvas fills remaining space
			const canvas = document.createElement('canvas');
			canvas.style.cssText = 'display:block;flex:1;width:100%;height:100%';
			overlay.appendChild(canvas);

			// Size canvas to available pixels
			const resize = () => {
				canvas.width = overlay.clientWidth;
				canvas.height = overlay.clientHeight - hud.offsetHeight;
			};
			resize();

			const cols = Math.floor(canvas.width / CELL);
			const rows = Math.floor(canvas.height / CELL);
			const offX = Math.floor((canvas.width - cols * CELL) / 2);
			const offY = Math.floor((canvas.height - rows * CELL) / 2);

			let snake = [{x:Math.floor(cols/4), y:Math.floor(rows/2)}, {x:Math.floor(cols/4)-1, y:Math.floor(rows/2)}, {x:Math.floor(cols/4)-2, y:Math.floor(rows/2)}];
			let dir = {x:1,y:0}, nextDir = {x:1,y:0};
			let food = {x:Math.floor(cols*0.6), y:Math.floor(rows/2)};
			let score = 0;
			let running = true;

			const ctx2 = canvas.getContext('2d')!;

			const placeFood = () => {
				do {
					food.x = Math.floor(Math.random()*(cols-2))+1;
					food.y = Math.floor(Math.random()*(rows-2))+1;
				} while (snake.some(s=>s.x===food.x&&s.y===food.y));
			};

			const drawCell = (x: number, y: number, color: string, radius=3) => {
				const px = offX + x*CELL+1, py = offY + y*CELL+1, sz = CELL-2;
				ctx2.fillStyle = color;
				ctx2.beginPath();
				ctx2.roundRect(px, py, sz, sz, radius);
				ctx2.fill();
			};

			const render = () => {
				ctx2.clearRect(0, 0, canvas.width, canvas.height);
				// Grid dots
				ctx2.fillStyle = 'rgba(255,255,255,0.03)';
				for (let gx=0; gx<cols; gx++) for (let gy=0; gy<rows; gy++) {
					ctx2.fillRect(offX+gx*CELL+CELL/2-0.5, offY+gy*CELL+CELL/2-0.5, 1, 1);
				}
				// Border
				ctx2.strokeStyle = 'rgba(129,140,248,0.25)';
				ctx2.lineWidth = 1;
				ctx2.strokeRect(offX+0.5, offY+0.5, cols*CELL-1, rows*CELL-1);
				// Food
				ctx2.fillStyle = '#4ade80';
				ctx2.shadowColor = '#4ade80';
				ctx2.shadowBlur = 8;
				drawCell(food.x, food.y, '#4ade80', 8);
				ctx2.shadowBlur = 0;
				// Snake body
				snake.forEach((s, i) => {
					const t = i === 0 ? 1 : Math.max(0.3, 1 - i/snake.length);
					drawCell(s.x, s.y, i===0 ? '#818cf8' : `rgba(99,102,241,${t})`, i===0?5:3);
				});
				const scoreEl = overlay.querySelector('#snake-score');
				if (scoreEl) scoreEl.textContent = 'Score: ' + score;
			};

			const endGame = (msg: string) => {
				running = false;
				clearInterval(loop);
				document.removeEventListener('keydown', keyH, true);
				// Death flash
				ctx2.fillStyle = 'rgba(248,113,113,0.15)';
				ctx2.fillRect(0,0,canvas.width,canvas.height);
				ctx2.fillStyle = '#f87171';
				ctx2.font = 'bold 1.1rem monospace';
				ctx2.textAlign = 'center';
				ctx2.fillText(msg + '  Final score: ' + score, canvas.width/2, canvas.height/2 - 12);
				ctx2.fillStyle = 'rgba(255,255,255,0.4)';
				ctx2.font = '0.8rem monospace';
				ctx2.fillText('press any key to exit', canvas.width/2, canvas.height/2 + 14);
				const dismiss = () => {
					overlay.remove();
					document.removeEventListener('keydown', dismiss);
					print('Game over. Score: ' + score, 'muted');
					input?.focus();
				};
				setTimeout(() => document.addEventListener('keydown', dismiss), 300);
			};

			const keyH = (e: KeyboardEvent) => {
				if (!running) return;
				if (e.key==='ArrowUp'&&dir.y===0) nextDir={x:0,y:-1};
				else if (e.key==='ArrowDown'&&dir.y===0) nextDir={x:0,y:1};
				else if (e.key==='ArrowLeft'&&dir.x===0) nextDir={x:-1,y:0};
				else if (e.key==='ArrowRight'&&dir.x===0) nextDir={x:1,y:0};
				else if (e.key==='q'||e.key==='Q'){endGame('Quit.');return;}
				if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();}
			};

			const loop = setInterval(() => {
				if (!running) return;
				dir = nextDir;
				const head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
				if (head.x<0||head.x>=cols||head.y<0||head.y>=rows){endGame('Wall!');return;}
				if (snake.some(s=>s.x===head.x&&s.y===head.y)){endGame('Self collision!');return;}
				snake.unshift(head);
				if (head.x===food.x&&head.y===food.y){score++;placeFood();}
				else snake.pop();
				render();
			}, 130);

			document.addEventListener('keydown', keyH, true);
			placeFood();
			render();
		},
	};

	const printBanner = () => {
		// ANSI Shadow — "JBN.BLOG"
		const bannerLines = [
			`  ██╗   ██████╗  ███╗   ██╗      ██████╗  ██╗       ██████╗   ██████╗ `,
			`  ██║   ██╔══██╗ ████╗  ██║      ██╔══██╗ ██║      ██╔═══██╗ ██╔════╝ `,
			`  ██║   ██████╔╝ ██╔██╗ ██║      ██████╔╝ ██║      ██║   ██║ ██║  ███╗`,
			`  ██║   ██╔══██╗ ██║╚██╗██║      ██╔══██╗ ██║      ██║   ██║ ██║   ██║`,
			`██╗██║  ██████╔╝ ██║ ╚████║  ██╗ ██████╔╝ ███████╗ ╚██████╔╝ ╚██████╔╝`,
			`╚████║  ╚═════╝  ╚═╝  ╚═══╝  ╚═╝ ╚═════╝  ╚══════╝  ╚═════╝   ╚═════╝ `,
			` ╚══╝`,
		];

		const wrap = document.createElement('div');
		wrap.style.cssText = 'overflow:hidden;margin-bottom:0.35rem';

		// Use div (not pre) — global.css targets pre with !important background/border/padding
		const bannerEl = document.createElement('div');
		bannerEl.style.cssText = 'margin:0;color:#818cf8;line-height:1.2;white-space:pre;display:inline-block;font-weight:700;letter-spacing:0;font-family:inherit';
		bannerEl.textContent = bannerLines.join('\n');
		wrap.appendChild(bannerEl);
		output.appendChild(wrap);

		requestAnimationFrame(() => {
			const avail = wrap.clientWidth;
			const naturalW = bannerEl.getBoundingClientRect().width;
			if (naturalW > 0 && avail > 0) {
				const curSize = parseFloat(getComputedStyle(bannerEl).fontSize);
				bannerEl.style.fontSize = (curSize * (avail / naturalW) * 0.72) + 'px';
				bannerEl.style.display = 'block';
			}
			scrollDown();
		});

		print('<span style="color:rgba(255,255,255,.08)">──────────────────────────────────────────────────────────────────</span>');
		print('Type <span class="accent">help</span> to see available commands.', 'muted');
		print('<span style="color:rgba(255,255,255,.08)">──────────────────────────────────────────────────────────────────</span>');
	};

	const run = (raw: string) => {
		const line = raw.trim();
		printPrompt(line);
		if (!line) return;
		history.unshift(line);
		const [name, ...args] = line.split(/\s+/);
		const cmd = commands[name.toLowerCase()];
		if (cmd) cmd(args);
		else print('command not found: ' + escapeHtml(name) + ' — type "help"', 'error');
	};

	let booted = false;
	const openConsole = () => {
		term.classList.add('open');
		term.setAttribute('aria-hidden', 'false');
		toggleBtn.setAttribute('aria-expanded', 'true');
		document.body.classList.add('term-open');
		if (!booted) { printBanner(); booted = true; }
		setTimeout(() => input.focus(), 60);
	};
	const closeConsole = () => {
		term.classList.remove('open');
		term.setAttribute('aria-hidden', 'true');
		toggleBtn.setAttribute('aria-expanded', 'false');
		document.body.classList.remove('term-open');
	};
	const isOpen = () => term.classList.contains('open');

	toggleBtn.addEventListener('click', () => { isOpen() ? closeConsole() : openConsole(); });
	closeBtn.addEventListener('click', closeConsole);
	body.addEventListener('click', () => input.focus());

	// Global shortcut: backtick/tilde toggles; Esc closes
	document.addEventListener('keydown', (e) => {
		const tag = (document.activeElement as HTMLElement | null)?.tagName;
		const typingElsewhere = tag === 'INPUT' && document.activeElement !== input;
		if ((e.key === '`' || e.key === '~') && !typingElsewhere) {
			e.preventDefault();
			isOpen() ? closeConsole() : openConsole();
		} else if (e.key === 'Escape' && isOpen()) {
			closeConsole();
		}
	});

	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			window.playSound?.('click');
			run(input.value);
			input.value = '';
			histIdx = -1;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
			else { histIdx = -1; input.value = ''; }
		} else if (e.key.length === 1) {
			window.playSound?.('hover');
		}
	});
})();
