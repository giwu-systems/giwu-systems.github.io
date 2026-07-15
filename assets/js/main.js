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

  /* ---------- Scroll progress bar ----------
     (Active nav state is set per-page in the HTML now that this is a
     multi-page site, so there is no scroll-spy to toggle it.) */
  var progress = document.querySelector('.progress-bar');
  var ticking = false;
  function onScroll() {
    var top = docEl.scrollTop || document.body.scrollTop;
    var max = docEl.scrollHeight - docEl.clientHeight;
    if (progress) {
      progress.style.width = (max > 0 ? (top / max * 100) : 0) + '%';
      progress.style.opacity = top > 4 ? '1' : '0';
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

/* ============================================================
   Modals — "Get Started" application form + Team profiles
   ============================================================ */
(function () {
  'use strict';
  var openM = null;
  function open(m) {
    if (!m) return;
    m.classList.add('open');
    openM = m;
    document.body.style.overflow = 'hidden';
    var focusable = m.querySelector('input, textarea, .modal-close');
    if (focusable) window.setTimeout(function () { focusable.focus(); }, 40);
  }
  function close() {
    if (!openM) return;
    openM.classList.remove('open');
    document.body.style.overflow = '';
    openM = null;
  }

  // Open the Get Started application modal
  Array.prototype.forEach.call(document.querySelectorAll('[data-modal="start"]'), function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); open(document.getElementById('start-modal')); });
  });

  // Team cards -> profile modal (photo gallery + social links)
  var teamModal = document.getElementById('team-modal');
  if (teamModal) {
    var avatarBox = document.getElementById('tm-avatar');
    var dotsBox = document.getElementById('tm-dots');
    var socialsBox = document.getElementById('tm-socials');
    var ICON = {
      li: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 8.5H3.4V21h3.1V8.5zM4.9 7.1a1.85 1.85 0 1 0 0-3.7 1.85 1.85 0 0 0 0 3.7zM21 13.9c0-3.4-1.8-5-4.2-5-1.9 0-2.8 1-3.3 1.8V8.5h-3.1V21h3.1v-6.2c0-1.6.7-2.6 2.1-2.6 1.3 0 1.9.9 1.9 2.6V21H21v-7.1z"></path></svg>',
      fb: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8.1h2.7l.4-3.1h-3.1V8.8c0-.9.25-1.5 1.55-1.5h1.65V4.5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.45-4 4.1v2.3H7.6v3.1h2.7V22h3.2z"></path></svg>',
      ig: '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"></rect><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"></circle><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"></circle></svg>'
    };
    var LABEL = { li: 'LinkedIn', fb: 'Facebook', ig: 'Instagram' };

    Array.prototype.forEach.call(document.querySelectorAll('.team-card[data-name]'), function (card) {
      var show = function () {
        var name = card.getAttribute('data-name');
        var imgs = (card.getAttribute('data-imgs') || '').split(',')
          .map(function (x) { return x.trim(); }).filter(Boolean);
        var idx = 0;

        function render(initial) {
          if (!imgs.length) {
            avatarBox.innerHTML = '<span class="avatar avatar-initials ' +
              (card.getAttribute('data-avatar-class') || '') + '">' +
              (card.getAttribute('data-initials') || '') + '</span>';
            return;
          }
          var cur = avatarBox.querySelector('img');
          if (initial || !cur) {
            avatarBox.innerHTML = '<img class="avatar" src="' + imgs[idx] + '" alt="' + name + '">';
          } else {
            cur.style.opacity = '0';
            window.setTimeout(function () { cur.src = imgs[idx]; cur.style.opacity = '1'; }, 180);
          }
          Array.prototype.forEach.call(dotsBox.children, function (d, i) {
            d.classList.toggle('active', i === idx);
          });
        }

        // Photo dots — only when the member has more than one photo
        dotsBox.innerHTML = '';
        avatarBox.classList.toggle('has-more', imgs.length > 1);
        if (imgs.length > 1) {
          imgs.forEach(function (_, i) {
            var d = document.createElement('button');
            d.type = 'button';
            d.className = 'tm-dot' + (i === 0 ? ' active' : '');
            d.setAttribute('aria-label', 'Photo ' + (i + 1) + ' of ' + imgs.length);
            d.addEventListener('click', function () { idx = i; render(false); });
            dotsBox.appendChild(d);
          });
        }
        // Click the photo to cycle to the next one
        avatarBox.onclick = imgs.length > 1
          ? function () { idx = (idx + 1) % imgs.length; render(false); }
          : null;

        render(true);
        document.getElementById('tm-name').textContent = name;
        document.getElementById('tm-role').textContent = card.getAttribute('data-role');
        document.getElementById('tm-bio').textContent = card.getAttribute('data-bio');

        // Social links
        socialsBox.innerHTML = '';
        ['li', 'fb', 'ig'].forEach(function (k) {
          var url = card.getAttribute('data-' + k);
          if (!url) return;
          var a = document.createElement('a');
          a.className = 'social-link';
          a.href = url;
          a.setAttribute('aria-label', name + ' on ' + LABEL[k]);
          if (url !== '#') { a.target = '_blank'; a.rel = 'noopener'; }
          a.innerHTML = ICON[k];
          socialsBox.appendChild(a);
        });

        open(teamModal);
      };
      card.addEventListener('click', show);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); show(); }
      });
    });
  }

  // Close: backdrop click, X button, Escape
  Array.prototype.forEach.call(document.querySelectorAll('.modal'), function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    var x = m.querySelector('.modal-close');
    if (x) x.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // Application form submit -> compose an email (no backend on GitHub Pages)
  var sf = document.getElementById('start-form');
  if (sf) {
    var status = sf.querySelector('.form-status');
    sf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!sf.checkValidity()) {
        if (status) { status.textContent = 'Please fill in the required fields with a valid email.'; status.className = 'form-status err'; }
        var fi = sf.querySelector(':invalid'); if (fi) fi.focus();
        return;
      }
      var d = new FormData(sf);
      var body = 'Name: ' + d.get('name') + '\nEmail: ' + d.get('email') +
        '\nCompany: ' + (d.get('org') || '-') + '\n\nWhat to automate:\n' + d.get('message');
      var mail = 'mailto:info@giwusystems.com?subject=' +
        encodeURIComponent('New inquiry - ' + d.get('name')) + '&body=' + encodeURIComponent(body);
      if (status) { status.textContent = 'Opening your email app to send your application…'; status.className = 'form-status ok'; }
      window.location.href = mail;
    });
  }
})();
