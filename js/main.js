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

  // ---------- pinned horizontal reveal: Philosophy needs / History years ----------
  // The section (.pin-scroll) stays on screen via position:sticky inside a tall
  // spacer for exactly the vertical distance needed to horizontally reveal every
  // card in [data-pin-track]; page scroll progress through that spacer maps
  // directly to translateX on the track, so all content becomes visible before
  // the page is allowed to continue past the section.
  const initPinScroll = (section) => {
    const spacer = section.querySelector('.pin-scroll__spacer');
    const sticky = section.querySelector('.pin-scroll__sticky');
    const track = section.querySelector('[data-pin-track]');
    if (!spacer || !sticky || !track) return;

    let trackDistance = 0;

    const measure = () => {
      trackDistance = Math.max(0, track.scrollWidth - track.clientWidth);
      spacer.style.height = `${window.innerHeight + trackDistance}px`;
    };

    const apply = () => {
      if (trackDistance <= 0) { track.style.transform = ''; return; }
      const rect = spacer.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      track.style.transform = `translateX(${-progress * trackDistance}px)`;
      return progress;
    };

    measure();
    window.addEventListener('resize', () => { measure(); apply(); });
    window.addEventListener('scroll', () => requestAnimationFrame(apply), { passive: true });
    apply();

    return { apply, get trackDistance() { return trackDistance; } };
  };

  document.querySelectorAll('.pin-scroll').forEach((section) => initPinScroll(section));

  // ---------- History: whichever year currently sits at the track's own left
  // edge (its leading grid inset) gets .is-active, brightening its divider
  // white. getBoundingClientRect() already reflects the translateX applied by
  // initPinScroll above, so comparing on-screen rects directly (no separate
  // scroll container or transform-parsing needed). ----------
  const historyTrack = document.querySelector('.history .pin-scroll [data-pin-track]');
  if (historyTrack) {
    const years = [...historyTrack.querySelectorAll('.history__year')];
    const markActive = () => {
      // reference point = the track's own leading inset (true grid line 1),
      // not its raw border-box edge, which sits one column further left
      const pad = parseFloat(getComputedStyle(historyTrack).paddingInlineStart) || 0;
      const lineOne = historyTrack.getBoundingClientRect().left + pad;
      let closest = years[0];
      let closestDist = Infinity;
      years.forEach((year) => {
        const dist = Math.abs(year.getBoundingClientRect().left - lineOne);
        if (dist < closestDist) { closestDist = dist; closest = year; }
      });
      years.forEach((y) => y.classList.toggle('is-active', y === closest));
    };
    window.addEventListener('scroll', () => requestAnimationFrame(markActive), { passive: true });
    markActive();
  }
})();
