// ------------------------------------------------------------
// Tests the assistant's rules with sample questions.
// Usage (from the project folder): node scripts/test-assistant.mjs
// Prints each question's result and exits with an error if any fail.
// ------------------------------------------------------------
import { readFileSync } from 'node:fs'
import { createAssistant } from '../src/services/assistantEngine.js'
import { SPECIES_TEXT } from '../src/knowledge/speciesText.js'

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const assistant = createAssistant({
  speciesData: readJson('../src/knowledge/speciesData.json'),
  speciesText: SPECIES_TEXT,
  otherBirds: readJson('../public/classifier/species.json'),
})

const littleEgretFromHome = { id: 'little-egret', commonName: 'Little Egret', scientificName: 'Egretta garzetta' }
const owlFromIdentify = { id: 'sp_Asio_otus', commonName: 'Long-eared Owl', scientificName: 'Asio otus' }
const N = assistant.count

// kind: expected reply kind; species: expected bird; headings: expected section headings;
// includes: text that must appear somewhere in the reply.
const CASES = [
  { q: 'Tell me about the Little Egret', kind: 'answer', species: 'Little Egret', headings: [null] },
  { q: 'What does a black kite eat?', kind: 'answer', species: 'Black Kite', headings: ['What it eats'] },
  { q: 'Where can I see the Pied Avocet?', kind: 'answer', species: 'Pied Avocet', headings: ['Where to see it in Hong Kong'] },
  { q: 'When is the Asian Koel in Hong Kong?', kind: 'answer', species: 'Asian Koel', headings: ['When to see it in Hong Kong'] },
  { q: 'Is the black-faced spoonbill endangered?', kind: 'answer', species: 'Black-faced Spoonbill', includes: 'Vulnerable' },
  { q: 'What does the Grey Heron look like?', kind: 'answer', species: 'Gray Heron', headings: ['What it looks like'] },
  { q: "swinhoe's white eye habitat", kind: 'answer', species: "Swinhoe's White-eye", headings: ['Where it lives'] },
  { q: 'Where does the Common Tailorbird live?', kind: 'answer', species: 'Common Tailorbird', headings: ['Where it lives'] },
  { q: "What's the Chinese name of the Spotted Dove?", kind: 'answer', species: 'Spotted Dove', includes: '珠颈斑鸠' },
  { q: '小白鷺吃什麼？', kind: 'answer', species: 'Little Egret', headings: ['What it eats'] },
  { q: '黑臉琵鷺在哪裡可以看到', kind: 'answer', species: 'Black-faced Spoonbill', headings: ['Where to see it in Hong Kong'] },
  { q: '麻鷹', kind: 'answer', species: 'Black Kite' },
  { q: '豬屎渣', kind: 'answer', species: 'Oriental Magpie-Robin' },
  { q: 'egret', kind: 'clarify', includes: 'I know 3 egrets' },
  { q: 'What do egrets eat?', kind: 'clarify', includes: 'What does the Little Egret eat?' },
  { q: 'Tell me about owls', kind: 'unsupported', includes: `only supports ${N} species of bird` },
  { q: 'What does a penguin eat?', kind: 'unsupported', includes: 'expect to expand in the near future' },
  { q: 'Tell me about the Eurasian Eagle-Owl', kind: 'unsupported', includes: 'Eurasian Eagle-Owl' },
  { q: 'oriental magpie', kind: 'unsupported', includes: 'Oriental Magpie' },
  { q: 'oriental magpie robin', kind: 'answer', species: 'Oriental Magpie-Robin' },
  { q: 'Where can I see it?', context: littleEgretFromHome, kind: 'answer', species: 'Little Egret', headings: ['Where to see it in Hong Kong'] },
  { q: 'What does it eat?', context: owlFromIdentify, kind: 'unsupported', includes: 'Long-eared Owl' },
  { q: 'hello', kind: 'greeting' },
  { q: 'thanks!', kind: 'thanks' },
  { q: 'help', kind: 'help' },
  { q: 'Which birds do you know?', kind: 'list', includes: 'Pied Avocet' },
  { q: 'How many species do you know?', kind: 'list' },
  { q: 'What birds can I see at Mai Po?', kind: 'planner' },
  { q: 'where and when can I see the black-winged stilt', kind: 'answer', species: 'Black-winged Stilt', headings: ['Where to see it in Hong Kong', 'When to see it in Hong Kong'] },
  { q: 'blah blah', kind: 'fallback' },
  { q: 'What does it eat?', kind: 'which-bird' },
  { q: 'Tell me about the kingfisher', kind: 'clarify', includes: 'kingfishers' },
  { q: 'Tell me about the cattle egret', kind: 'answer', species: 'Eastern Cattle-Egret' },
  { q: 'night heron behaviour', kind: 'answer', species: 'Black-crowned Night Heron', headings: ['Behaviour'] },
  { q: 'Collared crow conservation status', kind: 'answer', species: 'Collared Crow', includes: 'Vulnerable' },
  { q: 'Is the asian tit endangered?', kind: 'answer', species: 'Asian Tit', includes: 'couldn’t find a global IUCN Red List status' },
  { q: 'Egretta garzetta', kind: 'answer', species: 'Little Egret' },
  { q: 'Little egrets', kind: 'answer', species: 'Little Egret' },
  { q: 'Where can I see a sparrow?', kind: 'answer', species: 'Eurasian Tree Sparrow', headings: ['Where to see it in Hong Kong'] },
  { q: 'Tell me about the starling', kind: 'answer', species: 'Black-collared Starling' },
  { q: "What's the difference between a little egret and a great egret?", kind: 'answer', species: 'Little Egret', includes: 'You also mentioned the Great Egret' },
  { q: 'spoonbill', kind: 'answer', species: 'Black-faced Spoonbill' },
  { q: 'When does the pied avocet visit?', kind: 'answer', species: 'Pied Avocet', includes: 'rarely' },
  { q: 'Red-whiskered bulbul: when can I see it?', kind: 'answer', species: 'Red-whiskered Bulbul', includes: 'all year round' },
  { q: '鷺', kind: 'clarify', includes: 'I know 6 herons and egrets' },
  { q: 'What does a duck eat', kind: 'clarify', includes: 'ducks' },
  { q: 'Is the house swift common in summer?', kind: 'answer', species: 'House Swift', headings: ['When to see it in Hong Kong'] },
  { q: 'bye', kind: 'bye' },
  { q: 'Tell me about the Japanese White-eye', kind: 'answer', species: "Swinhoe's White-eye" },
  { q: 'what is the little grebe called in chinese', kind: 'answer', species: 'Little Grebe', includes: '小䴙䴘' },
]

let failures = 0
for (const test of CASES) {
  const reply = assistant.ask(test.q, test.context ?? null)
  const allText = [reply.title, ...reply.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.items ?? [])]), ...reply.suggestions].join(' ')
  const problems = []
  if (reply.kind !== test.kind) problems.push(`kind ${reply.kind}, expected ${test.kind}`)
  if (test.species && reply.species?.commonName !== test.species) problems.push(`species ${reply.species?.commonName}, expected ${test.species}`)
  if (test.headings) {
    const headings = reply.sections.map((s) => s.heading).slice(0, test.headings.length)
    if (JSON.stringify(headings) !== JSON.stringify(test.headings)) problems.push(`headings ${JSON.stringify(headings)}`)
  }
  if (test.includes && !allText.includes(test.includes)) problems.push(`missing "${test.includes}"`)
  if (problems.length) failures++
  console.log(`${problems.length ? 'FAIL' : 'ok  '}  ${test.q}${test.context ? ` [about: ${test.context.commonName}]` : ''}${problems.length ? `\n        ${problems.join('; ')}` : ''}`)
}
console.log(`\n${CASES.length - failures} of ${CASES.length} passed`)
if (failures) process.exit(1)
