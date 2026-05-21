/* ── NAV SCROLL ───────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

navToggle?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  navToggle.classList.toggle('open');
});

// Close mobile nav on link click
navLinks?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle?.classList.remove('open');
  });
});


/* ── SMOOTH SCROLL ────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});


/* ── SCROLL ANIMATIONS ────────────────────────────────────── */
function addAnimAttributes() {
  const selectors = [
    '.pillar-card',
    '.cat-card',
    '.usecase-card',
    '.catalogue-card',
    '.step',
    '.section-header',
    '.enquiry-info',
    '.enquiry-form-wrap',
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.setAttribute('data-anim', '');
      if (!el.style.transitionDelay) {
        el.style.transitionDelay = `${(i % 6) * 80}ms`;
      }
    });
  });
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function observeAnimated() {
  document.querySelectorAll('[data-anim]').forEach(el => observer.observe(el));
}

addAnimAttributes();
observeAnimated();


/* ── CATALOGUE FILTER ─────────────────────────────────────── */
const filterBtns = document.querySelectorAll('.cat-filter');
const catalogueCards = document.querySelectorAll('.catalogue-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    catalogueCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});


/* ── DOWNLOAD MODAL ───────────────────────────────────────── */
const modal = document.getElementById('downloadModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const downloadFileInput = document.getElementById('downloadFile');
const downloadForm = document.getElementById('downloadForm');
const downloadSuccess = document.getElementById('downloadSuccess');
const downloadAgainBtn = document.getElementById('downloadAgainBtn');

let currentDownloadFile = '';

document.querySelectorAll('.btn-download').forEach(btn => {
  btn.addEventListener('click', () => {
    const file = btn.dataset.file;
    const name = btn.dataset.name;
    currentDownloadFile = file;
    downloadFileInput.value = file;
    modalTitle.textContent = name || 'Download Catalogue';
    downloadForm.style.display = 'block';
    downloadSuccess.style.display = 'none';
    openModal();
  });
});

function openModal() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    downloadForm.reset();
    clearErrors(downloadForm);
  }, 300);
}

modalClose?.addEventListener('click', closeModal);
modal?.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

downloadAgainBtn?.addEventListener('click', () => {
  triggerDownload(currentDownloadFile);
});


/* ── FORM VALIDATION ──────────────────────────────────────── */
function validateField(field) {
  const value = field.value.trim();
  let valid = true;

  if (field.required && !value) {
    valid = false;
  } else if (field.type === 'email' && value) {
    valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  } else if (field.type === 'tel' && value) {
    valid = /^[\+\d\s\-\(\)]{7,15}$/.test(value);
  }

  field.classList.toggle('error', !valid);
  return valid;
}

function validateForm(form) {
  const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
  let allValid = true;
  fields.forEach(field => {
    if (!validateField(field)) allValid = false;
  });
  return allValid;
}

function clearErrors(form) {
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

// Live validation
document.querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.classList.contains('error')) validateField(field);
  });
});


/* ── API SUBMISSION HELPER ────────────────────────────────── */
const EMAIL_URL = 'send-email.php';

function submitLeadToScript(dataObj) {
  // We send the payload securely to our backend script,
  // which will then handle both Emailing and Google Sheets insertion
  // to avoid exposing any webhooks or credentials.
  return fetch(EMAIL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataObj)
  }).catch(e => console.error('Submission failed', e));
}

