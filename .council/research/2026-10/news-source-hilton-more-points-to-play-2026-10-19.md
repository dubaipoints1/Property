# Source archive — Hilton Honors "More Points to Play", 15 Oct – 31 Dec 2026 (read 19 Oct 2026)

Channels, in the order tried:

1. `fetch-sources.yml` run 39272927306 (free reader). Hilton's promotion page returned **403** ("Something went wrong"). The eligible-properties page returned 200, but the reader's 20,000-character cap cut the list off partway through "H". Hilton's en-gb registration-confirmation page (200), LoyaltyLobby's country-sorted PDF of the 3,000-point list (200) and One Mile at a Time (200, body not extracted, links only) were also read. LoyaltyLobby's article returned 403.
2. `fetch-sources.yml` run 39273116842 (free reader). Hilton's FAQ page (en and en-gb) and the en-gb promotion page all returned **403**.
3. Firecrawl `firecrawl_scrape`, markdown only, 3 credits: Hilton promotion page (terms), Hilton FAQ page (question headings and terms only; the FAQ answers are collapsed and did not render), Hilton eligible-properties page (full list). Plus one `firecrawl_search` (2 credits) to find the URLs. Total 5 credits.

**UAE count.** Hilton's official list gives property names only, with no country. We matched UAE place names (Dubai, Abu Dhabi, Ras Al Khaimah, Marjan Island) against the full list as Firecrawl returned it and found **16** properties: Dubai 9, Abu Dhabi 4, Ras Al Khaimah 3. LoyaltyLobby's PDF, which sorts the same list by country, carries the same 16 names under "United Arab Emirates". Every other UAE Hilton earns the 1,000-point tier under the terms ("any hotel or resort within the Hilton Portfolio").

Not found in Hilton's readable text: any booking-channel rule, any minimum length of stay, any list of excluded rates (the FAQ question "Are all rates included in this promotion?" exists but its answer did not render; LoyaltyLobby reproduces the answer as "No." with no list), and the answer on Reward Stays.

## Hilton promotion page — Terms & Conditions (Firecrawl, 19 Oct 2026, status 200)

```
URL: https://www.hilton.com/en/offers/promotions/more-points-to-play/

## More Points to Play Promotion

Enjoy up to 3,000 Bonus Points on every stay

Register now and earn 3,000 Bonus Points each time you stay at one of Hilton's 1,000+ luxury, lifestyle, resort, or all-inclusive hotels. Plus, earn 1,000 Bonus Points on every other stay in the Hilton portfolio. Register and stay between October 15 and December 31 to earn.

New to Hilton Honors?

Sign up for this promotion here, and you'll automatically become a Member.

## Terms & Conditions

Offer valid for stays completed October 15 – December 31, 2026 ("promotion period") at any hotel or resort within the Hilton Portfolio. Hilton Honors™ members must first register at HiltonHonors.com/MorePointstoPlay prior to completing a stay within the promotion period.

Registered Hilton Honors members will earn 3,000 Bonus Points on Luxury, Lifestyle, and Resort stays, and 1,000 Bonus Points on stays at any other property. A full list of eligible Luxury, Lifestyle, and Resort properties can be found here (https://www.hilton.com/en/p/honors-promotions/more-points-play/eligible-properties/).

Registered Hilton Honors members checking in before October 15, 2026, will receive Bonus Points for their stay if the stay is completed on or after October 15, 2026, and prior to or on December 31, 2026.

There is no limit to the total number of Bonus Points that may be earned during the promotion period with this offer. However, there are restrictions on the number of Base Points that can be earned on a single stay at certain brands.

For examples and further details, please see the FAQ page.

This offer may be altered or terminated without notice. Bonus Points do not count toward elite tier qualification. Please allow six to eight weeks from completion of your stay for Bonus Points to appear in your account. A 'stay' is defined as the total number of consecutive nights spent at the same hotel, whether or not a guest checks out and checks back in again. Offer is not valid for groups and cannot be combined with other select offers. In-Room Internet Access, Fitness Center/Health Club Access and Bottled Water benefits may not be complimentary at properties with a resort charge. Space-available upgrades only available at select brands. Elite status benefits are subject to availability and vary by brand. For more information, please visit HiltonHonors.com.

Hilton Honors™ membership, including the earning and redemption of Points, is subject to Hilton Honors Terms and Conditions.
```

## Hilton FAQ page (Firecrawl, 19 Oct 2026, status 200; answers collapsed)

