# Private Cloudflare report

This is an on-demand read of existing Cloudflare data, not tracking setup.
The public repository must not contain the token or plaintext report. The
secret stays in GitHub Actions as CLOUDFLARE_ANALYTICS_TOKEN; do not try to
retrieve its value. The owner-supplied token summary showed Account Analytics
Read and Pages Read, expiring 2027-02-01. Live permissions remain to be tested.

## Run safely

1. Use a private temporary directory outside every Git checkout. Generate a
   fresh RSA key pair locally, keeping the private PEM mode 0600. Encode the
   public key as SPKI DER/base64. Never upload the private key.
2. Dispatch `.github/workflows/cloudflare-report.yml` on main with only that
   public value in `recipient_public_key`. Non-main jobs must skip without
   making a Cloudflare call. There is no schedule, PR or push collection.
3. Wait for the job to finish. Download the exact encrypted artefact into
   the same private temporary directory. Never print API responses or errors
   into the public job log or job summary. Artefacts expire after one day.
4. Decrypt locally:
   `node scripts/cloudflare/decrypt-analytics.mjs PRIVATE_KEY_PEM ENCRYPTED_JSON NEW_PRIVATE_JSON`
   The output must be outside the repository. Existing paths are not replaced.
   Keep the private key and report local; do not upload them to Drive or GitHub.
5. Inspect only the selected report and convey the relevant result to Mostafa.
   State exact reporting dates, source dataset, available metrics, sampling
   and limitations. Empty or inaccessible data is not proof of zero visitors.

The collector is restricted to api.cloudflare.com and read-only operations.
Validate the recipient key before any fetch and fail closed on encryption
failure. Pages list responses can contain settings: never log or persist
the raw response. Only exact dubaipoints.ae identity and allowlisted deployment
metadata may enter the report. GraphQL schema metadata may be included in
the encrypted report to establish a supported query without guessing fields.

If the Pages request fails, global GraphQL schema inspection may still run:
it reads type metadata only, not account, zone or website statistics. The
report keeps identity unverified and the overall result unavailable. Errors
retain only a validated HTTP status, bounded numeric Cloudflare error codes
and a fixed transport category, inside the encrypted report. Raw provider
messages, response bodies, exceptions and token values are never retained.

Do not claim a working analytics connection from secret existence, schema
introspection alone or mocked tests. No browser-beacon enablement follows
from an API read. Do not call visits or IP/device-based counts unique people.
The private API token is not PUBLIC_CF_BEACON_TOKEN and must never be used
as a public browser value. Do not request extra access automatically.
