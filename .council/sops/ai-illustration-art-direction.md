# SOP — art direction for AI illustration

Owner: Head of UX, with Standards Editor on the label and Chairman on
the permit/ban line. Governs every image generated under the
2026-07-29 Charter amendment.

**Scope — this document briefs GENERATION, not selection.** Everything
below, and §2's "muted, never saturated" palette rule in particular,
tells you how to write an AI prompt. It is **not** a filter for choosing
licensed stock. §1 describes the existing library so an AI render can be
briefed to sit beside it; it does not claim the library is uniformly
muted, and it is not. `guide-expat-starter-banking-basics` (neon-lit DIFC
towers at night) and `guide-expat-starter-avoid-mistakes` (emerald marina
water under hard blue sky) are both highly saturated and both correct.

Recorded because the misreading actually happened: on 5 August 2026 a
perfectly good Pexels photograph was flagged to the owner as an
off-register "deviation" on the strength of this rule, which never
applied to it. Judge a stock photograph on subject, composition,
place-plausibility and legibility at 300px — the §3 composition rules
travel; the palette rule does not.

This exists because the first real generation took **four dispatches**
to produce one usable image, and three of those were avoidable. The
failures were not bad luck:

| Attempt | What came back | Root cause |
|---|---|---|
| 1 | Two equal piles joined by an `=` sign | Brief described the concept, not the composition |
| 2 | Correct sizes, whole frame soft and mushy | Wrong model; prompt fought it instead of switching |
| 3 | Correct sizes, still soft | Re-worded a model problem for the second time |
| 4 | Sharp macro still-life — shipped | Changed model, matched the house register |

Every one of those is a planning failure, not a generation failure.
Credits are finite (fal.ai is metered per render); the fix is to spend
thinking before spending credits.

---

## 1. The house register

Before writing a prompt, look at `public/images/stock/`. The library
is **photographic**, and it runs in two modes:

**Mode A — macro still-life.** Used on guides, banks, cards. Tight
crop on one object, extreme shallow depth of field, background
dissolved to soft shapes, natural side light, muted and slightly
desaturated. Example: `guide-uae-transfer-ratios-2026` (the
calculator-on-desk photograph), `guide-salary-transfer-mechanics-2026`.

**Mode B — wide environmental.** Used on news and travel. High-key,
airy, subject sitting on a strong horizontal band in the lower third,
generous empty sky or wall above, desaturated natural light. Example:
`news-etihad-fare-sale-book-by-31-july-2026`.

**Neither mode is flat vector art.** Flat illustration on a coloured
background reads as clip-art beside these photographs and drops the
perceived production value of the whole page. It was tried and
rejected on 29 July 2026. If a concept genuinely cannot be shot as an
object or a scene, that is a signal the image may not be worth making.

## 2. Plan the shot before you spend a credit

Write the brief out in full and check it against §3 and §4 **before**
dispatching. A brief that cannot be written down clearly will not
survive a render.

Every brief names all six:

1. **Subject** — the one thing in frame. One hero object, not three.
2. **Composition** — where it sits, what it does with the space, what
   the eye hits first. This is the field that was missing in attempt 1
   and it is the field that most often fails.
3. **Camera** — macro / wide, focal feel, depth of field.
4. **Light** — direction, hardness, time of day.
5. **Palette** — from the house tokens: warm paper, navy `#1f3a4d`,
   gold `#b8842a`. Muted, never saturated.
6. **Exclusions** — no text, no numbers, no logos, no people, plus
   anything the §4 ban list makes relevant.

## 3. Composition rules

Derived from what the library already does. A render that breaks these
is rejected regardless of how well it renders.

- **One subject.** Two objects only when the comparison *is* the
  story, and then the difference between them must be structural, not
  described. "One larger than the other" produced two equal piles;
  "a tall stack beside a stack one quarter its height" produced the
  shot.
- **Negative space is mandatory.** Roughly a third of the frame stays
  empty. Headlines and kickers sit over these images.
- **Subject off-centre.** Dead-centre symmetry reads as a diagram.
- **Foreground/background separation.** Shallow depth of field in mode
  A, aerial recession in mode B. A subject pasted on a flat colour
  field is the clip-art failure.
