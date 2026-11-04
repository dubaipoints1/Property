import type { SalaryTransferOffer } from "../lib/salaryTransfer";
import type { SalaryTransferTimeline as Timeline } from "../lib/salaryTransferTimeline";
import "./salaryTransferTimeline.css";

interface Props {
  offer: Pick<SalaryTransferOffer, "bankSlug" | "bankName" | "sourceUrl" | "validUntil">;
  timeline?: Timeline;
  heading?: "h2" | "h3";
  showHistory?: boolean;
}

const titles = ["Open or enrol", "Meet the conditions", "When it pays", "Keep the reward"] as const;
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
});

export default function SalaryTransferTimeline({ offer, timeline, heading: Heading = "h3", showHistory = true }: Props) {
  return (
    <div class="dp-payday-timeline" data-payday-timeline>
      <Heading>Payday to payout</Heading>
      {timeline ? (
        <>
          {timeline.endDate === "published" && (
            <p class="dp-payday-window">Bank’s campaign end: <time dateTime={offer.validUntil.slice(0, 10)}>{dateFormat.format(new Date(offer.validUntil))}</time>. The payout has its own timetable.</p>
          )}
          <ol class="dp-payday-steps" role="list">
            {timeline.steps.map((step, index) => (
              <li key={titles[index]}>
                <span class="dp-payday-step-number" aria-hidden="true">{index + 1}</span>
                <div>
                  <strong>{titles[index]}</strong>
                  <p>{step}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p class="dp-payday-window">Step-by-step dates aren’t verified for this campaign. Ask the bank when your first qualifying employer salary must arrive, what else you need to do, when it pays and what could reverse the reward.</p>
      )}
      <p class="dp-payday-links">
        <a href={offer.sourceUrl} aria-label={`Read bank terms for ${offer.bankName}`}>Read bank terms</a>
        {showHistory && <a href={`/salary-transfer/history/${offer.bankSlug}/`} aria-label={`View offer history for ${offer.bankName}`}>View offer history</a>}
      </p>
    </div>
  );
}
