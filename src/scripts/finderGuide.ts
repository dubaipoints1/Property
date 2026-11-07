/** Optional guidance, not a second form or a forced onboarding route. */
export function initialiseFinderGuide() {
  const guide = document.querySelector<HTMLElement>("[data-finder-guide]");
  const form = document.querySelector<HTMLFormElement>("#finder-form");
  const filters = document.querySelector<HTMLDetailsElement>("#finder-filters");
  if (!guide || !form || !filters) return;
  const controls = guide.querySelector<HTMLElement>("[data-guide-controls]")!;
  const label = guide.querySelector<HTMLElement>("[data-guide-label]")!;
  const start = guide.querySelector<HTMLButtonElement>("[data-guide-start]")!;
  const back = guide.querySelector<HTMLButtonElement>("[data-guide-back]")!;
  const next = guide.querySelector<HTMLButtonElement>("[data-guide-next]")!;
  const skip = guide.querySelector<HTMLButtonElement>("[data-guide-skip]")!;
  const steps = ["goal", "eligibility", "refine"];
  const text = ["1 of 3 · Choose a reward preference. The full controls remain available.", "2 of 3 · Salary is optional. Published minimums do not guarantee approval.", "3 of 3 · Refine network, fees or spending, then apply the same form. The separate monthly estimate does not change eligibility or rate order."];
  const originalNext = guide.nextSibling;
  const originalParent = guide.parentNode;
  const statusId = "finder-guide-step-status";
  let described: HTMLElement | null = null;
  const clearDescription = () => {
    if (!described) return;
    const ids = (described.getAttribute?.("aria-describedby") ?? "").split(/\s+/).filter(id => id && id !== statusId);
    if (ids.length) described.setAttribute("aria-describedby", ids.join(" "));
    else described.removeAttribute?.("aria-describedby");
    described = null;
  };
  let step = 0;
  const show = () => {
    filters.open = true; controls.hidden = false; start.hidden = true;
    label.textContent = text[step]; back.disabled = step === 0;
    next.textContent = step === 2 ? "Apply choices" : "Next";
    skip.hidden = step !== 1;
    const fieldset = form.querySelector<HTMLElement>(`[data-guide-step="${steps[step]}"]`);
    const details = fieldset?.closest<HTMLDetailsElement>("details"); if (details) details.open = true;
    // Put navigation after the active controls: keyboard readers encounter the
    // field and then Back/Next, not a detached toolbar above it.
    const row = fieldset?.closest<HTMLElement>(".dp-finder-fs-row");
    (row ?? fieldset)?.after?.(guide);
    clearDescription();
    const input = fieldset?.querySelector<HTMLElement>("input, select");
    if (input) {
      const ids = new Set((input.getAttribute?.("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
      ids.add(statusId); input.setAttribute("aria-describedby", [...ids].join(" "));
      described = input;
      input.focus();
    }
  };
  start.addEventListener("click", () => { step = 0; show(); });
  back.addEventListener("click", () => { step = Math.max(0, step - 1); show(); });
  next.addEventListener("click", () => { if (step === 2) form.requestSubmit(); else { step++; show(); } });
  skip.addEventListener("click", () => { const salary = form.querySelector<HTMLInputElement>('input[name="salary"]'); if (salary) salary.value = ""; step = 2; show(); });
  guide.querySelector<HTMLButtonElement>("[data-guide-all]")?.addEventListener("click", () => {
    controls.hidden = true; start.hidden = false; filters.open = true;
    const more = form.querySelector<HTMLDetailsElement>("#finder-more"); if (more) more.open = true;
    clearDescription();
    originalParent?.insertBefore(guide, originalNext);
    form.querySelector<HTMLElement>("input:not([type=hidden]), select")?.focus();
  });
  guide.hidden = false;
}