- **Legible at 300px.** Listing grids render these small. Squint at
  the result: if the subject dissolves, it fails — the same rule the
  Pexels seeds are held to.
- **No symbols invented by the model.** Arrows, equals signs and
  glyphs are editorial claims. Exclude them explicitly; they carry
  meaning nobody briefed.
- **Right subject is not enough — the place has to work too.** The
  2026-07-29 relevance audit rejected two *correctly-matched* stock
  images purely on geography: a thatched-hut tropical resort for a UAE
  beach-club perk, and a couple in padded winter coats under a grey sky
  for a grocery card. Snow, bare deciduous trees, overcast European
  light and cold-weather clothing all break a Dubai-first publication.
  Brief for Gulf-plausible or place-neutral, and check the background,
  the sky and what people are wearing — not just the subject.

## 4. The permit/ban line is not negotiable

Per the Charter amendment, AI may illustrate and may never document.
The generator's subject guard (`bannedSubjects()` in
`scripts/images/generate-ai.ts`) refuses the obvious cases, but it is
a tripwire, not an editor. Before dispatch, ask plainly: **could a
reader mistake this frame for a record of a real thing?** If yes, it
is a §10 kill whether or not the regex fired.

Generic unbranded objects — coins, tokens, paper, luggage, seating —
are illustration. A named carrier's cabin, a real card face, a
property, a document, a person is not.

## 5. Model choice

**Default to `fal-ai/recraft-v3`.** It defaults to a realistic-image
style and produces the house register.

`fal-ai/flux/dev` returned soft, out-of-focus output across three
consecutive prompts that explicitly demanded "crisp, sharp, fully in
focus, no blur, no depth of field". Prompt wording did not fix it and
will not fix it. **If two dispatches fail the same way, the problem is
the model, not the words** — switch rather than re-roll.

## 6. Credit discipline

- Plan on paper. Dispatch once.
- Two failed dispatches on one slot → stop, re-brief from §2, and
  change one structural variable (model or composition), not the
  adjectives.
- Never re-roll hoping for a better seed. A re-roll with the same
  brief is a coin flip you paid for.
- `FAL_KEY=skip npm run gen:ai -- …` dry-runs the subject guard and
  the manifest write for free. Use it to check a prompt passes §4
  before spending anything.
- fal.ai bills per render; the workflow runs one image per dispatch by
  design so a mistake costs one credit, not four.

## 7. Review before merge

The generated file lands on a branch, never on `main`. Check:

- [ ] Composition passes §3 — subject, space, separation, 300px test.
- [ ] Meaning matches the article. An illustration that contradicts
      the piece is worse than no illustration. (Attempt 1 put an
      equals sign on a guide about *unequal* ratios.)
- [ ] Nothing in frame reads as a record of a real thing (§4).
- [ ] House palette; muted, not saturated.
- [ ] No stray glyphs, text, or model-invented symbols.
- [ ] The rendered page shows the "not a photograph" label.
- [ ] File weight is in budget — the script resizes to 1600px and
      re-encodes, targeting the ~250KB library average.

## 8. Prompt skeleton

```
<Mode A or B register>, <subject>, <composition and placement>,
<camera and depth of field>, <light>, warm off-white background,
deep navy and muted gold only, muted and desaturated,
generous negative space, no text, no numbers, no symbols, no logos,
no people.
```

Worked example — the shipped transfer-ratios image:

> Minimal flat vector editorial illustration. On the left a tall neat
> stack of about twelve gold discs. On the right a short neat stack of
> only three navy discs, about one quarter the height of the gold
> stack. The strong height contrast between the two stacks is the
> subject. Warm off-white background, deep navy and muted gold only,
> generous negative space, precise clean geometry, no text, no
> numbers, no people.

Note what actually did the work: **"about one quarter the height"** —
a structural ratio, not an adjective. Note also that recraft-v3
overrode the "flat vector" opening and delivered a photograph, which
is why §5 says the model, not the wording, sets the register.

## 9. Standing weakness

Coin stacks, calculators and desks are the financial-stock cliché the
whole library already leans on. AI earns its place when it produces a
composition stock **cannot** — the specific mechanic of one story
rather than a generic money signifier. A render that a Pexels search
would have matched is parity, not an upgrade. Brief for the former.
