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

  // ---------- History: whichever year is snapped to the track's left edge
  // (its own first grid line) gets .is-active, brightening its divider white ----------
  const historyTrack = document.querySelector('.history__years');
  if (historyTrack) {
    const years = [...historyTrack.querySelectorAll('.history__year')];
    let ticking = false;
    const updateActive = () => {
      ticking = false;
      let closest = null;
      let closestDist = Infinity;
      years.forEach((year) => {
        const dist = Math.abs(year.offsetLeft - historyTrack.scrollLeft);
        if (dist < closestDist) { closestDist = dist; closest = year; }
      });
      years.forEach((year) => year.classList.toggle('is-active', year === closest));
    };
    historyTrack.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateActive);
      }
    }, { passive: true });
    updateActive();
  }
})();
