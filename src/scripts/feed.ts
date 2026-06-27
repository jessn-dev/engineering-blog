// ============================================================
// Feed interactions — accordion + category filter
// ============================================================
import { playSound } from './audio';

const accordions = document.querySelectorAll('[data-accordion]');
accordions.forEach(acc => {
	const trigger = acc.querySelector('.accordion-trigger');
	if (trigger) {
		trigger.addEventListener('click', () => {
			playSound('click');
			const isExpanded = acc.classList.contains('expanded');
			// Close all others
			accordions.forEach(a => {
				a.classList.remove('expanded');
				const t = a.querySelector('.accordion-trigger');
				if (t) t.setAttribute('aria-expanded', 'false');
			});

			// Toggle current
			if (!isExpanded) {
				acc.classList.add('expanded');
				trigger.setAttribute('aria-expanded', 'true');
			}
		});
	}
});

// Filter Logic
const filterBtns = document.querySelectorAll('.filter-btn');
const articleItems = document.querySelectorAll('.article-item');

// Change hero art on card hover
articleItems.forEach((item, idx) => {
	item.addEventListener('mouseenter', () => {
		if (typeof window.changeVantaArt === 'function') {
			window.changeVantaArt(idx);
		}
	});
});

// Pagination State
const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let currentFilter = 'all';

const prevBtn = document.getElementById('page-prev') as HTMLButtonElement | null;
const nextBtn = document.getElementById('page-next') as HTMLButtonElement | null;
const indicator = document.getElementById('page-indicator');
const paginationControls = document.querySelector('.pagination-controls') as HTMLElement | null;

function applyPagination() {
	// 1. Find all items matching the current filter
	const matchedItems = Array.from(articleItems).filter(item => {
		if (currentFilter === 'all') return true;
		const categoriesData = item.getAttribute('data-categories');
		if (!categoriesData) return false;
		try {
			const categories = JSON.parse(categoriesData);
			return categories.includes(currentFilter);
		} catch (e) {
			return false;
		}
	}) as HTMLElement[];

	// 2. Calculate pages
	const totalPages = Math.ceil(matchedItems.length / ITEMS_PER_PAGE) || 1;
	
	// Enforce bounds
	if (currentPage < 1) currentPage = 1;
	if (currentPage > totalPages) currentPage = totalPages;

	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;

	// 3. Hide all items initially
	articleItems.forEach(item => {
		(item as HTMLElement).style.display = 'none';
	});
	
	// 4. Show only the slice for the current page
	matchedItems.slice(startIndex, endIndex).forEach(item => {
		item.style.display = 'block';
	});

	// 5. Update pagination UI
	if (paginationControls && indicator && prevBtn && nextBtn) {
		paginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
		indicator.textContent = `Page ${currentPage} / ${totalPages}`;
		
		if (currentPage === 1) {
			prevBtn.setAttribute('disabled', 'true');
			prevBtn.style.opacity = '0.3';
			prevBtn.style.cursor = 'not-allowed';
		} else {
			prevBtn.removeAttribute('disabled');
			prevBtn.style.opacity = '1';
			prevBtn.style.cursor = 'pointer';
		}
		
		if (currentPage === totalPages) {
			nextBtn.setAttribute('disabled', 'true');
			nextBtn.style.opacity = '0.3';
			nextBtn.style.cursor = 'not-allowed';
		} else {
			nextBtn.removeAttribute('disabled');
			nextBtn.style.opacity = '1';
			nextBtn.style.cursor = 'pointer';
		}
	}
}

// Bind Pagination Buttons
if (prevBtn && nextBtn) {
	prevBtn.addEventListener('click', () => {
		if (currentPage > 1) {
			playSound('hover');
			currentPage--;
			applyPagination();
			// Scroll back to top of feed smoothly
			const feedHeader = document.querySelector('.feed-header');
			if (feedHeader) feedHeader.scrollIntoView({ behavior: 'smooth' });
		}
	});
	
	nextBtn.addEventListener('click', () => {
		// Just a safety check, applyPagination handles max bounds
		playSound('hover');
		currentPage++;
		applyPagination();
		// Scroll back to top of feed smoothly
		const feedHeader = document.querySelector('.feed-header');
		if (feedHeader) feedHeader.scrollIntoView({ behavior: 'smooth' });
	});
}

// Bind Filter Buttons
filterBtns.forEach(btn => {
	btn.addEventListener('click', () => {
		playSound('hover');
		filterBtns.forEach(b => b.classList.remove('active'));
		btn.classList.add('active');

		currentFilter = btn.getAttribute('data-filter') || 'all';
		currentPage = 1; // Reset to page 1 on filter change
		applyPagination();
	});
});

// Initialize pagination on load
applyPagination();
