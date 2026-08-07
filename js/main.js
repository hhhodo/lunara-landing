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

  // ---------- History: one card per wheel notch, no vertical pin ----------
  // The section has no scroll-jacked spacer anymore (it now just sits in
  // normal flow, sized to fit one screen) — the year row pages horizontally
  // via native CSS scroll-snap. Each wheel tick advances/retreats exactly
  // one card via scrollTo() and preventDefault()s only while another card
  // transition is possible; at the first/last card the event is left alone
  // so the page scrolls on normally — this can never trap scrolling like
  // the earlier wheel-hijack version did.
  // The listener is on `window`, gated by the section's own
  // getBoundingClientRect() (top<=0 && bottom>=viewport height) rather than
  // attached to the section element and relying on hover — an
  // element-attached listener only fires where the cursor happens to be,
  // and while the section is entering/leaving (its top or bottom edge still
  // mid-screen) that region covers just PART of the viewport, so whether
  // snap engaged ended up depending on mouse position: sometimes the cursor
  // sat over the neighboring section and wheel just scrolled the page raw,
  // sometimes it sat over History before the section had even fully arrived
  // and a card would advance before the section was centered. Gating by
  // scroll position instead makes it fire consistently regardless of where
  // the mouse is, and only once the section actually fills the screen.
  // While a transition is in flight ("busy"), further wheel ticks are
  // swallowed so one trackpad gesture (which fires many small wheel events)
  // can't blow through several cards at once — busy clears on the track's
  // own 'scrollend' (fires the moment the smooth-scroll actually settles,
  // so it can't outlast the animation the way an earlier fixed 550ms lock
  // did, which felt like scrolling had gotten stuck). A short timeout is
  // kept only as a fallback for engines without 'scrollend' support.
  // Skipped below 1025px, where CSS falls back to a plain swipeable
  // overflow-x strip (see the matching @media block).
  const historySection = document.querySelector('.history');
  const historyTrack = document.querySelector('[data-pin-track]');
  if (historySection && historyTrack && window.matchMedia('(min-width: 1025px)').matches) {
    const years = [...historyTrack.querySelectorAll('.history__year')];
    let index = 0;
    let busy = false;
    let busyTimer = null;

    const markActive = () => years.forEach((y, i) => y.classList.toggle('is-active', i === index));

    const clearBusy = () => { busy = false; window.clearTimeout(busyTimer); };
    historyTrack.addEventListener('scrollend', clearBusy);

    const goTo = (next) => {
      index = Math.max(0, Math.min(years.length - 1, next));
      busy = true;
      historyTrack.scrollTo({ left: years[index].offsetLeft, behavior: 'smooth' });
      markActive();
      window.clearTimeout(busyTimer);
      busyTimer = window.setTimeout(clearBusy, 700);
    };

    const fillsViewport = () => {
      const rect = historySection.getBoundingClientRect();
      return rect.top <= 0.5 && rect.bottom >= window.innerHeight - 0.5;
    };

    window.addEventListener('wheel', (e) => {
      if (!fillsViewport()) return;
      if (busy) { e.preventDefault(); return; }
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
