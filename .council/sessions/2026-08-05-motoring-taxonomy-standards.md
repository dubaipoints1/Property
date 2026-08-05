---
session: 2026-08-05-motoring-taxonomy
role: standards-editor
stage: 6.5
subject: "PR #309 — src/content/guides/expat-starter-car-costs.mdx"
standards-status: pass-with-edits
date: 2026-08-05
---

# Standards Editor — voice and advertorial review, PR #309

## Verdict

**pass-with-edits.**

The Modcare section **does not cross the advertorial line**, but it
touches it in three places, and all three are removable without losing a
single point of reader value. Struck, the piece is unambiguously
editorial. Left in, a reasonable reader could conclude the publication
was doing a shop a favour — which is the only test that matters, because
§5 bans the *shape* of lead generation regardless of intent.

Where the line sits, stated plainly for the record:

> A named business is editorial when the publication is using it to
> teach the reader how to judge the category, and the business is
> interchangeable with any other that documents its work as well. It is
> advertorial when the copy transmits the business's own positioning,
> lists its services, or hands the reader a route to transact.

The guide is on the right side of the first sentence. The contact block,
the services catalogue and one endorsement clause are on the wrong side
of the second.

---

## 1. The disclosure block

**Wording: pass.** It is declarative, third-person, unhedged, and covers
the four things that matter — ownership, payment, testing, and that this
is not a review. It reads in house voice. No change requested to the
prose.

**Placement: fail as shipped.** It sits *after* the named example. A
disclosure that follows the thing it discloses is a footnote; a
disclosure that precedes it is a disclosure. §5's "above the fold"
instinct is about the reader knowing the terms *before* they read the
recommendation, and that logic survives the absence of an affiliate
relationship. Mid-article placement is correct here — the guide as a
whole carries no commercial relationship, so a top-of-page disclosure
would imply one exists — but it must move to sit **immediately before**
the `### A worked example: Modcare, Al Quoz` heading, not after the
section.

**Chrome: flag to Head of UX.** The block renders in
`.dp-callout-tip`, the same green treatment used two sections earlier
for "Salik top-ups usually earn too". A disclosure dressed as a helpful
tip reads as a feature box, which is the opposite of what it is for. The
publication has no disclosure idiom in `global.css` today; it now needs
one. Not my decision to make — routed to Head of UX, with the
observation that reusing the tip class is a voice problem, not only a
visual one.

**Suggested heading change.** `**No commercial relationship.**` is
accurate but soft. Replace with:

```
**Disclosure.** DubaiPoints has no ownership stake, affiliate
arrangement or commercial relationship with Modcare, and was not paid
for this mention. They are named as a worked example because their
published material sets out coverage tiers clearly enough to explain the
category. Every claim above is drawn from their own website, read on
5 August 2026 — we have not independently tested their work, and this is
not a review.
```

("Above" becomes "below" if the block moves ahead of the section, as
recommended. Use "below".)

---

## 2. Link density — six outbound links to one business

Two of the six are editorially justified and must stay: `modcare.ae`
and the PPF page are the **sources** for every claim in the section, and
§10 requires a source URL for anything asserted.

The other four are not sources. Phone, WhatsApp, email and Instagram
carry no evidentiary function whatever; their only purpose is to let a
reader transact. That is a business listing, and it is the exact shape
the brief warned about. The volume is a symptom — the problem is the
*kind* of link, not the count.

**Recommended edit — delete the contact sentence entirely.** Replace:

```
They quote per vehicle rather than publishing prices, so budget by
requesting a quote for a specific coverage tier rather than assuming a
figure. Contact: [+971 52 1279834](tel:+971521279834),
[WhatsApp](https://wa.me/971521279834),
[Hello@modcare.ae](mailto:Hello@modcare.ae), or
[Instagram](https://www.instagram.com/modcare_/).
```

with:

```
Modcare quotes per vehicle rather than publishing prices, which is
normal for the trade and worth planning around: budget from a written
quote for a named coverage tier, not from a figure you assumed.
```

That keeps the only transferable lesson in the sentence and removes the
lead-generation surface. Net: six links to two, both of them citations.

Note for the Fact-Checker, not for me to rule on: the brief set the bar
for any named business at "published price, warranty terms, a source URL,
and a verification date". Modcare publishes no price. The piece is
honest about that, but the council should decide whether the bar bends
or whether the standing rule becomes "name a business only where it
documents what we require".

---

## 3. Removability test

