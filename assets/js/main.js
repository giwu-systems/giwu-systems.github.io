/* ============================================================
   GIWU Systems, Inc. — interactions
   ============================================================ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  // JS is available: drop the no-js fallback so scroll-reveal can animate.
  // (If this file fails to load, no-js stays and .reveal content stays visible.)
  docEl.classList.remove('no-js');

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.querySelector('.theme-btn');
  if (themeBtn) {
    var setThemeLabel = function () {
      themeBtn.setAttribute('aria-label',
        docEl.classList.contains('light') ? 'Switch to dark mode' : 'Switch to light mode');
    };
    setThemeLabel();
    themeBtn.addEventListener('click', function () {
      var isLight = docEl.classList.toggle('light');
      try { localStorage.setItem('giwu-theme', isLight ? 'light' : 'dark'); } catch (e) {}
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', isLight ? '#FFFFFF' : '#071120');
      setThemeLabel();
    });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('primary-nav');
  function closeMenu(returnFocus) {
    if (!nav) return;
    var hadFocusInside = nav.contains(document.activeElement);
    nav.classList.remove('open');
    if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); }
    // The collapsed menu is visibility:hidden, which drops keyboard focus to
    // <body>; return focus to the toggle when focus was inside the menu.
    if ((returnFocus || hadFocusInside) && burger) burger.focus();
  }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1020) closeMenu();
    });
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revObs.observe(el); });
  }

  /* ---------- Animated counters ---------- */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / 1100, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (!('IntersectionObserver' in window)) {
    counters.forEach(runCounter);
  } else {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); cObs.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cObs.observe(el); });
  }

  /* ---------- Scroll progress + scroll-spy nav ---------- */
  var progress = document.querySelector('.progress-bar');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sections = navLinks.map(function (link) {
    var id = (link.getAttribute('href') || '').replace('#', '');
    if (id === 'top' || id === '') return document.querySelector('.hero');
    return document.getElementById(id);
  });
  var ticking = false;
  function onScroll() {
    var top = docEl.scrollTop || document.body.scrollTop;
    var max = docEl.scrollHeight - docEl.clientHeight;
    if (progress) {
      progress.style.width = (max > 0 ? (top / max * 100) : 0) + '%';
      progress.style.opacity = top > 4 ? '1' : '0';
    }
    var activeIndex = 0;
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      if (sec && sec.getBoundingClientRect().top <= 140) activeIndex = i;
    }
    for (var j = 0; j < navLinks.length; j++) {
      navLinks[j].classList.toggle('active', j === activeIndex);
    }
    ticking = false;
  }
  function requestTick() {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  /* ---------- Contact form (Netlify Forms) ----------
     Submits to Netlify over AJAX so the inline success message stays put.
     Netlify auto-detects the form (name="quote" + data-netlify) at deploy time
     and collects every submission under the site's "Forms" tab — no server code.
     Off Netlify (local preview) the POST to "/" fails; that's expected and only
     works on the deployed site. To route elsewhere, change the fetch URL below.
  --------------------------------------------------- */
  var form = document.getElementById('quote-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('.btn-submit');
    var resetTimer = null;

    function showStatus(msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status ' + kind;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        showStatus('Please fill in the required fields with a valid email.', 'err');
        var firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showStatus('Request sent — thank you! We’ll reply within one business day.', 'ok');
        form.reset();
        clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function () {
          // Clear text but keep the live region in the a11y tree (no display:none).
          if (status) { status.textContent = ''; status.className = 'form-status'; }
        }, 6000);
      }).catch(function () {
        showStatus('Sorry — something went wrong. Please email info@giwusystems.com and we’ll get right back to you.', 'err');
      }).finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Request'; }
      });
    });
  }

  /* ---------- Motion polish (pointer-fine + motion-OK only) ---------- */
  var fineHover = window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fineHover && !reduceMotion) {
    // Cursor-following spotlight on cards
    var spotEls = document.querySelectorAll('.card, .step-card, .team-card, .value-row');
    Array.prototype.forEach.call(spotEls, function (el) {
      el.classList.add('spotlight');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
    // Magnetic pull on the main gradient CTAs
    var magEls = document.querySelectorAll('.btn-gradient, .cta-btn');
    Array.prototype.forEach.call(magEls, function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.transform = 'translate(' +
          ((e.clientX - (r.left + r.width / 2)) * 0.22) + 'px,' +
          ((e.clientY - (r.top + r.height / 2)) * 0.32) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
    // Subtle parallax on the hero grid
    var heroEl = document.querySelector('.hero');
    var heroGrid = document.querySelector('.hero-grid');
    if (heroEl && heroGrid) {
      heroEl.addEventListener('pointermove', function (e) {
        var r = heroEl.getBoundingClientRect();
        var cx = (e.clientX - r.left) / r.width - 0.5;
        var cy = (e.clientY - r.top) / r.height - 0.5;
        heroGrid.style.transform = 'translate(' + (cx * -18) + 'px,' + (cy * -14) + 'px)';
      });
      heroEl.addEventListener('pointerleave', function () { heroGrid.style.transform = ''; });
    }
  }
})();
