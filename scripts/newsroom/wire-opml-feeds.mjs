// Exact public feed URLs from the owner-imported DubaiPoints OPML, 12 Nov 2026.
// Source SHA-256: a2898c5417a48fe5632731d0728855cbceb25874e8d590b369d168d87aa0306e
// Role describes discovery provenance only; no feed item is a verified claim.
export const OPML_BATCHES = Object.freeze([
  { id: "uae-airlines", folder: "DubaiPoints - Airlines & Airports", beat: "airlines", role: "official", scopeCheck: false, feeds: [
    ["air-arabia-newsroom","Air Arabia Newsroom","https://press.airarabia.com/feed/en"],
    ["flydubai","flydubai Newsroom","https://news.flydubai.com/feed"],
    ["dubai-airports-newsroom","Dubai Airports Newsroom","https://media.dubaiairports.ae/feed/en"],
  ] },
  { id: "international-airlines", folder: "DubaiPoints - International Airline and Airport Newsrooms", beat: "airlines", role: "official", scopeCheck: true, feeds: [
    ["lufthansa-group","Lufthansa Group","https://newsroom.lufthansagroup.com/feed/en"],
    ["cathay-pacific","Cathay Pacific (bilingual)","https://news.cathaypacific.com/feed"],
    ["klm","KLM","https://nieuws.klm.com/feed/en"],
    ["united-airlines","United Airlines (UAE routes and partners only)","https://united.mediaroom.com/news-releases?pagetemplate=rss"],
    ["schiphol-airport","Schiphol Airport (UAE connections only)","https://nieuws.schiphol.nl/tagfeed/en/tags/news"],
  ] },
  { id: "aviation-trade", folder: "DubaiPoints - Airline Routes and Aviation Trade (discovery)", beat: "airlines", role: "discovery", scopeCheck: true, feeds: [
    ["aeroroutes","AeroRoutes","https://www.aeroroutes.com/eng?format=rss"],
    ["air-service-one","Air Service One","https://airserviceone.com/feed/"],
    ["al-khaleej-tourism-and-aviation","Al Khaleej Tourism and Aviation (Arabic)","https://www.alkhaleej.ae/rssFeed/158/7"],
    ["future-travel-experience","Future Travel Experience","https://www.futuretravelexperience.com/feed/"],
  ] },
  { id: "hotel-newsrooms", folder: "DubaiPoints - Hotel Newsrooms", beat: "hotels", role: "official", scopeCheck: true, feeds: [
    ["hilton-stories","Hilton Stories","https://stories.hilton.com/feed"],
    ["hyatt-newsroom","Hyatt Newsroom","https://newsroom.hyatt.com/news-releases?pagetemplate=rss"],
    ["ihg-emeaa-newsroom","IHG EMEAA Newsroom (legacy article links)","https://www.ihgplc.com/en/rss/rss-news/emeaa?async=1&content-type=text%2Fxml&rss=emeaa"],
    ["dusit-hotels-and-resorts","Dusit Hotels and Resorts","https://www.dusit.com/feed/"],
    ["wyndham-hotels-and-resorts","Wyndham Hotels and Resorts","https://corporate.wyndhamhotels.com/feed/press-release/"],
  ] },
  { id: "points-miles", folder: "DubaiPoints - Points & Miles (discovery)", beat: "points", role: "discovery", scopeCheck: true, feeds: [
    ["hfp","Head for Points (UK)","https://www.headforpoints.com/feed/"],
    ["tpg","The Points Guy (US)","https://thepointsguy.com/feed"],
    ["lfal","Live From A Lounge (India and Gulf connections)","https://livefromalounge.com/feed/"],
    ["loyaltylobby","LoyaltyLobby","https://loyaltylobby.com/feed/"],
    ["frequent-flyer-bonuses","Frequent Flyer Bonuses","https://blog.frequentflyerbonuses.com/feed"],
    ["awardwallet","AwardWallet","https://awardwallet.com/blog/feed/"],
    ["mainly-miles","Mainly Miles (Asia and Gulf connections)","https://mainlymiles.com/feed/"],
    ["frequent-miler","Frequent Miler (US)","https://frequentmiler.com/feed/"],
    ["turning-left-for-less","Turning Left for Less (UK)","https://www.turningleftforless.com/feed/"],
  ] },
  { id: "travel-trade", folder: "DubaiPoints - Travel Trade (discovery)", beat: "hotels", role: "discovery", scopeCheck: true, feeds: [
    ["hospitality-net-middle-east-africa","Hospitality Net - Middle East & Africa","https://www.hospitalitynet.org/rss/news/mea.xml"],
    ["travel-daily-media","Travel Daily Media","https://www.traveldailymedia.com/feed/tdm-special/"],
  ] },
  { id: "uae-tourism", folder: "DubaiPoints - UAE Tourism and Transport (official)", beat: "travel", role: "official", scopeCheck: true, feeds: [
    ["abu-dhabi-media-office-tourism","Abu Dhabi Media Office - Tourism","https://www.mediaoffice.abudhabi/en/tourism/rss/"],
    ["abu-dhabi-media-office-transport","Abu Dhabi Media Office - Transport","https://www.mediaoffice.abudhabi/en/transport/rss/"],
    ["abu-dhabi-media-office-arts-and-culture","Abu Dhabi Media Office - Arts and Culture","https://www.mediaoffice.abudhabi/en/arts-culture/rss/"],
    ["miral-yas-island-and-abu-dhabi-attractions","Miral - Yas Island and Abu Dhabi attractions","https://miral.ae/feed/"],
    ["dnata-travel-group-newsroom","dnata Travel Group Newsroom (low frequency)","https://dnatatravel.presspage.com/feed/en"],
  ] },
  { id: "uae-local-offers", folder: "DubaiPoints - UAE Travel and Local Offers (discovery)", beat: "travel", role: "discovery", scopeCheck: true, feeds: [
    ["what-s-on-uae","What's On UAE","https://whatson.ae/feed/"],
    ["time-out-dubai","Time Out Dubai","https://www.timeoutdubai.com/feed"],
    ["emirates-24-7-business","Emirates 24|7 - Business","https://www.emirates247.com/rss/mobile/v2/business.rss"],
  ] },
  { id: "cards-payments", folder: "DubaiPoints - Cards and Payments Trade (discovery)", beat: "cards", role: "discovery", scopeCheck: true, feeds: [
    ["fintech-news-middle-east","Fintech News Middle East","https://fintechnews.ae/feed/"],
    ["finance-middle-east-banking-and-insurance","Finance Middle East - Banking and Insurance","https://www.financemiddleeast.com/banking-and-insurance/feed/"],
    ["economy-middle-east-banking-and-finance","Economy Middle East - Banking and Finance","https://economymiddleeast.com/newscategories/banking-finance/feed/"],
    ["entrepreneur-middle-east","Entrepreneur Middle East (payments leads only)","https://mena.entrepreneur.com/feed"],
  ] },
  { id: "global-aviation", folder: "DubaiPoints - Optional Global Aviation Radar", beat: "airlines", role: "discovery", scopeCheck: true, feeds: [
    ["ch-aviation","ch-aviation (headline discovery; article access varies)","https://www.ch-aviation.com/news/feed"],
    ["aerotime","AeroTime","https://www.aerotime.aero/feed"],
    ["simple-flying","Simple Flying","https://simpleflying.com/feed/"],
  ] },
].map(batch => Object.freeze({ ...batch, feeds: Object.freeze(batch.feeds.map(Object.freeze)) })));
