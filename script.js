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
