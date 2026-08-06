(() => {
  const revealEls = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  revealEls.forEach((el) => io.observe(el));

  // ---------- horizontal scroll tracks (Featured / History) ----------
  // Native overflow-x:auto already lets these scroll via trackpad/shift+wheel/touch;
  // this only adds mouse-drag support so a plain click-drag also pans the track.
  document.querySelectorAll('.h-scroll').forEach((track) => {
    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    const endDrag = () => { isDown = false; track.classList.remove('is-dragging'); };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);
  });

  // ---------- History: pinned, ONE-CARD-PER-STEP reveal ----------
  // The section (.pin-scroll) sticks to the viewport via position:sticky inside
  // a tall spacer, for exactly the scroll distance needed to step through every
  // year. Scroll progress through that spacer is quantized to a discrete step
  // index (one per card) rather than driving the transform continuously 1:1 —
  // .history__years only gets a NEW transform value when the step actually
  // changes, so its own CSS transition plays a clean "탁탁" snap between
  // fixed positions instead of smoothly sliding with the raw scroll. Whichever
  // card is the current step gets .is-active (brightens its divider white).
  const historySection = document.querySelector('.history.pin-scroll');
  if (historySection) {
    const spacer = historySection.querySelector('.pin-scroll__spacer');
    const track = historySection.querySelector('[data-pin-track]');
    const years = [...track.querySelectorAll('.history__year')];
    let lastStep = -1;

    const padding = () => parseFloat(getComputedStyle(track).paddingInlineStart) || 0;

    const goToStep = (i) => {
      if (i === lastStep) return;
      lastStep = i;
      const pad = padding();
      const max = track.scrollWidth - track.clientWidth;
      const target = Math.max(0, Math.min(years[i].offsetLeft - pad, max));
      track.style.transform = `translateX(${-target}px)`;
      years.forEach((y, idx) => y.classList.toggle('is-active', idx === i));
    };

    const measure = () => {
      // one full screen-height of scroll per card step, so each step is a
      // deliberate, distinct scroll action rather than a fraction of a swipe
      spacer.style.height = `${window.innerHeight * years.length}px`;
    };

    const apply = () => {
      const rect = spacer.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      const step = Math.round(progress * (years.length - 1));
      goToStep(step);
    };

    measure();
    goToStep(0);
    window.addEventListener('resize', () => { measure(); lastStep = -1; apply(); });
    window.addEventListener('scroll', () => requestAnimationFrame(apply), { passive: true });
  }
})();
