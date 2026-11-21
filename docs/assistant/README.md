# Bird assistant (rule-based chatbot)

The **Assistant** screen is a simple rule-based chatbot, not an AI. It answers basic questions about **61 Hong Kong bird species**: the 60 species in the trip planner plus the Black-faced Spoonbill. It runs entirely in the browser; questions aren't sent anywhere or saved.

## What it can answer

| Intent | Example questions | Where the answer comes from |
|---|---|---|
| Overview | "Tell me about the Little Egret", or just a bird's name | All of the below, in short |
| Appearance | "What does the Grey Heron look like?" | Hand-written description |
| Habitat | "Where does the Common Tailorbird live?" | Hand-written description |
| Where to see it | "Where can I see the Pied Avocet?" | Trip planner model: best 3 sites in the species' best month (2-hour visit from 07:00, typical weather) |
| When to see it | "When is the Asian Koel in Hong Kong?" | Monthly reporting rates from complete eBird checklists (Oct 2025 to Sep 2026) |
| Diet | "What does a Black Kite eat?" | Hand-written description |
| Behaviour | "Night heron behaviour" | Hand-written description |
| Conservation | "Is the Black-faced Spoonbill endangered?" | IUCN Red List (see below) |
| Names | "What is the Little Grebe called in Chinese?" | Species lists |
| Other | "Which birds do you know?", "help", "hello", "thanks" | Built-in replies |

One question can ask up to three things ("Where and when can I see the Black-winged Stilt?").

## How a question is understood

1. **Clean up the text:** lower case, punctuation removed, "grey" treated as "gray", and traditional Chinese characters turned into simplified ones.
2. **Find the bird.** It looks for, longest name first:
   - the 61 species' English, scientific and Chinese names
   - nicknames such as "kite", "magpie robin", 麻鷹 for Black Kite and 豬屎渣 for Oriental Magpie-Robin
   - the identifier's other 312 species
   - group words such as "egret" or "owl"

   Longest first means "oriental magpie robin" isn't mistaken for "oriental magpie".
3. **Decide what to do:**
   - **A supported species** → answer about it.
   - **One of the other 312 species, or a group word with no supported members** ("owl", "penguin") → the "not supported" reply, with the correct number: *"This chatbot currently only supports 61 species of bird, and we expect to expand in the near future."*
   - **A group word with several members** ("egret") → asks which one, with buttons for each.
   - **No bird named** (for example "What does it eat?") → uses the bird being discussed. That's the last bird answered about, or one chosen with *Ask the assistant* on the Home, Plan a trip or Identify screens.
4. **Find the intent** from keyword lists (English and Chinese): see `RULES` in `src/services/assistantEngine.js`. With no intent keywords, it gives the overview.

## Where the facts come from, and how they were checked

- **Seasons and best places** (60 species) come from the trip planner's data and model (`docs/model/`). The wording is generated from the numbers. For example, "Mostly recorded from November to April, and rarely from June to September" means:
  - **Main months:** reported at least half as often as in the best month. A single quieter month between two main months still counts if it has over a third of the best rate.
  - **"Rarely":** under a tenth of the best month.
- **Conservation status** is the global IUCN Red List category:
  - **57 species:** from iNaturalist, which mirrors the IUCN. They agree with Wikidata wherever both list a status.
  - **Scarlet Minivet:** from Wikipedia (citing the IUCN).
  - **Asian Tit, Amur Stonechat and Eastern Cattle-Egret:** no global status exists under these names, because bird lists define these species differently. The assistant says so instead of guessing.
  - **The two threatened species were checked on BirdLife International's DataZone** (22 Nov 2026):
    - **Black-faced Spoonbill:** Vulnerable since 2025, Endangered in 2008–2017.
    - **Collared Crow:** Vulnerable since 2018, Near Threatened before.
- **Descriptions** (appearance, habitat, diet, behaviour) are short notes written for BirdQuest, using only well-established facts and not copied from any source. Every answer that uses them says to check a field guide for detail.
- **Chinese names** are simplified characters from the photo identifier's species list. Eight names in that list had damaged characters ("?"), which are now corrected in `scripts/build-classifier-species.mjs`, for example Little Grebe 小䴙䴘. Some Hong Kong names are accepted as nicknames, such as 純色鷦鶯 for Plain Prinia.

## Files

| File | What it is |
|---|---|
| `src/services/assistantEngine.js` | The rules: name matching, intents, answer building (pure logic, testable in Node) |
| `src/services/assistantService.js` | Loads the knowledge files when the assistant is first used, and calls the engine |
| `src/knowledge/speciesData.json` | Generated facts: names, monthly rates, best places, IUCN status |
| `src/knowledge/speciesText.js` | Hand-written descriptions and nicknames |
| `scripts/build-assistant-data.mjs` | Builds `speciesData.json` (needs internet for iNaturalist and Wikidata) |
| `scripts/test-assistant.mjs` | 50 sample questions with expected answers (`npm test`) |
| `src/screens/AssistantScreen.jsx`, `src/components/ChatMessage.jsx`, `src/components/AssistantGuide.jsx` | The chat screen |

## Adding a species

1. Add its scientific name to `EXTRA_SPECIES` in `scripts/build-assistant-data.mjs`. It must be one of the identifier's 373 species, so its names are known.
2. Add its entry to `src/knowledge/speciesText.js`: nicknames, appearance, habitat, diet and behaviour. If the trip model doesn't cover it, also add `season` and `where`.
3. Run `node scripts/build-assistant-data.mjs`, then add a test question to `scripts/test-assistant.mjs` and run `npm test`.

The species count in every message, including the "not supported" reply, updates automatically.

## Limitations

- **Keyword rules, not language understanding.** Unusual phrasing may get the overview, or "I didn't understand".
- **One bird per answer.** If a question names two, it answers the first and suggests asking about the second.
- **It can't compare birds,** count individuals or give real-time sightings.
- **Seasons and places reflect one year of eBird data** (October 2025 to September 2026).
