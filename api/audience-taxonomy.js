export const AUDIENCE_TAXONOMY = {
  "Food and drink": [
    "Foodies", "Coffee lovers", "Wine lovers", "Craft beer fans",
    "Street food enthusiasts", "Fine dining seekers", "Traditional food seekers",
    "Market food explorers", "Bakery lovers", "Cocktail enthusiasts",
    "Local pub seekers", "Tea lovers",
  ],
  "Culture and history": [
    "Cultural seekers", "History lovers", "Heritage enthusiasts", "Museum lovers",
    "Literary travellers", "Archaeology enthusiasts", "Religious heritage explorers",
    "Industrial heritage enthusiasts", "Military history enthusiasts",
    "Local history seekers", "Indigenous culture learners",
  ],
  "Art and creativity": [
    "Art lovers", "Design lovers", "Creative minds", "Gallery hoppers",
    "Street art fans", "Contemporary art followers", "Craft enthusiasts",
    "Theatre lovers", "Independent cinema fans", "Artist studio explorers",
  ],
  "Architecture and urban character": [
    "Architecture fans", "Historic architecture enthusiasts", "Modern architecture fans",
    "Urban design enthusiasts", "Adaptive reuse fans", "Skyline seekers",
    "Public space enthusiasts", "Interior design lovers", "Engineering enthusiasts",
  ],
  Shopping: [
    "Shoppers", "Luxury shoppers", "Vintage hunters", "Market browsers", "Trend seekers",
    "Antique hunters", "Fashion enthusiasts", "Independent shop browsers",
    "Bookshop browsers", "Craft shoppers", "Design store browsers", "Record collectors",
  ],
  "Nature and green spaces": [
    "Nature lovers", "Outdoor enthusiasts", "Hikers", "Cyclists", "Garden lovers",
    "Park explorers", "Wildlife watchers", "Botanical garden enthusiasts",
    "Urban nature seekers", "Picnic lovers", "Scenic walkers",
  ],
  "Waterfront and coastal experiences": [
    "Waterfront walkers", "Beach lovers", "Coastal walkers", "Riverfront explorers",
    "Harbour enthusiasts", "Canal-side wanderers", "Island explorers",
    "Sailing enthusiasts", "Sunset seekers", "Maritime history enthusiasts",
  ],
  "Photography and views": [
    "Photography lovers", "Street photographers", "Architecture photographers",
    "Landscape photographers", "Cityscape lovers", "Panoramic view seekers",
    "Sunset photographers", "Instagram enthusiasts", "Colourful streetscape seekers",
  ],
  "Entertainment and nightlife": [
    "Music fans", "Nightlife seekers", "Festival lovers", "Live performance enthusiasts",
    "Live music fans", "Theatre-goers", "Comedy fans", "Bar hoppers",
    "Late-night diners", "Dance enthusiasts", "Sports fans", "Event-goers",
  ],
  "Local life and community": [
    "People watchers", "Local-life seekers", "Community-minded travellers",
    "Neighbourhood wanderers", "Independent café seekers", "Residential-area explorers",
    "Local market shoppers", "Community culture seekers", "Everyday-life observers",
  ],
  "Families and travelling groups": [
    "Families", "Families with young children", "Families with teenagers",
    "Multi-generational travellers", "Couples", "Solo travellers", "Friend groups",
    "Small groups", "Older travellers",
  ],
  "Travel pace and atmosphere": [
    "Slow travellers", "Leisurely walkers", "Quiet retreat seekers",
    "High-energy travellers", "Early-morning explorers", "Evening explorers",
    "Crowd-conscious travellers", "Relaxed itinerary planners",
    "Independent explorers", "Curious explorers", "Urban adventurers",
  ],
  "Itinerary and trip type": [
    "First-time visitors", "Repeat visitors", "Short-stay visitors", "Weekend visitors",
    "Day trippers", "Cruise passengers", "Stopover travellers", "Business travellers",
    "Car-free travellers", "Public transport users",
  ],
  "Specialist interests": [
    "Book lovers", "Music history fans", "Film and television fans",
    "Railway enthusiasts", "Maritime enthusiasts", "Aviation enthusiasts",
    "Sports history fans", "Religious history enthusiasts",
    "Political history enthusiasts", "Science enthusiasts", "University campus explorers",
  ],
};

export const audienceTaxonomyPrompt = `
EXPANDED WHO IT'S FOR TAXONOMY

This expanded taxonomy supersedes the shorter audience list earlier in the editorial handbook.
Use only labels from the approved categories below. Never invent, combine, pluralize, or reword a label.

${Object.entries(AUDIENCE_TAXONOMY)
  .map(([category, labels]) => `${category}:\n${labels.map((label) => `- ${label}`).join("\n")}`)
  .join("\n\n")}

SELECTION METHOD

Choose between three and five labels for each neighbourhood. Use three labels when they capture the neighbourhood accurately. Add a fourth or fifth only when each extra label represents a distinct, strongly supported reason to choose the neighbourhood.

The first three selections should cover:
1. Primary motivation: the strongest reason someone intentionally chooses this neighbourhood.
2. Secondary experience: another experience that materially defines the visit.
3. Traveller type or visit style: the group, pace, or itinerary role most naturally suited to it.

Optional fourth and fifth selections may capture an additional experience, specialist interest, or clearly relevant traveller type. Never add labels simply to reach five.

Normally choose labels from different categories. Never select near-synonyms or several labels expressing the same motivation.
Use a narrower label when the evidence supports it. For example, prefer Coffee lovers to Foodies for a café district, Market browsers to Shoppers for a market quarter, or Canal-side wanderers to Outdoor enthusiasts for a canal district.
Do not use an audience label merely because that audience could visit. The neighbourhood must offer a defining, relevant reason for that audience to choose it.
Use family, age, cruise, mobility, crowd, nightlife, or specialist-interest labels only when the neighbourhood description contains concrete support for the selection.
Across neighbourhoods in the same city, vary selections only when their actual identities differ. Never force variety at the expense of accuracy.
`;
