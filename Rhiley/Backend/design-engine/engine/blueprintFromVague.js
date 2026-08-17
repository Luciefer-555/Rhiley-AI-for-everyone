const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { CODING_MODEL, NIM_BASE_URL, NIM_API_KEY } = require("../config/models");

const archetypesDir = path.join(__dirname, "../archetypes");

function loadArchetypes() {
  const files = fs.readdirSync(archetypesDir).filter(f => f.endsWith(".json"));
  const archetypes = {};
  for (const file of files) {
    const raw = fs.readFileSync(path.join(archetypesDir, file), "utf-8");
    const parsed = JSON.parse(raw);
    archetypes[parsed.archetype_id] = parsed;
  }
  return archetypes;
}

const SYSTEM_PROMPT_TEMPLATE = `You are an expert UI architect. The user has provided a vague request for a website.
You must map this request to the single most appropriate structural archetype, and then flesh out a complete JSON blueprint.

Available Archetypes:
<ARCHETYPES>

INSTRUCTIONS:
1. Select the BEST matching archetype_id based on the user's request.
2. Build the "sections" array. 
   - You MUST include every section from the chosen archetype where "required": true.
   - You MAY include sections where "required": false IF the user's specific subject calls for it.
   - Fill in the "content" for each section using the "fill_guidance".
   - You MUST include the "purpose" string from the archetype in the output section object so we can verify required sections.
3. For any section where you invented or inferred the content (because the user didn't explicitly specify it), add "source": "inferred_default" into the section object. If the content came directly from the user's prompt, do not add the source tag.
4. Respond ONLY with raw JSON matching this schema exactly:
{
  "_reasoning": "Briefly explain why you chose this archetype",
  "archetype_id": "the-chosen-id",
  "layout": "vertical",
  "designStyle": "cinematic-dark",
  "motionPreset": "staggerRise",
  "sections": [
    { "type": "hero", "purpose": "Headline + short subheadline + primary CTA button", "source": "inferred_default", "content": { "title": "Headline", "subtitle": "Optional" } },
    { "type": "section", "purpose": "features_or_benefits", "content": { "title": "Features" } }
  ]
}

CRITICAL:
- Allowed section types: "hero", "section", "contentBlock", "nav".
- Use "section" for all standard flow content (e.g. pricing, testimonials, features, about, generic text/lists).
- Use "contentBlock" ONLY for highly specialized interactive widgets (e.g. 3D canvases, interactive maps). Do NOT use "contentBlock" for standard nested data like pricing tiers or testimonials.`;

async function callNim(systemPrompt, userPrompt) {
  const response = await axios.post(
    `${NIM_BASE_URL}/chat/completions`,
    {
      model: CODING_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 3000
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
      timeout: 60000
    }
  );

  let content = response.data.choices[0].message.content;
  content = content.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
  return JSON.parse(content);
}

function checkMissingRequiredSections(blueprint, archetypes) {
  const chosen = archetypes[blueprint.archetype_id];
  if (!chosen) return []; 
  
  const presentPurposes = blueprint.sections.map(s => s.purpose);
  const missing = [];
  
  chosen.default_sections.forEach(sec => {
    if (sec.required && !presentPurposes.includes(sec.purpose)) {
      missing.push(sec.purpose);
    }
  });
  
  return missing;
}

async function generateVagueBlueprint(userPrompt) {
  const archetypes = loadArchetypes();
  const archetypesJson = JSON.stringify(Object.values(archetypes), null, 2);
  let systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("<ARCHETYPES>", archetypesJson);
  
  let blueprint = await callNim(systemPrompt, userPrompt);
  
  let missing = checkMissingRequiredSections(blueprint, archetypes);
  if (missing.length > 0) {
    console.warn(`[blueprintFromVague] Missing required sections: ${missing.join(", ")}. Retrying...`);
    const retryPrompt = `${systemPrompt}\n\nCRITICAL RETRY INSTRUCTION:\nYour previous attempt missed the following REQUIRED sections for archetype '${blueprint.archetype_id}': ${missing.join(", ")}. You MUST include them in your output.`;
    blueprint = await callNim(retryPrompt, userPrompt);
    
    missing = checkMissingRequiredSections(blueprint, archetypes);
    if (missing.length > 0) {
      throw new Error(`Archetype '${blueprint.archetype_id}' is missing required section: ${missing[0]}`);
    }
  }
  
  return blueprint;
}

module.exports = {
  generateVagueBlueprint
};
