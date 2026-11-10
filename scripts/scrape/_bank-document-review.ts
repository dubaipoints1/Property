// Offline review only. No network, canonical writes, generic normaliser or date promotion.
import { createHash } from 'node:crypto';
import { parseEnbdKfsFees } from './_enbd-refresh.ts';
import { ADIB_PRODUCTS, parseAdibKfs, parseAdibSchedule, type AdibSource } from './_adib-primary.ts';
import { parseHsbcCardKfs } from './_bank-parsers.ts';
import { SAFE_DOCUMENTS, validateDocumentRegistry } from './_bank-document-policy.mjs';
export { validateDocumentRegistry } from './_bank-document-policy.mjs';

export interface DocumentRoute {
  id: string;
  bank: string;
  role: string;
  url: string;
}
export interface CardDocumentRoute {
  slug: string;
  bank: string;
  documentIds: string[];
  numericPolicy: 'named-columns-review-only' | 'source-only-manual-hold';
  hold?: string;
}
export interface DocumentRegistry {
  version: number;
  mode: string;
  owner: string;
  paidConfigChangesEnabled: boolean;
  paidMonitorChangesEnabled: boolean;
  documents: DocumentRoute[];
  cards: CardDocumentRoute[];
}
/** Raw public-reader record plus its retained body/text bytes. Not Firecrawl markdown. */
export interface RawDocumentCapture {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  type: string;
  fetchedAt: string;
  complete: boolean;
  transportComplete: boolean;
  extractionComplete: boolean;
  contentUsability: string;
  incompleteReasons: string[];
  body: Uint8Array;
  bodySha256: string;
  text: string;
  textSha256: string;
  extraction: 'pdftotext-layout';
}
const sha = (input: string | Uint8Array) => createHash('sha256').update(input).digest('hex');
export function validateRawDocument(document: DocumentRoute, capture: RawDocumentCapture): string[] {
  const errors: string[] = [];
  const known = SAFE_DOCUMENTS[document.id];
  if (!known || document.url !== known.url || document.bank !== known.bank || document.role !== known.role
    || capture.requestedUrl !== document.url || capture.finalUrl !== document.url) errors.push('Exact requested/final issuer document identity requires review');
  if (capture.status !== 200 || !capture.type?.toLowerCase().startsWith('application/pdf')
    || capture.extraction !== 'pdftotext-layout') errors.push('Complete PDF and pdftotext-layout representation required');
  if (!capture.complete || !capture.transportComplete || !capture.extractionComplete
    || capture.contentUsability !== 'readable-output' || !Array.isArray(capture.incompleteReasons) || capture.incompleteReasons.length)
    errors.push('Incomplete, partial, shell or failed capture cannot support document review');
  if (!capture.fetchedAt || Number.isNaN(Date.parse(capture.fetchedAt))) errors.push('Actual capture timestamp required');
  if (!(capture.body instanceof Uint8Array) || capture.body.length < 5
    || Buffer.from(capture.body).subarray(0, 5).toString('ascii') !== '%PDF-'
    || sha(capture.body) !== capture.bodySha256) errors.push('Retained PDF-body identity mismatch');
  if (typeof capture.text !== 'string' || !capture.text.trim() || sha(capture.text) !== capture.textSha256) errors.push('Full extracted-text identity mismatch');
  return errors;
}

