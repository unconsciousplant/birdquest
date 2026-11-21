// ------------------------------------------------------------
// The assistant's rule-based "brain". No AI and no internet:
//   1. find which bird the question is about (names, nicknames, Chinese names),
//   2. find what the person wants to know (the "intent") from keywords,
//   3. build the answer from the knowledge files.
// It's pure logic: assistantService.js loads the data and passes it in,
// and scripts/test-assistant.mjs tests it with sample questions.
// ------------------------------------------------------------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ---------- Text clean-up ----------

// Traditional -> simplified Chinese for the characters this assistant needs
// (bird names and question words), so both scripts work. Pairs: traditional, simplified.
const TRADITIONAL_PAIRS =
  '東东 烏乌 亞亚 勞劳 葉叶 嘯啸 頭头 惡恶 樹树 磯矶 紅红 純纯 繡绣 綠绿 縫缝 腳脚 臉脸 蒼苍 鶯莺 藍蓝 ' +
  '錐锥 長长 陽阳 領领 頸颈 鳥鸟 鳩鸠 雞鸡 鷄鸡 鳶鸢 鴉鸦 鶇鸫 鸕鸬 鴨鸭 鴒鸰 鴝鸲 鴿鸽 鵑鹃 鵲鹊 鵯鹎 ' +
  '鷀鹚 鶿鹚 鶥鹛 鶺鹡 鷚鹨 鷦鹪 鷸鹬 鷺鹭 黃黄 捲卷 鷿䴙 鷉䴘 樣样 認认 點点 習习 為为 爲为 聲声 瀕濒 ' +
  '護护 脅胁 錄录 學学 紹绍 麼么 麽么 係系 謝谢 該该 幾几 時时 節节 邊边 裡里 裏里 觀观 徵征 棲栖 處处 ' +
  '鴞鸮 鷹鹰 貓猫 鷗鸥 鵝鹅 鸚鹦 鵡鹉 鶴鹤 鴕鸵 鵜鹈 鶘鹕 鸛鹳 鴛鸳 鴦鸯 鴴鸻 鵰雕 囉啰 見见 嗎吗 話话 ' +
  '請请 問问 鵐鹀 鶲鹟 鷓鹧 鴣鸪 鵪鹌 鶉鹑 鷯鹩 鷲鹫 鶚鹗 豬猪 喫吃'
const TO_SIMPLIFIED = new Map(TRADITIONAL_PAIRS.split(' ').map((pair) => [...pair]))

function toSimplified(text) {
  return [...text].map((char) => TO_SIMPLIFIED.get(char) ?? char).join('')
}

