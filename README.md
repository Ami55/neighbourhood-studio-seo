# Neighbourhood Studio

A Vercel-ready bulk content generator for ToursByLocals neighbourhood pages. It imports Excel/CSV rows, generates structured neighbourhood content through OpenAI, supports editing, and exports the result in the existing bulk-upload shape.

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and add an OpenAI API key.
3. Run `npm run dev` for the interface. Use `vercel dev` when testing the serverless API locally.

## Vercel deployment

1. Upload this folder to a GitHub repository.
2. Import that repository in Vercel. The framework preset should be Vite.
3. Add `OPENAI_API_KEY` in **Settings → Environment Variables** for Production and Preview.
4. Optionally add `OPENAI_MODEL`; it defaults to `gpt-4.1` to match the original Google Sheets tool.
5. In **Settings → Deployment Protection**, ensure the production app is accessible to its intended company users.

The API key is read only by `api/generate.js` and is never sent to the browser.

## Content-quality layer

The original 23-part `Prompt_Config` handbook is preserved. A final SEO/GEO layer adds search-intent alignment, neighbourhood and city entity disambiguation, named-entity relationships, passage-level readability, information-gain checks, factual restraint, and safeguards against repetitive scaled content. The structured API schema remains authoritative over the legacy array-only output example.

The server also includes an expanded, controlled `Who it's for` taxonomy in `api/audience-taxonomy.js`. It selects three to five labels per neighbourhood. The first three cover a primary motivation, a secondary experience, and a traveller type or visit style. Fourth and fifth labels are included only when they add distinct, well-supported motivations.
