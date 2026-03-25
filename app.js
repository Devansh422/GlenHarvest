// ===========================
// Navbar hamburger toggle
// ===========================
const hamburger = document.getElementById('navbar-hamburger');
const mobileMenu = document.getElementById('navbar-mobile-menu');
const navbar    = document.getElementById('navbar');

if (hamburger && mobileMenu) {
	hamburger.addEventListener('click', () => {
		const isOpen = hamburger.classList.toggle('open');
		hamburger.setAttribute('aria-expanded', String(isOpen));

		if (isOpen) {
			mobileMenu.classList.add('open');
			document.body.style.overflow = 'hidden';
		} else {
			mobileMenu.classList.remove('open');
			document.body.style.overflow = '';
		}
	});

	// Close menu when a mobile link is clicked
	document.querySelectorAll('.navbar-mobile-link, .navbar-mobile-cta').forEach(link => {
		link.addEventListener('click', () => {
			hamburger.classList.remove('open');
			hamburger.setAttribute('aria-expanded', 'false');
			mobileMenu.classList.remove('open');
			document.body.style.overflow = '';
		});
	});
}

// Add scrolled class for subtle shadow change (throttled via rAF)
if (navbar) {
	let scrollScheduled = false;
	window.addEventListener('scroll', () => {
		if (!scrollScheduled) {
			scrollScheduled = true;
			requestAnimationFrame(() => {
				navbar.classList.toggle('scrolled', window.scrollY > 10);
				scrollScheduled = false;
			});
		}
	}, { passive: true });
}
