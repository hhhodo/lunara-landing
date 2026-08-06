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

  // ---------- History: whichever year is closest to the track's left edge
  // (its first real grid line) gets .is-active, brightening its divider
  // white. Purely a passive readout of scrollLeft — it does NOT move the
  // track itself. (A previous version force-scrolled to the nearest card
  // ~140ms after scrolling stopped, which is what caused the "pauses then
  // jumps" feel instead of moving continuously with the scroll input.) ----------
  const historyTrack = document.querySelector('.history__years');
  if (historyTrack) {
    const years = [...historyTrack.querySelectorAll('.history__year')];
    const padding = () => parseFloat(getComputedStyle(historyTrack).paddingInlineStart) || 0;

    const findClosest = () => {
      const pad = padding();
      let closest = years[0];
      let closestDist = Infinity;
      years.forEach((year) => {
        const dist = Math.abs((year.offsetLeft - pad) - historyTrack.scrollLeft);
        if (dist < closestDist) { closestDist = dist; closest = year; }
      });
      return closest;
    };

    const markActive = (year) => {
      years.forEach((y) => y.classList.toggle('is-active', y === year));
    };

    let ticking = false;
    historyTrack.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { ticking = false; markActive(findClosest()); });
      }
    }, { passive: true });

    markActive(findClosest());
  }

  // ---------- History pin: while the section is stuck on screen
  // (.history-pin__spacer is CSS position:sticky — see site.css, height is
  // a fixed 220vh so this doesn't depend on any JS measurement to be
  // visible), redirect vertical wheel/trackpad scroll 1:1 into the track's
  // horizontal scrollLeft instead of the page — moves continuously with the
  // scroll input, no snapping/delay. Once the track has reached either end,
  // stop intercepting so the page scrolls normally past the section. ----------
  const historySpacer = document.querySelector('.history-pin__spacer');
  if (historyTrack && historySpacer) {
    historySpacer.addEventListener('wheel', (e) => {
      if (e.deltaY === 0) return;
      const max = historyTrack.scrollWidth - historyTrack.clientWidth;
      const atStart = historyTrack.scrollLeft <= 0;
      const atEnd = historyTrack.scrollLeft >= max - 1;
      const scrollingDown = e.deltaY > 0;
      if ((scrollingDown && atEnd) || (!scrollingDown && atStart)) return;
      e.preventDefault();
      historyTrack.scrollLeft += e.deltaY;
    }, { passive: false });
  }
})();
