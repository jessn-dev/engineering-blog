// ============================================================
// Visual effects — spotlight, hero glow, scroll-reveal, magnetic
// ============================================================
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const articleItems = document.querySelectorAll('.article-item');

// Per-card spotlight — only the hovered card tracks the cursor,
// rAF-throttled so we touch the DOM at most once per frame.
articleItems.forEach(item => {
	const el = item as HTMLElement;
	let raf = 0;
	let lastX = 0, lastY = 0;
	item.addEventListener('mousemove', (e) => {
		const rect = el.getBoundingClientRect();
		lastX = (e as MouseEvent).clientX - rect.left;
		lastY = (e as MouseEvent).clientY - rect.top;
		if (raf) return;
		raf = requestAnimationFrame(() => {
			el.style.setProperty('--mouse-x', `${lastX}px`);
			el.style.setProperty('--mouse-y', `${lastY}px`);
			raf = 0;
		});
	});
});

// Hero glow follows the cursor (rAF-throttled, percentage-based).
const hero = document.querySelector('.hero-tech') as HTMLElement | null;
if (hero) {
	let heroRaf = 0;
	let hx = 50, hy = 35;
	hero.addEventListener('mousemove', (e) => {
		const rect = hero.getBoundingClientRect();
		hx = ((e.clientX - rect.left) / rect.width) * 100;
		hy = ((e.clientY - rect.top) / rect.height) * 100;
		if (heroRaf) return;
		heroRaf = requestAnimationFrame(() => {
			hero.style.setProperty('--hero-x', `${hx}%`);
			hero.style.setProperty('--hero-y', `${hy}%`);
			heroRaf = 0;
		});
	});
}

// Scroll-reveal — stagger cards in as they enter the viewport.
if (reduceMotion || !('IntersectionObserver' in window)) {
	articleItems.forEach(item => item.classList.add('revealed'));
} else {
	const io = new IntersectionObserver((entries, obs) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const el = entry.target as HTMLElement;
				const idx = Array.from(articleItems).indexOf(el);
				el.style.transitionDelay = `${Math.min(idx, 6) * 80}ms`;
				el.classList.add('revealed');
				obs.unobserve(el);
			}
		});
	}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
	articleItems.forEach(item => io.observe(item));
}

// Magnetic buttons — subtle pull toward the cursor.
if (!reduceMotion) {
	document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
		const el = btn as HTMLElement;
		el.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, box-shadow 0.2s, border-color 0.2s';
		el.addEventListener('mousemove', (e) => {
			const rect = el.getBoundingClientRect();
			const mx = (e as MouseEvent).clientX - rect.left - rect.width / 2;
			const my = (e as MouseEvent).clientY - rect.top - rect.height / 2;
			el.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
		});
		el.addEventListener('mouseleave', () => {
			el.style.transform = '';
		});
	});
}
