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
  // Manual pin instead of position:sticky (see the CSS comment on
  // .pin-scroll__sticky for why: an ancestor transform silently breaks
  // sticky/fixed descendants, which is what was happening here). While the
  // spacer spans the viewport, .pin-scroll__sticky is switched to
  // position:fixed so it visually holds in place; before/after that range
  // it's pinned to the spacer's own top/bottom via position:absolute so it
  // scrolls normally into and out of view like anything else.
  //
  // Extra scroll length is sized off the track's actual overflow (like a
  // normal horizontal scroller would need), not an arbitrary per-card
  // multiplier — six ~2.5-visible cards previously produced 600vh of mostly
  // empty scrolling. Progress through that distance is quantized to one
  // discrete step per card: the track's transform only changes (via its own
  // CSS transition, for the "탁탁" snap) when the step actually advances.
  const historySection = document.querySelector('.history.pin-scroll');
  if (historySection) {
    const spacer = historySection.querySelector('.pin-scroll__spacer');
    const sticky = historySection.querySelector('.pin-scroll__sticky');
    const track = historySection.querySelector('[data-pin-track]');
    const years = [...track.querySelectorAll('.history__year')];
    let lastStep = -1;
    let trackDistance = 0;

    const padding = () => parseFloat(getComputedStyle(track).paddingInlineStart) || 0;

    const goToStep = (i) => {
      if (i === lastStep) return;
      lastStep = i;
      const pad = padding();
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const target = Math.max(0, Math.min(years[i].offsetLeft - pad, max));
      track.style.transform = `translateX(${-target}px)`;
      years.forEach((y, idx) => y.classList.toggle('is-active', idx === i));
    };

    const measure = () => {
      trackDistance = Math.max(0, track.scrollWidth - track.clientWidth);
      spacer.style.height = `${window.innerHeight + trackDistance}px`;
    };

    const updatePin = (rect, vh) => {
      if (rect.top > 0) {
        sticky.style.position = 'absolute';
        sticky.style.top = '0px';
      } else if (rect.bottom < vh) {
        sticky.style.position = 'absolute';
        sticky.style.top = `${spacer.offsetHeight - vh}px`;
      } else {
        sticky.style.position = 'fixed';
        sticky.style.top = '0px';
      }
    };

    const apply = () => {
      const vh = window.innerHeight;
      const rect = spacer.getBoundingClientRect();
      updatePin(rect, vh);
      const total = rect.height - vh;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      const step = Math.round(progress * (years.length - 1));
      goToStep(step);
    };

    measure();
    goToStep(0);
    apply();
    window.addEventListener('resize', () => { measure(); lastStep = -1; apply(); });
    window.addEventListener('scroll', () => requestAnimationFrame(apply), { passive: true });
  }
})();
