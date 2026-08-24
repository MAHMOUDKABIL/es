document.addEventListener('DOMContentLoaded', function () {
  var emojiPattern = /[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2300}-\u{23FF}\u{1F900}-\u{1F9FF}]/gu;
  var textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var textNode;
  while ((textNode = textWalker.nextNode())) textNode.nodeValue = textNode.nodeValue.replace(emojiPattern, '');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touchDevice = window.matchMedia('(hover: none)').matches;

  if (document.body.classList.contains('home-page') && !reducedMotion) {
    var loader = document.createElement('div');
    loader.className = 'site-loader';
    loader.innerHTML = '<div class="loader-logo-stage"><model-viewer class="loader-3d-logo" src="https://raw.githubusercontent.com/MAHMOUDKABIL/ENTERSOFT/main/ener-soft-logo-3d.glb" alt="شعار ENTERSOFT ثلاثي الأبعاد" camera-controls interaction-prompt="none" shadow-intensity=".35" exposure="1.15"></model-viewer></div><div class="loader-line"><span></span></div>';
    document.body.prepend(loader);
    document.documentElement.classList.add('is-loading');
    var loaderStart = performance.now();
    function updateLoader(now) {
      var progress = Math.min((now - loaderStart) / 3000, 1);
      loader.querySelector('.loader-line span').style.width = (progress * 100) + '%';
      if (progress < 1) requestAnimationFrame(updateLoader);
      else {
        loader.classList.add('is-done');
        document.documentElement.classList.remove('is-loading');
        setTimeout(function () { loader.remove(); }, 700);
      }
    }
    requestAnimationFrame(updateLoader);
  }

  var progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = 'scaleX(' + (max ? window.scrollY / max : 0) + ')';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  if (!touchDevice && !reducedMotion) {
    var cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    document.body.appendChild(cursorGlow);
    window.addEventListener('pointermove', function (event) {
      cursorGlow.style.transform = 'translate3d(' + event.clientX + 'px,' + event.clientY + 'px,0)';
    }, { passive: true });
  }

  document.querySelectorAll('.service-card,.feature-card,.pricing-card,.testimonial-card,.step-card,.glass-card').forEach(function (card) {
    card.classList.add('motion-card');
    if (!touchDevice && !reducedMotion) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - .5;
        var y = (event.clientY - rect.top) / rect.height - .5;
        card.style.setProperty('--tilt-x', (y * -5) + 'deg');
        card.style.setProperty('--tilt-y', (x * 5) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    }
  });

  document.querySelectorAll('.btn,.service-card-link,.footer-social').forEach(function (element) {
    element.addEventListener('pointerenter', function () { element.classList.add('is-hovered'); });
    element.addEventListener('pointerleave', function () { element.classList.remove('is-hovered'); });
  });

  if (!reducedMotion) {
    window.addEventListener('scroll', function () {
      document.querySelectorAll('.grid-background,.bg-gradient-radial').forEach(function (element) {
        var rect = element.parentElement.getBoundingClientRect();
        element.style.setProperty('--parallax-y', (rect.top * -.06) + 'px');
      });
    }, { passive: true });
  }

  document.querySelectorAll('.mobile-menu-overlay').forEach(function (element, index) {
    if (index > 0) element.remove();
  });
  document.querySelectorAll('.mobile-menu').forEach(function (element, index) {
    if (index > 0) element.remove();
  });

  var menu = document.querySelector('.mobile-menu');
  var overlay = document.querySelector('.mobile-menu-overlay');
  var menuButton = document.querySelector('.mobile-menu-btn');
  var closeButton = document.querySelector('.mobile-menu-close');

  function closeMenu() {
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
  }

  if (menu && overlay && menuButton) {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.addEventListener('click', function () {
      menu.classList.add('open');
      overlay.classList.add('open');
      menuButton.setAttribute('aria-expanded', 'true');
    });
    overlay.addEventListener('click', closeMenu);
    if (closeButton) closeButton.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  var revealElements = document.querySelectorAll('.reveal-blur');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach(function (element) { revealObserver.observe(element); });
  } else {
    revealElements.forEach(function (element) { element.classList.add('visible'); });
  }

    var brand = document.querySelector('.nav-inner > a');
    if (brand && !document.querySelector('.nav-3d-logo')) {
      var oldLogo = brand.querySelector('.logo-img');
      if (oldLogo) oldLogo.remove();
      var logo = document.createElement('model-viewer');
      logo.className = 'nav-3d-logo';
      logo.setAttribute('src', 'https://raw.githubusercontent.com/MAHMOUDKABIL/ENTERSOFT/main/ener-soft-logo-3d.glb');
      logo.setAttribute('alt', 'شعار انترسوفت ثلاثي الأبعاد');
      logo.setAttribute('camera-controls', '');
      logo.setAttribute('interaction-prompt', 'none');
      logo.setAttribute('shadow-intensity', '.7');
      logo.setAttribute('exposure', '1.2');
      brand.prepend(logo);
    }
    var headerLogo = document.querySelector('.nav-3d-logo');
    if (headerLogo && !reducedMotion) {
      var logoX = 0;
      window.addEventListener('pointermove', function (event) {
        logoX += ((event.clientX / window.innerWidth - .5) * 18 - logoX) * .08;
        headerLogo.style.transform = 'translateX(' + logoX.toFixed(2) + 'px)';
      }, { passive: true });
    }
  var scrollButton = document.querySelector('.scroll-top-btn');
  if (scrollButton) {
    window.addEventListener('scroll', function () {
      scrollButton.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    scrollButton.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (document.body.classList.contains('home-page')) {
    var fallback = document.querySelector('.plasma-fallback');
    if (fallback) {
      var nodes = document.createElement('div');
      nodes.className = 'plasma-nodes';
      for (var nodeIndex = 0; nodeIndex < 24; nodeIndex++) {
        var node = document.createElement('i');
        node.style.setProperty('--node-x', (12 + (nodeIndex * 37) % 76) + '%');
        node.style.setProperty('--node-y', (9 + (nodeIndex * 53) % 82) + '%');
        node.style.setProperty('--node-delay', (nodeIndex * -0.13) + 's');
        nodes.appendChild(node);
      }
      fallback.appendChild(nodes);
    }
  }

  var cookieBanner = document.querySelector('.cookie-banner');
  var cookieChoice = localStorage.getItem('entersoft-cookie-choice');
  if (cookieBanner && !cookieChoice) cookieBanner.classList.add('visible');
  document.querySelectorAll('.cookie-accept, .cookie-decline').forEach(function (button) {
    button.addEventListener('click', function () {
      localStorage.setItem('entersoft-cookie-choice', button.classList.contains('cookie-accept') ? 'accepted' : 'later');
      if (cookieBanner) cookieBanner.classList.remove('visible');
    });
  });

  document.querySelectorAll('.faq-question').forEach(function (question) {
    question.setAttribute('aria-expanded', question.closest('.faq-item').classList.contains('open') ? 'true' : 'false');
    question.addEventListener('click', function () {
      var item = question.closest('.faq-item');
      var isOpen = item.classList.toggle('open');
      question.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });
});
