// Shared globals used to wire the home-page modules together at runtime.
// They intentionally communicate via `window` so the modules stay decoupled.
export {};

declare global {
	interface Window {
		webkitAudioContext?: typeof AudioContext;
		playSound?: (type: 'click' | 'hover') => void;
		changeVantaArt?: (effectIdx?: number) => void;
		artModifiers?: { noise: number; scale: number; velocity: number };
	}
}
