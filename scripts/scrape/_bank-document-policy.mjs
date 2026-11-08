// Shared offline structural policy; no network or parser execution.
export const SAFE_DOCUMENTS = {
  'enbd-kfs': { bank: 'emirates-nbd', role: 'consolidated-kfs', url: 'https://cdn.emiratesnbd.com/enbd/files/pdf/kfs_credit_cards_horizontal_em_new.pdf' },
  'enbd-fees': { bank: 'emirates-nbd', role: 'shared-fees-and-vat', url: 'https://www.emiratesnbd.com/-/media/enbd/files/credit-cards/emiratesnbd_credit_card_fees_charges.pdf' },
  'adib-kfs': { bank: 'adib', role: 'consolidated-kfs', url: 'https://www.adib.ae/-/media/project/adib/adibsite/docs/kfs/cards/adib-covered-cards-kfs.pdf' },
  'adib-fees': { bank: 'adib', role: 'shared-fees-and-vat', url: 'https://www.adib.ae/-/media/Project/ADIB/ADIBSite/docs/Personal/cards/ADIB-Covered-Cards-Schedule-of-Charges-and-Fees.pdf' },
  'hsbc-kfs': { bank: 'hsbc', role: 'named-product-kfs', url: 'https://www.hsbc.ae/content/dam/hsbc/ae/docs/en/cards/kfs-credit-cards.pdf' },
};
export function validateDocumentRegistry(registry) {
  const errors = [];
  if (registry.version !== 1 || registry.mode !== 'manual-primary-documents' || registry.owner !== 'business-realestate-editor'
    || registry.paidConfigChangesEnabled !== false || registry.paidMonitorChangesEnabled !== false)
    errors.push('Registry must retain the explicit manual-only/no-paid-change contract');
  if (!Array.isArray(registry.documents) || !Array.isArray(registry.cards)) return [...errors, 'Document and card arrays required'];
  if (new Set(registry.documents.map(row => row.id)).size !== registry.documents.length
    || new Set(registry.documents.map(row => row.url)).size !== registry.documents.length) errors.push('Document IDs and URLs must be deduplicated');
  if (new Set(registry.cards.map(row => row.slug)).size !== registry.cards.length) errors.push('Duplicate card document route');
  for (const document of registry.documents) {
    const known = SAFE_DOCUMENTS[document.id];
    if (!known || document.url !== known.url || document.bank !== known.bank || document.role !== known.role) errors.push(`Unrecognised exact document identity or role: ${document.id}`);
  }
  for (const route of registry.cards) {
    if (!Array.isArray(route.documentIds) || !route.documentIds.length || new Set(route.documentIds).size !== route.documentIds.length) { errors.push(`Invalid document ID set: ${route.slug}`); continue; }
    for (const id of route.documentIds) if (!registry.documents.some(doc => doc.id === id && doc.bank === route.bank)) errors.push(`Wrong-bank/missing document ${route.slug}/${id}`);
    const expected = route.bank === 'emirates-nbd' ? ['enbd-kfs', 'enbd-fees'] : route.bank === 'adib' ? ['adib-kfs', 'adib-fees'] : route.bank === 'hsbc' ? ['hsbc-kfs'] : [];
    if (expected.length !== route.documentIds.length || expected.some(id => !route.documentIds.includes(id))) errors.push(`Both named KFS and fee/VAT sources required: ${route.slug}`);
    if (!['named-columns-review-only', 'source-only-manual-hold'].includes(route.numericPolicy)
      || (route.numericPolicy === 'source-only-manual-hold' && !route.hold)) errors.push(`Missing numeric scope/hold: ${route.slug}`);
  }
  return errors;
}
