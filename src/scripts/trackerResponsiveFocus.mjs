// Preserve an open offer's keyboard position when container-query layout
// switches hide its responsive copy. No initial focus or pointer recovery.
const FOCUSABLE = 'a[href],button,input,select,textarea,summary,[tabindex="0"]';
const CONTROL = /^dpst-(desktop|mobile)-([a-z0-9-]+)$/;

export function installTrackerResponsiveFocus(root) {
  if (typeof ResizeObserver === 'undefined') return () => {};
  let owned = null;
  let frame = null;
  let keyboardFrame = null;
  let keyboardMode = false;
  let stopped = false;
  const visible = node => !!node && !node.closest('[hidden]') && node.getClientRects().length > 0;
  const clear = () => { owned = null; };
  const remember = event => {
    const node = event.target;
    clear();
    if (!keyboardMode || !root.contains(node) || !node.closest) return;
    const controlId = node.getAttribute('aria-controls');
    const panel = node.closest('[id^="dpst-desktop-"],[id^="dpst-mobile-"]');
    const id = controlId || panel?.id;
    const match = CONTROL.exec(id || '');
    if (!match) return;
    const control = root.querySelector(`[aria-controls="${id}"]`);
    if (!control || !visible(node)) return;
    const position = node === control ? -1 : [...panel.querySelectorAll(FOCUSABLE)].indexOf(node);
    if (node !== control && position < 0) return;
    owned = { node, control, id, view: match[1], offer: match[2], position, hiddenBlur: false };
  };
  const blur = event => {
    if (!owned || event.target !== owned.node) return;
    // A deliberate blur/body focus while the control is still visible is
    // not permission to recover focus later. Pointerdown also clears first.
    if (event.relatedTarget || visible(owned.node)) clear();
    else owned.hiddenBlur = true;
  };
  const recover = () => {
    frame = null;
    if (stopped || !owned) return;
    const previous = owned;
    if (!root.contains(previous.node) || !root.contains(previous.control)
      || previous.control.getAttribute('aria-expanded') !== 'true') { clear(); return; }
    // A collapsed inner disclosure is not a responsive layout transition.
    if (visible(previous.control)) { if (!visible(previous.node)) clear(); return; }
    const active = document.activeElement;
    if (active !== previous.node && !(active === document.body && previous.hiddenBlur)) { clear(); return; }
    const otherId = `dpst-${previous.view === 'mobile' ? 'desktop' : 'mobile'}-${previous.offer}`;
    const control = root.querySelector(`[aria-controls="${otherId}"]`);
    const panel = root.querySelector(`[id="${otherId}"]`);
    if (!control || !panel || !visible(control) || control.getAttribute('aria-expanded') !== 'true') { clear(); return; }
    let target = control;
    if (previous.position >= 0) {
      const equivalent = panel.querySelectorAll(FOCUSABLE)[previous.position];
      if (visible(equivalent) && equivalent.tagName === previous.node.tagName
        && equivalent.getAttribute('href') === previous.node.getAttribute('href')) target = equivalent;
    }
    clear();
    target.focus({ preventScroll: true });
  };
  const resize = () => {
    if (frame === null && owned && !stopped) frame = requestAnimationFrame(recover);
  };
  const pointerDown = () => { keyboardMode = false; clear(); };
  const keyboard = () => {
    keyboardMode = true;
    const active = document.activeElement;
    remember({ target: active });
    if (keyboardFrame !== null) cancelAnimationFrame(keyboardFrame);
    // Space/Enter may expand the offer after the key's default action.
    // Recheck only that same focus; never resurrect displaced focus.
    keyboardFrame = requestAnimationFrame(() => {
      keyboardFrame = null;
      // Chromium can hide the old copy before dispatching focusout. Do
      // not erase that pending resize ownership from a queued key frame.
      if (!stopped && keyboardMode && document.activeElement === active && visible(active)) remember({ target: active });
    });
  };
  const windowBlur = event => { if (event.target === window) clear(); };
  const visibility = () => { if (document.hidden) clear(); };
  const observer = new ResizeObserver(resize);
  document.addEventListener('focusin', remember, true);
  document.addEventListener('focusout', blur, true);
  document.addEventListener('pointerdown', pointerDown, true);
  document.addEventListener('keydown', keyboard, true);
  document.addEventListener('keyup', keyboard, true);
  window.addEventListener('blur', windowBlur, true);
  document.addEventListener('visibilitychange', visibility);
  observer.observe(root);
  return () => {
    stopped = true;
    clear();
    if (frame !== null) cancelAnimationFrame(frame);
    if (keyboardFrame !== null) cancelAnimationFrame(keyboardFrame);
    observer.disconnect();
    document.removeEventListener('focusin', remember, true);
    document.removeEventListener('focusout', blur, true);
    document.removeEventListener('pointerdown', pointerDown, true);
    document.removeEventListener('keydown', keyboard, true);
    document.removeEventListener('keyup', keyboard, true);
    window.removeEventListener('blur', windowBlur, true);
    document.removeEventListener('visibilitychange', visibility);
  };
}
