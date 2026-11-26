import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fixture from "./fixtures/2026-11-mashreq-alislami-elite.json";
import l2 from "../../src/data/cards.json";
import registry from "../../scripts/scrape/manual-primary.registry.json";
import { parseMashreqIslamicElite } from "../../scripts/scrape/_mashreq-alislami-elite.ts";
import { getActiveCards, getCardData } from "../../src/lib/cardsData.ts";
import { hasUsableSalaryMinimum } from "../../src/lib/cardEligibility.ts";
import { cardValueTerms } from "../../src/lib/cardValue.ts";
import { finderEvidence } from "../../src/lib/finderEvidence.ts";

const platinum = "mashreq-islamic-platinum-elite";
const solitaire = "mashreq-emirati-solitaire";
const pins = (slug: string) => fixture.sources.filter(s => s.id.startsWith(slug + "-") || s.id.startsWith("mai-elite-"));

test("the two exact Islamic variants replay different primary annual fees and remain partial profiles", () => {
  for (const [slug, annual] of [[platinum, 682.5], [solitaire, 0]] as const) {
    const replay = parseMashreqIslamicElite(pins(slug), slug);
    const data = getCardData(slug), raw = l2[slug];
    assert.ok(replay && data && getActiveCards().some(c => c.slug === slug));
    assert.equal(replay.annualFee, annual);
    assert.equal(replay.capturedDate, "2026-11-26");
    assert.equal(data.network, "Visa");
    assert.equal(data.sharia, true);
    assert.equal(data.standardFeeConditions, "standard-only");
    assert.deepEqual([data.name, data.annualFee, data.vatPolicy, data.sources],
      [replay.name, { amount: annual, currency: "AED" }, "inclusive", replay.sources]);
    assert.deepEqual(raw._fieldEvidence, replay.evidence);
    assert.deepEqual(registry.cards.find(x => x.slug === slug)?.sourceFixtureIds, replay.sourceFixtureIds);
    assert.equal(data.applyUrl, replay.productUrl);
    assert.ok(!data.applyUrl.includes("otp-send"));
    assert.equal(hasUsableSalaryMinimum(data), false);
    assert.deepEqual([finderEvidence(data).salaryPending, finderEvidence(data).rankRates], [true, {}]);
    assert.equal(cardValueTerms(data, slug).rate, null);
    assert.equal(cardValueTerms(data, slug).hasWelcomeOffer, false);
    assert.equal(data.fxFee, null);
    for (const field of ["joiningFee", "annualFeeWaiver", "welcomeBonus", "interestRate", "loyaltyProgram"])
      assert.ok(!Object.hasOwn(raw, field), field);
  }
  assert.equal(getCardData("dib-prime-classic"), undefined);
  assert.equal(parseMashreqIslamicElite(pins(platinum), solitaire), null);
  assert.equal(parseMashreqIslamicElite(pins(platinum), "mashreq-platinum-elite"), null);
  assert.equal(parseMashreqIslamicElite(pins(solitaire), "mashreq-solitaire"), null);
});

test("hold on mismatched product CTA, named column, VAT, recurrence, version or contradictory fees", () => {
  const alter = (id: string, oldText: string, newText: string, slug = platinum) => pins(slug).map(s => {
    if (s.id !== id) return s;
    assert.ok(s.text.includes(oldText), id);
    const text = s.text.replace(oldText, newText);
    return { ...s, text, fixtureTextSha256: createHash("sha256").update(text).digest("hex") };
  });
  for (const [id, from, to] of [
    [platinum + "-cta", "maiplatinumelite", "emisolitaire"],
    ["mai-elite-kfs-version", "September 2026", "February 2026"],
    ["mai-elite-kfs-fee", "MAI Platinum Elite", "Platinum Plus"],
    ["mai-elite-kfs-fee", "Annual fee (primary)", "Annual fee (supplementary)"],
    ["mai-elite-kfs-fee", "VAT inclusive", "VAT exclusive"],
    ["mai-elite-kfs-fee", "682.50", "0"],
    ["mai-elite-kfs-fee", "recurring", "introductory"],
    ["mai-elite-tariff-principal", "Mashreq Al Islami Platinum Card", "Platinum Elite Card"],
    ["mai-elite-tariff-principal", "D 682.5", "D 156.45"],
  ]) assert.equal(parseMashreqIslamicElite(alter(id, from, to), platinum), null, id + ": " + from);
  assert.equal(parseMashreqIslamicElite(alter("mai-elite-kfs-fee", "                              0", "                              N/A", solitaire), solitaire), null);
});