/** One immutable observation per URL, then per-card references; never 31 copies/fetches. */
export function reviewBankDocumentSources(registry: DocumentRegistry, captures: RawDocumentCapture[]) {
  const registryErrors = validateDocumentRegistry(registry);
  if (registryErrors.length) throw new Error(registryErrors.join('; '));
  const documents = registry.documents.map(document => {
    const matches = captures.filter(capture => capture.requestedUrl === document.url);
    const errors = matches.length !== 1 ? [`Expected one retained capture, found ${matches.length}`] : validateRawDocument(document, matches[0]);
    return { ...document, capture: errors.length ? null : matches[0], errors };
  });
  const source = (id: string): AdibSource | null => {
    const document = documents.find(row => row.id === id), capture = document?.capture;
    return capture ? { id, url: document!.url, capturedAt: capture.fetchedAt, text: capture.text,
      sourceTextSha256: capture.textSha256, sourceBodySha256: capture.bodySha256,
      fixtureTextSha256: capture.textSha256, representation: 'pdftotext-layout', firstLine: 1, firstByte: 0 } : null;
  };
  // A document is parsed once. A different/ambiguous header fails closed in existing parsers.
  const enbd = source('enbd-kfs'), adibKfs = source('adib-kfs'), adibFees = source('adib-fees');
  const enbdParsed = enbd ? parseEnbdKfsFees(enbd.text) : null;
  const adibKfsParsed = adibKfs ? parseAdibKfs(adibKfs) : null;
  const adibFeesParsed = adibFees ? parseAdibSchedule(adibFees) : null;
  const cards = registry.cards.map(route => {
    const related = route.documentIds.map(id => documents.find(doc => doc.id === id)!);
    const holds = related.flatMap(doc => doc.errors.map(error => `${doc.id}: ${error}`));
    const observations: unknown[] = [];
    if (route.numericPolicy === 'source-only-manual-hold') holds.push(route.hold!);
    else if (!holds.length && route.bank === 'emirates-nbd') {
      if (enbdParsed?.status !== 'parsed') holds.push(`KFS named-column parser hold: ${enbdParsed?.status === 'hold' ? enbdParsed.reason : 'no complete source'}`);
      else {
        const selected = enbdParsed.fees.filter(row => row.slug === route.slug);
        if (selected.length !== 2 || new Set(selected.map(row => row.field)).size !== 2) holds.push('No unambiguous joining and renewal column for this exact card');
        else observations.push(...selected.map(row => ({ ...row, sourceUrl: enbd!.url,
          capturedAt: enbd!.capturedAt, sourceTextSha256: enbd!.sourceTextSha256,
          sourceBodySha256: enbd!.sourceBodySha256, vatTreatment: 'pending-fee-guide-reconciliation' })));
      }
    } else if (!holds.length && route.bank === 'adib') {
      const mapping = ADIB_PRODUCTS[route.slug];
      if (route.slug !== 'adib-cashback-visa' || !mapping || !adibKfsParsed || !adibFeesParsed) holds.push('Named legacy Cashback KFS/SOC mapping absent or changed');
      else {
        const kfsCell = adibKfsParsed.feeCells[mapping.kfsIndex], socCell = adibFeesParsed.feeCells[mapping.socIndex];
        if (kfsCell.value === null) holds.push('KFS fee is a range/conditional cell; no scalar accepted');
        observations.push({ field: 'annualFee', sourceAmount: kfsCell.value, rawSocCell: socCell.raw,
          kfsEvidence: kfsCell.evidence, socEvidence: socCell.evidence,
          kfsVatEvidence: adibKfsParsed.vatEvidence, socVatEvidence: adibFeesParsed.vatEvidence,
          vatTreatment: 'exclusive-source-cell; canonical-inclusive-reconciliation-pending' });
      }
    } else if (!holds.length && route.bank === 'hsbc') {
      const hsbc = source('hsbc-kfs');
      // The retained HTTP body is a PDF; parser lines refer to the separate
      // pdftotext-layout text, never an HTML/decoded-response-body string.
      const selected = hsbc && route.slug === 'hsbc-live-plus' ? parseHsbcCardKfs({ ...hsbc,
        sourceRepresentation: 'pdftotext-layout', captureMethod: 'public-http-reader' }, route.slug) : [];
      if (!selected.length) holds.push('Named HSBC Live+ KFS section absent or changed');
      else observations.push(...selected);
    }
    return { slug: route.slug, bank: route.bank, owner: registry.owner, mode: registry.mode,
      documentIds: route.documentIds, numericPolicy: route.numericPolicy,
      state: holds.length ? 'hold' : 'review-candidates-only', holds, observations,
      automaticMergeAllowed: false, financialFieldAcceptance: 'pending', sourceDatePromotionAllowed: false };
  });
  return { mode: registry.mode, uniqueDocuments: documents.length,
    documents: documents.map(doc => ({ id: doc.id, url: doc.url, status: doc.errors.length ? 'hold' : 'capture-identity-checked',
      errors: doc.errors, capturedAt: doc.capture?.fetchedAt ?? null })), cards,
    automaticMergeAllowed: false, sourceDatePromotionAllowed: false };
}
