import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import promptConfig from "./prompt-config.json" with { type: "json" };
import { audienceTaxonomyPrompt } from "./audience-taxonomy.js";

const PROMPT_ORDER = [
  "ROLE_&_OBJECTIVE",
  "PROMPT_HIERARCHY",
  "WRITING_PHILOSOPHY",
  "OPENING_PRINCIPLES",
  "CONTENT_STRATEGY",
  "ENTITY_&_SEMANTIC_RULES",
  "ANSWER_ENGINE_OPTIMIZATION_(AEO)",
  "BRAND_VOICE",
  "INFORMATION_PRIORITY",
  "COMPARATIVE_WRITING",
  "SPATIAL_THINKING",
  "FACTUAL_ACCURACY",
  "WRITING_RULES",
  "COMPETITOR_DIFFERENTIATION",
  "INFORMATION_GAIN",
  "AUDIENCE_TAXONOMY",
  "AUDIENCE_SELECTION",
  "EXPERIENCE_ALIGNMENT",
  "TOP_SIGHTS_&_EXPERIENCES",
  "LANGUAGE_RULES",
  "OUTPUT_FORMAT",
  "EDITORIAL_REVIEW",
  "FINAL_QUALITY_CHECK",
];

const SEO_ENHANCEMENT = `
SEO, ENTITY, AND AI-SEARCH ENHANCEMENT

Search intent
- Write for a traveller deciding whether this neighbourhood belongs in their itinerary.
- Answer the implied questions: What is this neighbourhood known for? What can someone do here? How does it feel to spend time here? Who is it best suited to? How is it different from another part of the same city?
- Give the clearest decision-making answer in the opening two sentences. Do not bury the neighbourhood's defining value.

Primary-entity clarity
- Treat the neighbourhood as the primary entity and the city and country as disambiguating context.
- Name the neighbourhood naturally in the opening paragraph. For a generic or ambiguous neighbourhood name, pair it with the supplied city on first mention.
- Keep canonical place names consistent. Do not alternate between several invented variants of the same name.

Semantic and entity coverage
- Include three to six genuinely relevant named entities when available, such as streets, markets, parks, museums, waterfronts, squares, cultural venues, or locally defining institutions.
- Connect each named entity to the neighbourhood through a useful relationship. Explain what it contributes to the visit instead of dropping names into a list.
- Use natural subject-relation-object statements that are easy for search engines and AI systems to extract.
- Keep every entity within the neighbourhood or immediately associated with it. Do not borrow famous attractions from elsewhere in the city.

Passage and answer quality
- Give each paragraph one job: positioning and traveller fit; characteristic places and ways to spend time; contrast, pace, and itinerary role.
- Make each paragraph understandable on its own by naming the neighbourhood or a clear local entity rather than relying on vague phrases such as “this area”.
- Use specific nouns and observable details. Prefer factual relationships over adjective-heavy atmosphere.
- Include natural language relevant to neighbourhood discovery, such as things to do, local streets, cafés, markets, galleries, parks, waterfront walks, nightlife, or architecture only when those concepts genuinely define the place.
- Never repeat a keyword for ranking purposes. Semantic breadth and specificity matter more than keyword frequency.

Information gain and trust
- Add useful local context through spatial relationships, contrasts with nearby districts, the way people typically move through the area, or the type of visit it supports.
- Do not invent guide quotes, insider access, opening hours, prices, travel times, accessibility claims, safety claims, crowd levels, seasonal advice, or “locals know” tips unless they are firmly established.
- When a fact is uncertain, omit it. Never turn an assumption into a precise claim.
- Do not imply first-hand experience or name a local guide when no guide information was supplied.

Scaled-content protection
- Make each neighbourhood's primary identity, opening structure, examples, sentence rhythm, and conclusion materially distinct from the other neighbourhoods in the same response.
- Remove any sentence that could describe another neighbourhood after only changing the place name.
- Avoid stock conclusions such as “offers something for everyone”, “is well worth a visit”, or “makes a great base”.

ToursByLocals voice
- Write to one thoughtful traveller in a knowledgeable, down-to-earth voice. Use “you” sparingly when it makes a decision clearer.
- Keep travel human and specific without turning the description into advertising.
- Do not insert ToursByLocals, private tours, booking language, or a call to action into this neighbourhood module unless the supplied source content requires it.
`;

const Label = z.object({ label: z.string().min(1) });
const Neighbourhood = z.object({
  description: z.string().min(700),
  image: z.object({ alt: z.literal(""), src: z.literal("") }),
  name: z.string().min(1),
  slug: z.literal(""),
  topSights: z.array(Label).length(4),
  whoItsFor: z.array(Label).min(3).max(5),
});
const Result = z.object({ neighbourhoods: z.array(Neighbourhood).min(1).max(25) });

function buildPrompt(city, country, neighbourhoods) {
  const sections = PROMPT_ORDER.map((key) => promptConfig[key]).filter(Boolean).join("\n\n");
  return `${sections}\n\n${audienceTaxonomyPrompt}\n\n${SEO_ENHANCEMENT}\n\nROW DATA\n\nCity for this row: ${city}\nCountry for this row: ${country}\nNeighbourhoods for this row: ${neighbourhoods.join(", ")}\n\nCritical:\nReturn exactly one object for each supplied neighbourhood, in the same order. All neighbourhoods belong to ${city}, ${country}. Use only ${city} when a city name is needed. For generic names such as Downtown, Old Town, Old City, City Centre, Waterfront, Chinatown, Financial District, Market District, Arts District, CBD, or Historic Centre, include the exact city name in the output name. Choose three to five Who it's for labels per neighbourhood, using extra labels only when they are distinct and strongly supported. Conduct the editorial and final-quality checks silently before responding. The API response schema and the expanded taxonomy are authoritative over any earlier handbook instruction that requests exactly three labels or shows the array without its wrapper.`;
}

function cleanText(value, max = 140) {
  return String(value ?? "").trim().replace(/[<>]/g, "").slice(0, max);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
  }

  const city = cleanText(request.body?.city);
  const country = cleanText(request.body?.country);
  const rawNeighbourhoods = Array.isArray(request.body?.neighbourhoods)
    ? request.body.neighbourhoods
    : String(request.body?.neighbourhoods ?? "").split(/[,;\n]/);
  const neighbourhoods = rawNeighbourhoods.map((item) => cleanText(item)).filter(Boolean);

  if (!city || !country || !neighbourhoods.length) {
    return response.status(400).json({ error: "City, country, and at least one neighbourhood are required." });
  }
  if (neighbourhoods.length > 25) {
    return response.status(400).json({ error: "A row can contain up to 25 neighbourhoods." });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await openai.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-4.1",
      temperature: 0.4,
      instructions: "You are a careful SEO travel editor and structured-data formatter. Follow the supplied editorial rules exactly. Use Canadian English. Never invent placeholder image or slug values.",
      input: buildPrompt(city, country, neighbourhoods),
      text: { format: zodTextFormat(Result, "neighbourhood_collection") },
    });

    if (!result.output_parsed?.neighbourhoods) {
      throw new Error("The model did not return a usable neighbourhood collection.");
    }

    return response.status(200).json({ neighbourhoods: result.output_parsed.neighbourhoods });
  } catch (error) {
    console.error(error);
    const message = error?.status === 429
      ? "OpenAI rate limit reached. Wait a moment and try again."
      : error?.message || "Generation failed.";
    return response.status(error?.status && error.status < 500 ? error.status : 500).json({ error: message });
  }
}