**Substantially passes, with one repair.**

Strike the entire `### A worked example` subsection and the reader still
learns: coverage is sold in tiers and the tier matters more than the
brand; cutting method is the single biggest determinant of finish; ask
which method the installer uses; installation quality beats film brand;
judge on edge work; get a written quote per tier. All of that survives
in the tier list, the closing checklist item 4, and the generalising
clause inside each bullet. That is a genuine pass, and the draft was
clearly built for it.

Two failures of the test in detail:

**(a) The third bullet is not about Modcare at all.** "Finishes change
the car, not just protect it" contains no attributed claim and no
generalisation — it is category copy filed under a heading that says
"how they describe their own work". It inflates the apparent size of the
Modcare section for no return. Move it up into the coverage-tier list in
the parent section, where it belongs.

**(b) The second bullet's lesson is welded to an endorsement.** See §4.

---

## 4. House voice — line list

| Line | Issue | Ruling |
|---|---|---|
| 130 | "They make the same point we would." | **Kill-list 4** (first-person plural in product chrome) *and* the single most advertorial clause in the piece. It puts the publication's authority behind a vendor's marketing position. Replace with a third-person statement the site owns outright: *"That is the right answer, and an installer who leads with the film brand instead is selling you the label."* |
| 111–113 | "offering the coverage tiers above along with detailing and ceramic coating, window tinting, vinyl wrapping and styling" | A services catalogue. None of it is PPF and none of it teaches the reader anything. **Cut** back to: *"[Modcare](https://modcare.ae/) is a paint-protection installer in Al Quoz Industrial Area 2."* |
| 114–115 | "sets out the packages in detail" | "In detail" is a compliment, not a description. Replace with: *"Their [paint protection film page](https://modcare.ae/paint-protection-film/) lists the packages."* |
| 85–86 | "so routing it through the card with the best everyday return is free money you are otherwise leaving behind" | **Kill-list 2 and 3** — "free money" and "leaving money on the table" are American points-blog register, not house register. Replace with: *"so routing it through your best base-rate card costs nothing and earns at your standard rate."* |
| 117–118 | "What is worth understanding from how they describe their own work, because it generalises to any installer you evaluate" | Borderline **kill-list 6** (signposting), and it frames the section as a transmission of the company's positioning. Replace with: *"Three things in their published material generalise to any installer you evaluate."* |
| 105 | "fenders" | American, and sits in the same bullet as "wing mirrors" and "bonnet". Use *"wings"* or drop it. |
| 66 | "Two cautions before you apply for the top of that table" | Fine. Number-word rule observed, no imperative bullying. No change. |
| 155–168 | "What to actually do" checklist | Imperatives here are instructions to a reader mid-task, not CTAs. **Kill-list 9 does not apply.** No change. |

**AED formatting: clean.** AED 313.95, AED 103.95, AED 210, AED 5,000 —
all `AED <space> <number>`. No violations.

**Punctuation: clean.** No exclamation marks. No hyperbole in the fuel
section. The Emirates NBD Duo paragraph ("a good card for a heavy
spender and a poor one for a light one") is exactly the HfP-dry register
the house wants and should be pointed at as a model.

**Attribution verbs: good.** "argues this avoids", "Modcare's answer
is", "from how they describe" — the draft consistently marks vendor
claims as vendor claims rather than asserting them. That discipline is
why this piece is pass-with-edits rather than fail.

---

## 5. Standing rule proposed to the Chairman

If a named commercial example is permitted as a form, it should be
fenced now rather than after the third one:

1. Named only where the publication is teaching the reader to judge the
   category, never where it is teaching them to choose the business.
2. Every claim attributed to the business as the business's own.
3. Links limited to **sources**. No phone, WhatsApp, email, social, or
   booking link in editorial copy — ever.
4. No services catalogue. The business appears only in the capacity the
   piece is about.
5. Disclosure precedes the naming, in a disclosure treatment, not a tip
   box.
6. The removability test is applied and recorded at Stage 6.5: strike
   the example, and the section must still teach.

Standards would own 1, 3, 4, 5 and 6 at the gate.

---

## Hand-off

To Chairman for the publish gate, with `standards-status:
pass-with-edits` and the seven edits above as conditions. To Head of UX:
the site needs a disclosure treatment distinct from
`.dp-callout-tip`. To Fact-Checker: the "published price" question in
§2, which is not mine to rule.

— Standards Editor, 5 August 2026.