/* ── DOWNLOAD FORM SUBMIT ─────────────────────────────────── */
downloadForm?.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm(downloadForm)) return;

  const btn = downloadForm.querySelector('button[type="submit"]');
  btn.textContent = 'Processing…';
  btn.disabled = true;

  const formData = new FormData(downloadForm);
  const lead = Object.fromEntries(formData.entries());
  lead.catalogue = currentDownloadFile;
  lead.timestamp = new Date().toISOString();
  lead.formName = 'Catalogue Download';
  lead.sourceWebsite = 'Robust Gifting';
  lead.pageUrl = window.location.href;

  submitLeadToScript(lead).finally(() => {
    triggerDownload(currentDownloadFile);
    downloadForm.style.display = 'none';
    downloadSuccess.style.display = 'flex';
    btn.innerHTML = `Download Now <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 16l-4-4h3V4h2v8h3l-4 4z" fill="currentColor"/><path d="M20 18H4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    btn.disabled = false;
  });
});

function triggerDownload(filename) {
  if (!filename) return;
  const a = document.createElement('a');
  a.href = encodeURIComponent(filename);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


/* ── ENQUIRY FORM SUBMIT ──────────────────────────────────── */
const enquiryForm = document.getElementById('enquiryForm');
const enquirySuccess = document.getElementById('enquirySuccess');

enquiryForm?.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm(enquiryForm)) return;

  const btn = enquiryForm.querySelector('button[type="submit"]');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = 'Sending…';
  btn.disabled = true;

  const formData = new FormData(enquiryForm);
  const enquiry = Object.fromEntries(formData.entries());
  enquiry.timestamp = new Date().toISOString();
  enquiry.formName = 'Main Enquiry Form';
  enquiry.sourceWebsite = 'Robust Gifting';
  enquiry.pageUrl = window.location.href;

  submitLeadToScript(enquiry).finally(() => {
    enquiryForm.style.display = 'none';
    enquirySuccess.style.display = 'flex';
    enquiryForm.reset();
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  });
});


/* ── COUNTER ANIMATION ────────────────────────────────────── */
function animateCounter(el, target, suffix = '') {
  const duration = 1200;
  const start = performance.now();
  const isRange = target.includes('–') || target.includes('+');

  if (isRange) return; // Skip range values, display as-is

  const numTarget = parseFloat(target.replace(/[^0-9.]/g, ''));
  if (isNaN(numTarget)) return;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(eased * numTarget);

    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target; // Restore original text with any symbols
  }
  requestAnimationFrame(step);
}

// Observe stat numbers for counter animation
const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const originalText = el.textContent.trim();
      animateCounter(el, originalText);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num').forEach(el => statObserver.observe(el));


/* ── CAROUSEL: drag-to-scroll + progress bar ─────────────── */
function initCarousel(grid) {
  if (!grid || grid.dataset.carouselReady) return;
  grid.dataset.carouselReady = '1';

  // Insert progress bar
  const bar = document.createElement('div');
  bar.className = 'carousel-bar';
  const thumb = document.createElement('div');
  thumb.className = 'carousel-thumb';
  bar.appendChild(thumb);
  grid.parentNode.insertBefore(bar, grid.nextSibling);

  function updateThumb() {
    const max = grid.scrollWidth - grid.clientWidth;
    if (max <= 0) {
      bar.style.opacity = '0';
      thumb.style.width = '100%';
      thumb.style.transform = 'translateX(0)';
      return;
    }
    bar.style.opacity = '';
    const ratio = grid.clientWidth / grid.scrollWidth;
    const thumbW = Math.max(ratio * 100, 12);
    thumb.style.width = thumbW + '%';
    const progress = grid.scrollLeft / max;
    const travel = 100 - thumbW;
    thumb.style.transform = `translateX(${progress * travel}%)`;
  }
  grid.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  // Recompute when filter hides/shows cards (catalogues only)
  const mo = new MutationObserver(updateThumb);
  grid.querySelectorAll('.catalogue-card, .cat-card').forEach(c => {
    mo.observe(c, { attributes: true, attributeFilter: ['class'] });
  });
  updateThumb();

  // Click bar to jump
  bar.addEventListener('click', e => {
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const max = grid.scrollWidth - grid.clientWidth;
    grid.scrollTo({ left: ratio * max, behavior: 'smooth' });
  });

  // Drag-to-scroll (mouse only — native touch handles itself)
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  grid.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = grid.scrollLeft;
    grid.classList.add('dragging');
    grid.setPointerCapture(e.pointerId);
  });
  grid.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    grid.scrollLeft = startScroll - dx;
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    grid.classList.remove('dragging');
    if (moved) {
      // Suppress click that follows a real drag
      const blockClick = ev => { ev.preventDefault(); ev.stopPropagation(); };
      grid.addEventListener('click', blockClick, { capture: true, once: true });
    }
  }
  grid.addEventListener('pointerup', endDrag);
  grid.addEventListener('pointercancel', endDrag);
  grid.addEventListener('pointerleave', endDrag);
}

document.querySelectorAll('.categories-grid, .catalogues-grid').forEach(initCarousel);


/* ── NAVBAR ACTIVE LINK ───────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navAnchors.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}`
      ? 'var(--gold-light)'
      : '';
  });
}, { passive: true });
