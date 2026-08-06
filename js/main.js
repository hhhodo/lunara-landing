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
  // (its first real grid line) gets .is-active, brightening its divider
  // white. CSS scroll-snap handles the actual "탁탁" magnetic feel; this
  // just tracks which card ends up there and also force-corrects the final
  // rest position after scrolling settles, since a custom pointer-drag that
  // writes scrollLeft directly isn't always treated as a native "scroll
  // gesture" by every browser's snap engine. ----------
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

    const snapTo = (year) => {
      const max = historyTrack.scrollWidth - historyTrack.clientWidth;
      const target = Math.max(0, Math.min(year.offsetLeft - padding(), max));
      historyTrack.scrollTo({ left: target, behavior: 'smooth' });
    };

    let ticking = false;
    let settleTimer = null;
    historyTrack.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { ticking = false; markActive(findClosest()); });
      }
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => snapTo(findClosest()), 140);
    }, { passive: true });

    markActive(findClosest());
  }

  // ---------- History pin: while the section is stuck on screen
  // (.history-pin__spacer is CSS position:sticky — see site.css, height is
  // a fixed 220vh so this doesn't depend on any JS measurement to be
  // visible), redirect vertical wheel/trackpad scroll into the track's
  // horizontal scrollLeft instead of the page. Once the track has reached
  // either end, stop intercepting so the page scrolls normally past the
  // section — this is what makes it feel like scrolling "auto-advances"
  // the cards while the section holds in place, on top of the manual
  // drag/native-scroll that already works on the track directly. ----------
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
