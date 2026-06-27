// Orbital system: hover → highlight ring, click → scroll + filter

const system = document.getElementById('orbital-system');
if (system) {
  const nodes = system.querySelectorAll<HTMLElement>('.orbital-node');

  const ringMap: Record<string, SVGCircleElement | null> = {
    '1': system.querySelector('.ring-1'),
    '2': system.querySelector('.ring-2'),
    '3': system.querySelector('.ring-3'),
    '4': system.querySelector('.ring-4'),
    '5': system.querySelector('.ring-5'),
  };

  nodes.forEach(node => {
    const ringId = node.dataset.ring ?? '';
    const category = (node.dataset.category ?? '').toLowerCase();

    node.addEventListener('mouseenter', () => {
      ringMap[ringId]?.classList.add('ring-active');
    });
    node.addEventListener('mouseleave', () => {
      ringMap[ringId]?.classList.remove('ring-active');
    });

    const activate = () => {
      const feed = document.querySelector('.feed-section');
      feed?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Match filter button by overlapping keywords
      const firstWord = category.split(' ')[0];
      const btns = document.querySelectorAll<HTMLButtonElement>('.filter-btn[data-filter]');
      let match: HTMLButtonElement | null = null;
      btns.forEach(btn => {
        const f = (btn.dataset.filter ?? '').toLowerCase();
        if (f.includes(firstWord) || category.includes(f)) match = btn;
      });
      if (match) setTimeout(() => match!.click(), 480);
    };

    node.addEventListener('click', activate);
    node.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });
}

// Grid parallax — max 2px
const heroEl = document.querySelector<HTMLElement>('.hero-tech');
const gridEl = document.getElementById('hero-bg-grid');
if (heroEl && gridEl) {
  heroEl.addEventListener('mousemove', (e: MouseEvent) => {
    const r = heroEl.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 4;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 4;
    gridEl.style.transform = `translate(${x}px, ${y}px)`;
  });
  heroEl.addEventListener('mouseleave', () => {
    gridEl.style.transform = 'translate(0px, 0px)';
  });
}
