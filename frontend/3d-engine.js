/**
 * SWAPTOME — 3D Animation Engine v2.0
 * Particles, 3D tilt, parallax, counters, scroll reveal, FAB
 */
(function () {
  'use strict';

  /* ═══ 1. PARTICLE CANVAS ═══ */
  function initParticles() {
    const hero = document.querySelector('.hero');
    if (!hero || document.getElementById('heroCanvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'heroCanvas';
    hero.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let W, H;
    const mouse = { x: -999, y: -999 };

    function resize() {
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const COLORS = ['245,158,11', '251,191,36', '59,130,246', '96,165,250', '16,185,129', '168,85,247'];

    class Particle {
      constructor() { this.reset(true); }
      reset(init) {
        this.x     = Math.random() * W;
        this.y     = init ? Math.random() * H : H + 10;
        this.vx    = (Math.random() - 0.5) * 0.5;
        this.vy    = -(Math.random() * 0.6 + 0.2);
        this.r     = Math.random() * 2.8 + 0.6;
        this.alpha = Math.random() * 0.55 + 0.1;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.life  = 0;
      }
      update() {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) {
          this.vx += (dx / d) * 0.18;
          this.vy += (dy / d) * 0.18;
        }
        this.vx *= 0.985;
        this.vy *= 0.985;
        this.x  += this.vx;
        this.y  += this.vy;
        this.life++;
        if (this.y < -10 || this.life > 600) this.reset(false);
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
        ctx.fill();
      }
    }

    const particles = Array.from({ length: 80 }, () => new Particle());

    hero.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });

    hero.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

    function loop() {
      ctx.clearRect(0, 0, W, H);

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const lineCol = (i % 2 === 0) ? '59,130,246' : '245,158,11';
            ctx.strokeStyle = `rgba(${lineCol},${0.12 * (1 - d / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ═══ 2. 3D BOOK STACK (REMOVED) ═══ */
  function inject3DBooks() {
    const existing = document.querySelector('.book-stack-3d');
    if (existing) existing.remove();
  }

  /* ═══ 3. GLOW ORBS ═══ */
  function injectOrbs() {
    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.glow-orb')) return;
    [1, 2, 3].forEach(i => {
      const o = document.createElement('div');
      o.className = `glow-orb glow-orb-${i}`;
      hero.appendChild(o);
    });
  }

  /* ═══ 4. HERO BADGE ═══ */
  function injectHeroBadge() {
    const eyebrow = document.querySelector('.hero-eyebrow');
    if (!eyebrow || eyebrow.querySelector('.hero-badge-float')) return;
    eyebrow.innerHTML = `
      <span class="hero-badge-float">
        <span class="dot"></span>
        🇮🇳 India's #1 College Book Marketplace
      </span>`;
  }

  /* ═══ 5. HERO PARALLAX ═══ */
  function initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    let rafId = null;

    hero.addEventListener('mousemove', e => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const r  = hero.getBoundingClientRect();
        const mx = (e.clientX - r.left) / r.width  - 0.5;
        const my = (e.clientY - r.top)  / r.height - 0.5;
        const left  = hero.querySelector('.hero-left');
        const right = hero.querySelector('.hero-visual');
        if (left)  left.style.transform  = `translate(${mx * 10}px, ${my * 7}px)`;
        if (right) right.style.transform = `translate(${mx * -14}px, ${my * -9}px)`;
      });
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
      ['hero-left', 'hero-visual'].forEach(cls => {
        const el = hero.querySelector('.' + cls);
        if (!el) return;
        el.style.transition = 'transform 0.9s cubic-bezier(.22,1,.36,1)';
        el.style.transform  = '';
        setTimeout(() => el.style.transition = '', 900);
      });
    });
  }

  /* ═══ 6. 3D CARD TILT ═══ */
  function initCardTilt() {
    function bindCard(card) {
      if (card.dataset.tiltInit) return;
      card.dataset.tiltInit = 'true';
      card.addEventListener('mousemove', e => {
        const r  = card.getBoundingClientRect();
        const x  = (e.clientX - r.left) / r.width  - 0.5;
        const y  = (e.clientY - r.top)  / r.height - 0.5;
        const ry = x * 14, rx = y * -10;
        card.style.transform = `translateY(-10px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
        card.style.transition = 'transform 0.08s ease, box-shadow 0.08s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform  = '';
        card.style.transition = 'transform 0.5s cubic-bezier(.22,1,.36,1), box-shadow 0.5s ease';
      });
    }

    document.querySelectorAll('.feature-card, .book-card, .review-card, .step, .category-card').forEach(bindCard);

    // Watch for newly inserted book cards from dynamic API fetches
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.matches && node.matches('.feature-card, .book-card, .review-card, .step, .category-card')) {
                bindCard(node);
              }
              if (node.querySelectorAll) {
                node.querySelectorAll('.feature-card, .book-card, .review-card, .step, .category-card').forEach(bindCard);
              }
            }
          });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ═══ 7. NETFLIX SLIDER 3D ═══ */
  function initSliderTilt() {
    const slider = document.querySelector('.netflix-slider');
    if (!slider) return;
    slider.addEventListener('mousemove', e => {
      const r  = slider.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      slider.style.transform  = `perspective(800px) rotateY(${x * 10}deg) rotateX(${y * -6}deg)`;
      slider.style.transition = 'transform 0.08s ease';
    });
    slider.addEventListener('mouseleave', () => {
      slider.style.transition = 'transform 0.7s cubic-bezier(.22,1,.36,1)';
      slider.style.transform  = '';
    });
  }

  /* ═══ 8. SCROLL REVEAL ═══ */
  function initScrollReveal() {
    if (typeof IntersectionObserver === 'undefined') return;

    const selectors = [
      '.feature-card', '.book-card', '.review-card',
      '.step', '.section-header', '.listings-header',
      '.search-section', '.cta-section > *',
    ];

    const els = [...document.querySelectorAll(selectors.join(','))];
    els.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 5) * 0.07}s`;
    });

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => io.observe(el));
  }

  /* ═══ 9. ANIMATED STAT COUNTERS ═══ */
  function animateCounters() {
    const counters = [
      { id: 'booksCount',  target: 1240,   prefix: '',  suffix: '+',  format: v => v >= 1000 ? (v/1000).toFixed(1)+'K' : v },
      { id: 'savedAmount', target: 320000, prefix: '₹', suffix: '+',  format: v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v },
    ];

    counters.forEach(({ id, target, prefix, suffix, format }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const io = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        let start = null;
        const dur = 2000;

        (function step(ts) {
          if (!start) start = ts;
          const p      = Math.min((ts - start) / dur, 1);
          const eased  = 1 - Math.pow(1 - p, 4);
          el.textContent = prefix + format(Math.floor(eased * target)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());

        // Add live dot
        const parent = el.closest('div');
        if (parent && !parent.querySelector('.stat-live')) {
          const dot = document.createElement('div');
          dot.className = 'stat-live';
          dot.textContent = 'Live';
          parent.appendChild(dot);
        }
      }, { threshold: 0.6 });

      io.observe(el);
    });
  }

  /* ═══ 10. SCROLL PROGRESS BAR ═══ */
  function initScrollBar() {
    let bar = document.getElementById('scrollBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scrollBar';
      document.body.prepend(bar);
    }
    window.addEventListener('scroll', () => {
      const total = document.body.scrollHeight - window.innerHeight;
      bar.style.width = (window.scrollY / total * 100) + '%';
    }, { passive: true });
  }

  /* ═══ 11. STICKY NAV SHADOW ═══ */
  function initStickyNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  /* ═══ 12. FLOATING ACTION BUTTON ═══ */
  function injectFAB() {
    if (document.getElementById('fabSell')) return;
    const fab = document.createElement('button');
    fab.id = 'fabSell';
    fab.innerHTML = '📚 Sell a Book';
    fab.onclick = () => {
      if (typeof openSellOrAuth === 'function') openSellOrAuth();
      else if (typeof openModal === 'function') openModal('authModal');
    };
    document.body.appendChild(fab);

    // Hide FAB when user scrolls to footer
    window.addEventListener('scroll', () => {
      const footer = document.querySelector('footer');
      if (!footer) return;
      const footerTop = footer.getBoundingClientRect().top;
      fab.style.opacity = footerTop < window.innerHeight ? '0' : '1';
      fab.style.pointerEvents = footerTop < window.innerHeight ? 'none' : 'auto';
    }, { passive: true });
  }

  /* ═══ 13. SMOOTH SCROLL NAVBAR LINKS ═══ */
  function initSmoothScroll() {
    document.querySelectorAll('nav a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ═══ 14. FIX MAINTENANCE MODE JS ERROR ═══ */
  function fixMaintenance() {
    // In index.html, `const maintenance = True;` is invalid JS (True !== true)
    // If the page reached this point, it means maintenance = ReferenceError was caught
    // or maintenance is false. Ensure body is visible.
    document.body.style.visibility = 'visible';
    document.documentElement.classList.remove('maintenance-mode');
  }

  /* ═══ INIT ═══ */
  function init() {
    fixMaintenance();
    initScrollBar();
    initStickyNav();
    initSmoothScroll();
    initParticles();
    inject3DBooks();
    injectOrbs();
    injectHeroBadge();
    initParallax();
    initScrollReveal();
    animateCounters();
    injectFAB();

    // Deferred for paint performance
    setTimeout(() => {
      initCardTilt();
      initSliderTilt();
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
