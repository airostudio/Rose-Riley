/* ─────────────────────────────────────────────────────────────
   CONFIGURATION
   When Rose's Coreplus Client Portal is live, paste the portal
   URL below (e.g. "https://rosereilly.au.clientsecure.me").
   All booking buttons on the page update automatically.
   Leave empty to keep buttons pointing to the enquiry form.
   ───────────────────────────────────────────────────────────── */
const COREPLUS_BOOKING_URL = '';

// Wire all booking buttons
document.querySelectorAll('[data-booking]').forEach(el => {
  if (COREPLUS_BOOKING_URL) {
    el.href = COREPLUS_BOOKING_URL;
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  } else {
    el.href = '#contact';
    el.removeAttribute('target');
  }
});

// Hero slideshow — crossfade every 6 seconds
const slides = document.querySelectorAll('.hero-slide');
if (slides.length > 1) {
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
  }, 6000);
}

// Mobile navigation toggle
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

// Close nav when any link is clicked (mobile)
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Add shadow/border to nav on scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

// Basic client-side form feedback
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = form.querySelectorAll('[required]');
    let valid = true;

    required.forEach(field => {
      field.style.borderColor = '';
      if (!field.value.trim() || (field.type === 'checkbox' && !field.checked)) {
        field.style.borderColor = '#C0392B';
        valid = false;
      }
    });

    if (valid) {
      // Replace this block with your form submission logic (e.g. Formspree, fetch, etc.)
      const btn = form.querySelector('[type="submit"]');
      btn.textContent = 'Enquiry sent — thank you.';
      btn.disabled = true;
      form.reset();
    } else {
      const firstInvalid = form.querySelector('[required][style*="C0392B"]');
      if (firstInvalid) firstInvalid.focus();
    }
  });
}
