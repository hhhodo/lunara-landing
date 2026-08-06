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

  // ---------- History: pinned reveal via a PASSIVE scroll listener ----------
  // .history-pin__spacer is a fixed-height (220vh, plain CSS) box; while it
  // spans the viewport, .history-pin__sticky (position:sticky) holds the
  // track on screen. This listener only ever READS scroll position
  // (window 'scroll', passive:true) and WRITES a translateX transform to
  // the track — it never calls preventDefault and never touches scrollLeft,
  // so unlike the earlier wheel-hijack version it cannot block or trap page
  // scrolling under any circumstance. Skipped below 1025px, where CSS falls
  // back to a plain overflow-x strip (see the matching @media block).
  const historySection = document.querySelector('.history');
  const historySpacer = document.querySelector('.history-pin__spacer');
  const historyTrack = document.querySelector('[data-pin-track]');
  if (historySection && historySpacer && historyTrack && window.matchMedia('(min-width: 1025px)').matches) {
    const years = [...historyTrack.querySelectorAll('.history__year')];
    const trackDistance = Math.max(0, historyTrack.scrollWidth - historyTrack.clientWidth);

    const markActive = () => {
      const pad = parseFloat(getComputedStyle(historyTrack).paddingInlineStart) || 0;
      const trackLeft = historyTrack.getBoundingClientRect().left + pad;
      let closest = years[0];
      let closestDist = Infinity;
      years.forEach((year) => {
        const dist = Math.abs(year.getBoundingClientRect().left - trackLeft);
        if (dist < closestDist) { closestDist = dist; closest = year; }
      });
      years.forEach((y) => y.classList.toggle('is-active', y === closest));
    };

    let ticking = false;
    const apply = () => {
      ticking = false;
      if (trackDistance <= 0) return;
      const rect = historySpacer.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      historyTrack.style.transform = `translateX(${-progress * trackDistance}px)`;
      markActive();
    };

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });

    apply();
  }
})();