// Lower case, no punctuation, "grey" -> "gray", padded with spaces so whole
// words can be found with " word ". Chinese characters are kept.
function normalize(text) {
  const cleaned = toSimplified(String(text))
    .toLowerCase()
    .replace(/[’'`]/g, '') // swinhoe's -> swinhoes
    .replace(/[^a-z0-9㐀-鿿]+/g, ' ')
    .replace(/\bgrey\b/g, 'gray')
    .replace(/\s+/g, ' ')
    .trim()
  return ` ${cleaned} `
}

const hasChinese = (text) => /[㐀-鿿]/.test(text)

// ---------- Bird groups ----------
// A group word on its own ("egret") lists the species it could mean.
// Groups with no members are birds this assistant doesn't cover yet.
const GROUPS = [
  { words: ['egret', 'egrets'], plural: 'egrets', members: ['Egretta garzetta', 'Ardea alba', 'Ardea coromanda'] },
  { words: ['heron', 'herons'], plural: 'herons', members: ['Ardea cinerea', 'Ardeola bacchus', 'Nycticorax nycticorax'] },
  {
    words: ['鹭'],
    plural: 'herons and egrets',
    members: ['Egretta garzetta', 'Ardea alba', 'Ardea coromanda', 'Ardea cinerea', 'Ardeola bacchus', 'Nycticorax nycticorax'],
  },
  { words: ['bulbul', 'bulbuls', '鹎'], plural: 'bulbuls', members: ['Pycnonotus jocosus', 'Pycnonotus sinensis', 'Hemixos castanonotus'] },
  { words: ['dove', 'doves', '斑鸠', '鸠'], plural: 'doves', members: ['Spilopelia chinensis', 'Streptopelia decaocto'] },
  { words: ['crow', 'crows', '乌鸦', '鸦'], plural: 'crows', members: ['Corvus macrorhynchos', 'Corvus torquatus'] },
  { words: ['myna', 'mynas', 'mynah', 'mynahs'], plural: 'mynas', members: ['Acridotheres cristatellus', 'Acridotheres tristis'] },
  {
    words: ['wagtail', 'wagtails', '鹡鸰'],
    plural: 'wagtails',
    members: ['Motacilla alba', 'Motacilla tschutschensis', 'Motacilla cinerea'],
  },
  {
    words: ['warbler', 'warblers'],
    plural: 'warblers',
    members: ['Phylloscopus inornatus', 'Phylloscopus fuscatus', 'Orthotomus sutorius'],
  },
  { words: ['prinia', 'prinias'], plural: 'prinias', members: ['Prinia flaviventris', 'Prinia inornata'] },
  { words: ['munia', 'munias', 'mannikin', 'mannikins'], plural: 'munias', members: ['Lonchura punctulata', 'Lonchura striata'] },
  { words: ['sandpiper', 'sandpipers'], plural: 'sandpipers', members: ['Actitis hypoleucos', 'Tringa glareola'] },
  { words: ['kingfisher', 'kingfishers'], plural: 'kingfishers', members: ['Alcedo atthis', 'Halcyon smyrnensis'] },
  {
    words: ['magpie', 'magpies'],
    plural: 'birds with “magpie” in their name',
    members: ['Urocissa erythroryncha', 'Copsychus saularis'],
  },
  { words: ['duck', 'ducks', '鸭'], plural: 'ducks', members: ['Spatula clypeata', 'Anas crecca'] },
  { words: ['cuckoo', 'cuckoos'], plural: 'cuckoos', members: ['Eudynamys scolopaceus', 'Centropus sinensis'] },
  {
    words: ['thrush', 'thrushes'],
    plural: 'birds with “thrush” in their name',
    members: ['Myophonus caeruleus', 'Pterorhinus perspicillatus'],
  },
  {
    words: ['wader', 'waders', 'shorebird', 'shorebirds', '鹬'],
    plural: 'waders',
    members: ['Recurvirostra avosetta', 'Himantopus himantopus', 'Tringa nebularia', 'Actitis hypoleucos', 'Tringa glareola', 'Gallinago gallinago'],
  },
  { words: ['starling', 'starlings'], plural: 'starlings', members: ['Gracupica nigricollis'] },
  {
    words: [
      'owl', 'owls', 'eagle', 'eagles', 'hawk', 'hawks', 'falcon', 'falcons', 'kestrel', 'kestrels', 'buzzard', 'buzzards',
      'osprey', 'ospreys', 'harrier', 'harriers', 'gull', 'gulls', 'seagull', 'seagulls', 'tern', 'terns', 'plover', 'plovers',
      'lapwing', 'lapwings', 'curlew', 'curlews', 'godwit', 'godwits', 'stint', 'stints', 'ibis', 'ibises', 'stork', 'storks',
      'crane', 'cranes', 'pelican', 'pelicans', 'goose', 'geese', 'swan', 'swans', 'parrot', 'parrots', 'parakeet', 'parakeets',
      'cockatoo', 'cockatoos', 'woodpecker', 'woodpeckers', 'hornbill', 'hornbills', 'barbet', 'barbets', 'flycatcher',
      'flycatchers', 'bunting', 'buntings', 'finch', 'finches', 'oriole', 'orioles', 'bee eater', 'bee eaters', 'hoopoe',
      'nightjar', 'nightjars', 'quail', 'quails', 'pheasant', 'pheasants', 'partridge', 'partridges', 'penguin', 'penguins',
      'flamingo', 'flamingos', 'ostrich', 'ostriches', 'emu', 'emus', 'peacock', 'peacocks', 'peafowl', 'hummingbird',
      'hummingbirds', 'albatross', 'vulture', 'vultures', 'bittern', 'bitterns', 'crake', 'crakes', 'coot', 'coots',
      'nuthatch', 'nuthatches', 'wren', 'wrens', 'lark', 'larks', 'shearwater', 'shearwaters', 'petrel', 'petrels', 'gannet',
      'gannets', 'toucan', 'toucans', 'macaw', 'macaws', 'puffin', 'puffins', 'turkey', 'turkeys', 'chicken', 'chickens',
      'canary', 'canaries', 'budgie', 'budgies', 'sparrowhawk', 'sparrowhawks', 'swiftlet', 'swiftlets',
      '猫头鹰', '鸮', '鹰', '雕', '隼', '鸥', '海鸥', '燕鸥', '鸻', '企鹅', '鹦鹉', '啄木鸟', '天鹅', '鹤', '孔雀', '鸵鸟',
      '火烈鸟', '蜂鸟', '鹈鹕', '鹳', '鸳鸯', '鹅',
    ],
    plural: null,
    members: [],
  },
]

// ---------- Intents (what the person wants to know) ----------

const INFO_INTENTS = ['appearance', 'habitat', 'where', 'when', 'diet', 'behaviour', 'conservation', 'names']

const RULES = {
  greeting: [/^ (hi|hello|hey|hiya|good (morning|afternoon|evening)) /, /你好|哈啰|早晨/],
  thanks: [/ (thanks|thank you|thx|cheers|ty) /, /多谢|谢谢|唔该/],
  bye: [/ (bye|goodbye|see you|see ya) /, /拜拜|再见/],
  help: [
    / (help|what can you (do|answer|tell)|what do you know|what can i ask|how does this work|how do you work|who are you|what are you) /,
    /帮助|你识乜/,
  ],
  list: [
    / (which|what) (birds|species) /,
    / (list|all)( of)?( the)? (birds|species) /,
    / how many (birds|species) /,
    / (birds|species) (do|can) you (know|cover|support|answer) /,
    /有哪些鸟|什么鸟/,
  ],
  appearance: [
    / (look|looks|looking) like /,
    / (appearance|identify|identification|recogni[sz]e|tell apart|colou?rs?|plumage|size|how big|how large|how small|features|markings|describe|description) /,
    /样子|外形|外观|点认|特征|长什么样|颜色/,
  ],
  habitat: [/ (habitat|habitats|live|lives|living|environment) /, / found in /, /栖息|生境|住在|住哪/],
  where: [
    / where (can|could|do|should|would|might|to|is a good|are good|is the best|are the best)? ?(i|we|you|one)? ?(see|find|spot|watch|look for|go|observe) /,
    / where to /,
    / (best|good|top) (place|places|spot|spots|site|sites|location|locations|area|areas) /,
    / (hotspot|hotspots|place to see|places to see) /,
    /哪里|哪儿|在哪|边度|地点|去哪/,
  ],
  when: [
    / (when|season|seasons|seasonal|month|months|time of year|migrate|migrates|migration|migratory|resident|visitor|winter|summer|spring|autumn|all year|year round) /,
    /几时|何时|什么时候|季节|月份|几月|候鸟|留鸟/,
  ],
  diet: [/ (eat|eats|eating|food|foods|feed|feeds|feeding|diet|prey|hunt|hunts|hunting|forage|forages) /, /吃|食/],
  behaviour: [
    / (behaviou?rs?|habits?|call|calls|song|songs|sing|sings|singing|sound|sounds|voice|noise|noisy|fly|flies|flight|social|flock|flocks|nest|nests|nesting|breed|breeds|breeding|chicks|eggs) /,
    /习性|行为|叫声|筑巢|繁殖/,
  ],
  conservation: [
    / (endangered|conservation|status|threatened|threat|threats|rare|protected|protection|iucn|red list|vulnerable|extinct|extinction|population|declining|decline) /,
    /保育|濒危|保护|受威胁|红色名录|稀有/,
  ],
  names: [
    / (chinese name|scientific name|latin name|english name|other names?|also called|called|names) /,
    /学名|中文名|英文名|名字|叫什么/,
  ],
  overview: [/ (tell me about|about|what is|whats|who is|info|information|facts?|overview|know about|learn about|introduce) /, /介绍|是什么|系咩|系乜/],
}

const PRONOUN = / (it|its|they|them|their|this|that|these|those) |它|佢|这只|呢只/

function detectIntents(text) {
  const found = new Set()
  for (const [intent, patterns] of Object.entries(RULES)) {
    if (patterns.some((pattern) => pattern.test(text))) found.add(intent)
  }
  // "where does it live?" is about habitat, not where to go birdwatching.
  if (found.has('habitat') && / where (do|does|is|are) /.test(text) && !/ (see|find|spot|watch|look for|go) /.test(text)) {
    found.delete('where')
  }
  // A bare "where" ("where is it?") means where to see it.
  if (!found.has('where') && !found.has('habitat') && / where /.test(text)) found.add('where')
  return found
}

// "What birds can I see at Mai Po?" is a trip-planning question, not a species question.
const BIRDS_AT_A_PLACE = / (which|what) (birds?|species) (can|could|might|will|would|do) (i|we|you) (see|find|spot) /

// ---------- The assistant ----------

// speciesData: src/knowledge/speciesData.json (names, monthly rates, best places, IUCN status)
// speciesText: SPECIES_TEXT from src/knowledge/speciesText.js
// otherBirds:  birds known by name but not covered, e.g. the identifier's other species:
//              [{ commonName, scientificName, chineseName }]
export function createAssistant({ speciesData, speciesText, otherBirds = [] }) {
  const species = speciesData.map((data) => {
    const text = speciesText[data.scientificName]
    if (!text) throw new Error(`No text for ${data.scientificName}`)
    return { ...data, text }
  })
  const bySci = new Map(species.map((s) => [s.scientificName, s]))
  const count = species.length

  // Every name that can be recognised, longest first, so "oriental magpie robin"
  // wins over "oriental magpie" and "robin".
  const patterns = []
  const addName = (name, target) => {
    if (!name) return
    const key = hasChinese(name) ? toSimplified(name) : normalize(name).trim()
    if (key) patterns.push({ key, chinese: hasChinese(key), ...target })
  }
  for (const s of species) {
    for (const name of [s.commonName, s.scientificName, s.chineseName, ...s.text.aliases, ...s.text.zhAliases]) {
      addName(name, { kind: 'species', entry: s })
    }
  }
  const supportedSci = new Set(species.map((s) => s.scientificName))
  for (const bird of otherBirds) {
    if (supportedSci.has(bird.scientificName)) continue
    for (const name of [bird.commonName, bird.scientificName, bird.chineseName]) addName(name, { kind: 'other', bird })
  }
  for (const group of GROUPS) for (const word of group.words) addName(word, { kind: 'group', group })
  patterns.sort((a, b) => b.key.length - a.key.length)

  // Finds the birds and groups mentioned, in the order they appear.
  function findMentions(text) {
    let remaining = text
    const mentions = []
    for (const pattern of patterns) {
      const variants = pattern.chinese
        ? [pattern.key]
        : [` ${pattern.key} `, ` ${pattern.key}s `, ` ${pattern.key}es `] // simple plurals
      for (const variant of variants) {
        const at = remaining.indexOf(variant)
        if (at === -1) continue
        mentions.push({ ...pattern, at })
        // Blank out the match so shorter names inside it don't match again.
        const keepSpaces = pattern.chinese ? '' : ' '
        remaining =
          remaining.slice(0, at) + keepSpaces + ' '.repeat(variant.length - 2 * keepSpaces.length) + keepSpaces + remaining.slice(at + variant.length)
        break
      }
    }
    return mentions.sort((a, b) => a.at - b.at)
  }

  // ---------- Answer pieces ----------

  const percent = (rate) => (rate > 0 && rate < 0.005 ? 'under 1%' : `${Math.round(rate * 100)}%`)

  // Groups months into runs, wrapping round the year: [10, 11, 0, 1] -> "from October to February"
  function describeMonths(flags) {
    if (flags.every(Boolean)) return 'all year'
    if (!flags.some(Boolean)) return ''
    const start = flags.findIndex((on, i) => on && !flags[(i + 11) % 12])
    const runs = []
    for (let step = 0, i = start; step < 12; step++, i = (i + 1) % 12) {
      if (!flags[i]) continue
      if (runs.length && runs[runs.length - 1].end === (i + 11) % 12) runs[runs.length - 1].end = i
      else runs.push({ start: i, end: i })
    }
    const parts = runs.map((r) => (r.start === r.end ? `in ${MONTHS[r.start]}` : `from ${MONTHS[r.start]} to ${MONTHS[r.end]}`))
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]
  }

  function seasonPattern(s) {
    if (!s.monthlyRates) return s.text.season
    const rates = s.monthlyRates
    const max = Math.max(...rates)
    const min = Math.min(...rates)
    if (min >= 0.5 * max) return 'Recorded all year round, at a fairly steady rate.'
    // "Main" months: at least half as often as the best month. A single quieter month
    // between two main months still counts if it has over a third of the best rate,
    // so a small dip doesn't split the season in two.
    const strong = rates.map((r) => r >= 0.5 * max)
    const main = strong.map((on, i) => on || (strong[(i + 11) % 12] && strong[(i + 1) % 12] && rates[i] >= 0.35 * max))
    if (main.every(Boolean)) {
      // Common all year, with only a mild dip.
      return `Recorded all year round, a little less often ${describeMonths(strong.map((on) => !on))}.`
    }
    if (rates.every((r) => r >= 0.1 * max && r >= 0.005)) {
      // When it's common most of the year, the quiet months are the useful part.
      if (main.filter(Boolean).length >= 8) {
        return `Recorded in every month, least often ${describeMonths(main.map((on) => !on))}.`
      }
      return `Recorded in every month, but most often ${describeMonths(main)}.`
    }
    const rare = rates.map((r) => r < 0.1 * max || r < 0.005)
    return `Mostly recorded ${describeMonths(main)}, and rarely ${describeMonths(rare)}.`
  }

  function seasonParagraphs(s) {
    if (!s.monthlyRates) return [s.text.season]
    const rates = s.monthlyRates
    const max = Math.max(...rates)
    const min = Math.min(...rates)
    return [
      seasonPattern(s),
      `In ${MONTHS[rates.indexOf(max)]}, ${percent(max)} of birdwatchers’ checklists from Hong Kong recorded it; in ${MONTHS[rates.indexOf(min)]}, ${percent(min)}.`,
    ]
  }

  function whereSection(s) {
    if (!s.best) return { paragraphs: [s.text.where] }
    return {
      paragraphs: [
        `In ${MONTHS[s.best.month - 1]}, its best month in our data, the trip planner’s model gives the highest chances of recording it on a 2-hour morning visit at:`,
      ],
      items: s.best.places.map((p) => `${p.name}${p.nameZh ? ` (${p.nameZh})` : ''}: ${percent(p.chance)}`),
    }
  }

  function statusSentence(s) {
    return s.iucn
      ? `Its global status on the IUCN Red List is ${s.iucn.category}.`
      : 'I couldn’t find a global IUCN Red List status for it under this name. Bird lists draw the lines between species differently, so it may be assessed as part of a related species.'
  }

  function conservationParagraphs(s) {
    return [
      statusSentence(s),
      ...(s.text.conservationNote ? [s.text.conservationNote] : []),
      'In Hong Kong, all wild birds are protected by law under the Wild Animals Protection Ordinance (Cap. 170).',
    ]
  }

  function titleCase(name) {
    return name.replace(/\b\w/g, (c) => c.toUpperCase())
  }

  function namesParagraphs(s) {
    const otherEnglish = s.text.aliases.filter((a) => a.includes(' ') && normalize(a).trim() !== normalize(s.commonName).trim())
    return [
      `English: ${s.commonName}. Scientific: ${s.scientificName}. Chinese: ${s.chineseName}.`,
      ...(otherEnglish.length ? [`Also known as: ${otherEnglish.map(titleCase).join(', ')}.`] : []),
      ...(s.text.zhAliases.length ? [`Other Chinese names: ${s.text.zhAliases.join('、')}.`] : []),
    ]
  }

  // Each builds { paragraphs, items (optional list) } for one kind of question.
  const SECTIONS = {
    appearance: { heading: 'What it looks like', build: (s) => ({ paragraphs: [s.text.appearance] }) },
    habitat: { heading: 'Where it lives', build: (s) => ({ paragraphs: [s.text.habitat] }) },
    where: { heading: 'Where to see it in Hong Kong', build: whereSection },
    when: { heading: 'When to see it in Hong Kong', build: (s) => ({ paragraphs: seasonParagraphs(s) }) },
    diet: { heading: 'What it eats', build: (s) => ({ paragraphs: [s.text.diet] }) },
    behaviour: { heading: 'Behaviour', build: (s) => ({ paragraphs: [s.text.behaviour] }) },
    conservation: { heading: 'Conservation', build: (s) => ({ paragraphs: conservationParagraphs(s) }) },
    names: { heading: 'Names', build: (s) => ({ paragraphs: namesParagraphs(s) }) },
  }

  const SOURCES = {
    text: 'Descriptions are general notes written for BirdQuest; check a field guide for detail.',
    when: 'Seasonal figures: complete eBird checklists from Hong Kong, October 2025 to September 2026.',
    where: 'Chances: BirdQuest trip planner model, typical weather, 2-hour visit from 07:00. For your own dates, try Plan a trip → “Where can I see it?”.',
    conservation: 'Status: IUCN Red List',
  }

  const QUESTIONS = {
    overview: (n) => `Tell me about the ${n}`,
    appearance: (n) => `What does the ${n} look like?`,
    habitat: (n) => `Where does the ${n} live?`,
    where: (n) => `Where can I see the ${n}?`,
    when: (n) => `When is the ${n} in Hong Kong?`,
    diet: (n) => `What does the ${n} eat?`,
    behaviour: (n) => `How does the ${n} behave?`,
    conservation: (n) => `Is the ${n} endangered?`,
    names: (n) => `What is the ${n} called in Chinese?`,
  }
  const FOLLOW_UPS = {
    appearance: 'What does it look like?',
    where: 'Where can I see it?',
    when: 'When is it in Hong Kong?',
    diet: 'What does it eat?',
    conservation: 'Is it endangered?',
    behaviour: 'How does it behave?',
    habitat: 'Where does it live?',
  }

  const publicSpecies = (s) => ({ id: s.id, commonName: s.commonName, scientificName: s.scientificName, chineseName: s.chineseName })

  function reply(kind, fields) {
    return { isMock: false, kind, species: null, title: null, sections: [], notes: [], suggestions: [], ...fields }
  }

  function speciesReply(s, intents, alsoMentioned) {
    const sections = []
    const notes = new Set()
    if (intents.length === 0) {
      sections.push({
        heading: null,
        paragraphs: [
          s.text.appearance,
          `Where it lives: ${s.text.habitat}`,
          `In Hong Kong: ${seasonPattern(s)}`,
          `Conservation: ${statusSentence(s)}`,
        ],
      })
      notes.add(SOURCES.text)
      if (s.monthlyRates) notes.add(SOURCES.when)
    } else {
      for (const intent of intents) {
        sections.push({ heading: SECTIONS[intent].heading, ...SECTIONS[intent].build(s) })
        if (['appearance', 'habitat', 'diet', 'behaviour'].includes(intent)) notes.add(SOURCES.text)
        if (intent === 'when' && s.monthlyRates) notes.add(SOURCES.when)
        if (intent === 'where' && s.best) notes.add(SOURCES.where)
        if (intent === 'conservation' && s.iucn) notes.add(`${SOURCES.conservation} (via ${s.iucn.source}).`)
      }
    }
    for (const other of alsoMentioned) {
      sections.push({ heading: null, paragraphs: [`You also mentioned the ${other.commonName}. Ask about it next.`] })
    }
    const suggestions = [
      ...alsoMentioned.map((o) => QUESTIONS.overview(o.commonName)),
      ...Object.entries(FOLLOW_UPS)
        .filter(([intent]) => !intents.includes(intent))
        .map(([, question]) => question),
    ].slice(0, 4)
    return reply('answer', {
      species: publicSpecies(s),
      title: `${s.commonName} · ${s.scientificName} · ${s.chineseName}`,
      sections,
      notes: [...notes],
      suggestions,
    })
  }

  function unsupportedReply(name) {
    return reply('unsupported', {
      sections: [
        {
          heading: null,
          paragraphs: [
            name ? `Sorry, I don’t have information about the ${name} yet.` : 'Sorry, I don’t have information about that bird yet.',
            `This chatbot currently only supports ${count} species of bird, and we expect to expand in the near future.`,
          ],
        },
      ],
      suggestions: ['Which birds do you know?', 'Tell me about the Black-faced Spoonbill'],
    })
  }

  function clarifyReply(group, intents) {
    const members = group.members.map((sci) => bySci.get(sci))
    const names = members.map((m) => m.commonName)
    const list = `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    const ask = QUESTIONS[intents[0] ?? 'overview']
    return reply('clarify', {
      sections: [{ heading: null, paragraphs: [`I know ${members.length} ${group.plural}: ${list}. Which one do you mean?`] }],
      suggestions: names.slice(0, 4).map((n) => ask(n)),
    })
  }

  function listReply() {
    const names = [...species].sort((a, b) => a.commonName.localeCompare(b.commonName))
    return reply('list', {
      title: `The ${count} birds I know`,
      sections: [{ heading: null, paragraphs: [], items: names.map((s) => `${s.commonName} · ${s.chineseName}`) }],
      suggestions: ['Tell me about the Black-faced Spoonbill', 'Where can I see the Pied Avocet?', 'What does the Asian Koel eat?'],
    })
  }

  const EXAMPLES = ['What does the Little Egret eat?', 'Where can I see the Pied Avocet?', 'Is the Black-faced Spoonbill endangered?']

  function smallTalk(kind, paragraphs, suggestions = EXAMPLES) {
    return reply(kind, { sections: [{ heading: null, paragraphs }], suggestions })
  }

  // Resolves a species chosen on another screen (any object with a scientificName).
  function lookUp(selected) {
    if (!selected) return null
    const entry = bySci.get(selected.scientificName)
    return entry ? { supported: true, entry } : { supported: false, name: selected.commonName }
  }

  // ---------- Main entry ----------
  // question: what the person typed
  // contextSpecies: the species being discussed (chosen on another screen or
  // earlier in the chat), used when the question doesn't name a bird.
  function ask(question, contextSpecies = null) {
    const text = normalize(question)
    if (text.trim() === '') {
      return smallTalk('fallback', ['Type a question about a bird, for example “What does the Little Egret eat?”.'])
    }
    const intents = detectIntents(text)
    const infoIntents = INFO_INTENTS.filter((intent) => intents.has(intent)).slice(0, 3)
    const mentions = findMentions(text)

    // 1. A bird named in the question.
    let target = null
    const named = mentions.filter((m) => m.kind === 'species').map((m) => m.entry)
    const uniqueNamed = named.filter((s, i) => named.indexOf(s) === i)
    if (uniqueNamed.length) {
      target = uniqueNamed[0]
    } else if (mentions.length) {
      const first = mentions[0]
      if (first.kind === 'other') return unsupportedReply(first.bird.commonName)
      if (first.group.members.length === 0) return unsupportedReply(null)
      if (first.group.members.length === 1) target = bySci.get(first.group.members[0])
      else return clarifyReply(first.group, infoIntents)
    }

    // 2. Otherwise, the bird already being discussed (for "where can I see it?").
    const wantsBirdInfo = infoIntents.length > 0 || intents.has('overview') || PRONOUN.test(text)
    if (!target && contextSpecies && wantsBirdInfo) {
      const context = lookUp(contextSpecies)
      if (!context.supported) return unsupportedReply(context.name)
      target = context.entry
    }

    // 3. No bird: small talk, help, the species list, or ask which bird.
    if (!target) {
      if (BIRDS_AT_A_PLACE.test(text)) {
        return smallTalk('planner', [
          'To see which birds you might find at a place and time, use Plan a trip → “What can I see?”. It uses our trip model for 98 Hong Kong hotspots.',
          'I can tell you about one bird at a time, for example “Where can I see the Pied Avocet?”.',
        ])
      }
      if (intents.has('list')) return listReply()
      if (intents.has('help')) {
        return smallTalk('help', [
          'I’m a simple rule-based assistant, not an AI chatbot. I look for a bird’s name and some keywords in your question, then answer from a fixed set of facts.',
          `I know ${count} Hong Kong birds. I can tell you what they look like, where they live, when and where to see them in Hong Kong, what they eat, how they behave, their conservation status and their names.`,
          'You can type bird names in English, Latin or Chinese.',
        ])
      }
      if (intents.has('greeting')) {
        return smallTalk('greeting', [`Hello! Ask me about any of ${count} Hong Kong birds.`])
      }
      if (intents.has('thanks')) return smallTalk('thanks', ['You’re welcome! Is there another bird you’d like to know about?'])
      if (intents.has('bye')) return smallTalk('bye', ['Goodbye, and happy birdwatching!'], [])
      if (wantsBirdInfo) {
        return smallTalk('which-bird', [`Which bird do you mean? Type its name, for example “What does the Little Egret eat?”. I know ${count} Hong Kong species.`])
      }
      return smallTalk('fallback', [
        `Sorry, I didn’t understand that. I can answer questions about ${count} Hong Kong birds.`,
        'Type “help” to see what I can do.',
      ])
    }

    return speciesReply(target, infoIntents, uniqueNamed.slice(1))
  }

  // Whether a species chosen elsewhere (e.g. on the Identify screen) is covered.
  function isSupported(selected) {
    return Boolean(selected && bySci.has(selected.scientificName))
  }

  return { ask, isSupported, count, speciesNames: species.map((s) => s.commonName).sort() }
}
