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

  // ---------- History: pinned reveal, one card per wheel notch ----------
  // .history-pin__spacer holds .history-pin__sticky (position:sticky) on
  // screen while the track pages horizontally via native CSS scroll-snap.
  // Each wheel tick advances/retreats exactly one card via scrollTo() and
  // preventDefault()s only while another card transition is possible; at
  // the first/last card the event is left alone so the page scrolls on
  // normally — this can never trap scrolling like the earlier wheel-hijack
  // version did. Skipped below 1025px, where CSS falls back to a plain
  // swipeable overflow-x strip (see the matching @media block).
  const historySpacer = document.querySelector('.history-pin__spacer');
  const historyTrack = document.querySelector('[data-pin-track]');
  if (historySpacer && historyTrack && window.matchMedia('(min-width: 1025px)').matches) {
    const years = [...historyTrack.querySelectorAll('.history__year')];
    let index = 0;
    let locked = false;

    const markActive = () => years.forEach((y, i) => y.classList.toggle('is-active', i === index));

    const goTo = (next) => {
      index = Math.max(0, Math.min(years.length - 1, next));
      historyTrack.scrollTo({ left: years[index].offsetLeft, behavior: 'smooth' });
      markActive();
      locked = true;
      window.clearTimeout(goTo._t);
      goTo._t = window.setTimeout(() => { locked = false; }, 550);
    };

    historySpacer.addEventListener('wheel', (e) => {
      if (locked) { e.preventDefault(); return; }
      if (e.deltaY > 0 && index < years.length - 1) {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.deltaY < 0 && index > 0) {
        e.preventDefault();
        goTo(index - 1);
      }
    }, { passive: false });

    markActive();
  }
})();