```
URL: https://www.hilton.com/en/offers/promotions/more-points-to-play/faq/

## Hilton Honors "More Points to Play" Promotion – Frequently Asked Questions
### What is the name of the promotion?
### What is the promotion?
### What is the promotion period for the "More Points to Play" Hilton Honors promotion?
### How will the Bonus Points be awarded?
### What is an eligible stay?
### Are all rates included in this promotion?
### Do I have to register for this promotion?
### I am not a Hilton Honors member; can I participate in this promotion?
### Which Hilton Honors brands are participating in the promotion?
### If I already have a reservation, is it eligible for the promotion?
### If I check-in before October 15, 2026, or check-out after December 31, 2026, do I still earn credit for that stay?
### Will I receive Bonus Points with the "More Points to Play" promotion for any stays within the promotion period that I completed PRIOR to registering for the promotion?
### When will the Bonus Points post to my Hilton Honors account?
### Will I earn Bonus Points for Reward Stays with the "More Points to Play" promotion?
### Can I register for other promotions if I register for this promotion?
### Whom may I contact if I have more questions?
[Terms & Conditions identical to the promotion page above]
```

## Hilton eligible-properties page — UAE rows (Firecrawl, 19 Oct 2026, status 200)

URL: https://www.hilton.com/en/p/honors-promotions/more-points-play/eligible-properties/

Page text: "Hilton Honors members who are registered to the 2026 More Points to Play Promotion will earn 3,000 Bonus Points when staying at any of the following properties during the promotion period."

Rows matched by UAE place name (line number in the extracted list of ~1,580 rows; other "Palm" matches are Palm Springs, Palm Beach, Palm Cove and Palm Desert and are excluded):

```
12:Al Seef Heritage Hotel Dubai, Curio Collection by Hilton
150:Canopy by Hilton Dubai Al Seef
235:Conrad Abu Dhabi Etihad Towers
251:Conrad Dubai
332:DoubleTree by Hilton Dubai - Jumeirah Beach
351:DoubleTree by Hilton Resort & Spa Marjan Island
504:Hampton by Hilton Marjan Island
546:Hilton Dubai Jumeirah
547:Hilton Dubai Palm Jumeirah
548:Hilton Dubai The Walk
1094:Royal Rose Hotel Abu Dhabi, Curio Collection by Hilton
1328:The Mangroves Abu Dhabi, LXR Hotels & Resorts
1418:The WB Abu Dhabi hotel, Curio Collection by Hilton
1496:Waldorf Astoria Dubai International Financial Centre
1497:Waldorf Astoria Dubai Palm Jumeirah
1517:Waldorf Astoria Ras Al Khaimah
```

## Hilton registration-confirmation page (fetch-sources, status 200)

```
URL: https://www.hilton.com/en-gb/p/honors-promotions/more-points-play/confirm-new/

Now that you're registered, get free nights faster and earn 3,000 Bonus Points when you stay at any of our luxury, lifestyle, resort, or all-inclusive hotels. You'll also earn 1,000 Bonus Points on every other stay.
```

## LoyaltyLobby PDF — "United Arab Emirates" section (fetch-sources, status 200)

```
URL: https://loyaltylobby.com/wp-content/uploads/2026/09/Hilton-Honors-Luxury-Lifestyle-Hotels.pdf

United Arab Emirates
 ●   Al Seef Heritage Hotel Dubai, Curio Collection by Hilton
 ●   Canopy by Hilton Dubai Al Seef
 ●   Conrad Abu Dhabi Etihad Towers
 ●   Conrad Dubai
 ●   DoubleTree by Hilton Dubai - Jumeirah Beach
 ●   DoubleTree by Hilton Resort & Spa Marjan Island
 ●   Hampton by Hilton Marjan Island
 ●   Hilton Dubai Jumeirah
 ●   Hilton Dubai Palm Jumeirah
 ●   Hilton Dubai The Walk
 ●   Royal Rose Hotel Abu Dhabi, Curio Collection by Hilton
 ●   The Mangroves Abu Dhabi, LXR Hotels & Resorts
 ●   The WB Abu Dhabi hotel, Curio Collection by Hilton
 ●   Waldorf Astoria Dubai International Financial Centre
 ●   Waldorf Astoria Dubai Palm Jumeirah
 ●   Waldorf Astoria Ras Al Khaimah
```

## LoyaltyLobby article (Firecrawl search excerpt; direct read 403)

URL: https://loyaltylobby.com/2026/10/14/begins-today-hilton-honors-more-points-to-play-promotion-for-1000-or-3000-bonus-points-per-stay-october-15-december-31-2026/

Excerpts, reproducing Hilton's FAQ: "Are all rates included in this promotion? No." · "Regardless of when a reservation was booked, any registered guests with nights within the Promotion Period will receive the promotion bonus." · "If a member starts a stay in the middle of the promotion period and checks-out after December 31, 2026, a member will not receive the bonus." · "Only members registered prior to check-out will receive Bonus Points with the 'More Points to Play' promotion."

## One Mile at a Time (Firecrawl search excerpt)

URL: https://onemileatatime.com/deals/hilton-honors-promotion/ — "Registration is required prior to your first eligible stay, though it's fine if you booked prior to registration."
