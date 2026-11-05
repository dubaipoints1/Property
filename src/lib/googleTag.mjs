/** Use the owner's standard tag on the real Cloudflare main deployment only.
 * Cloudflare supplies these variables; no new credential or setting is needed.
 * @param {{production?:boolean, pages?:unknown, branch?:unknown}} input
 */
export function shouldLoadGoogleTag({ production, pages, branch }) {
  return production === true && pages === "1" && branch === "main";
}
