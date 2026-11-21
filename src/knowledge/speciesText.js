// ------------------------------------------------------------
// Hand-written notes for the assistant's 61 species, keyed by scientific name.
//
// These are short, general descriptions written for this prototype
// (original wording, well-established facts only). They are NOT copied
// from any source. Seasonal patterns, best places and conservation status
// are NOT written here: they come from data (src/knowledge/speciesData.json).
// Sizes are approximate body lengths.
//
// Fields:
//   aliases     other English names people may type (lower case)
//   zhAliases   other Chinese names (simplified), e.g. Hong Kong nicknames
//   appearance, habitat, diet, behaviour: one or two sentences each
//   season, where: only for species without model data (Black-faced Spoonbill)
//   conservationNote: extra context for threatened species
// ------------------------------------------------------------

export const SPECIES_TEXT = {
  'Pycnonotus jocosus': {
    aliases: ['red whiskered bulbul'],
    zhAliases: [],
    appearance:
      'A slim bulbul (about 20 cm) with a tall, pointed black crest, a red patch behind the eye, white cheeks and a red patch under the tail.',
    habitat: 'Parks, gardens, woodland edges and shrubby hillsides. It is one of the most familiar birds in Hong Kong.',
    diet: 'Mainly fruit and berries, plus insects.',
    behaviour: 'Noisy and sociable, usually in pairs or small groups, giving cheerful bubbling calls from treetops.',
  },
  'Spilopelia chinensis': {
    aliases: ['spotted necked dove', 'spot necked dove'],
    zhAliases: [],
    appearance:
      'A pinkish-brown dove (about 30 cm) with a black patch finely spotted with white on the back of the neck, and a long tail with white corners.',
    habitat: 'Parks, gardens, farmland and open country. It is very common in urban areas.',
    diet: 'Seeds and grains, picked up from the ground.',
    behaviour: 'Often walks on the ground or sits on wires. Its soft, repeated cooing is a common sound in the city.',
  },
  'Pycnonotus sinensis': {
    aliases: ['chinese bulbul', 'light vented bulbul'],
    zhAliases: ['白头翁'],
    appearance:
      'A greyish-olive bulbul (about 19 cm) with a black head and a white patch on the back of the head. The feathers under the tail are pale.',
    habitat: 'Parks, gardens, farmland and scrub, including busy urban areas.',
    diet: 'Fruit, berries and insects.',
    behaviour: 'Active and sociable, often in flocks outside the breeding season. It perches in the open and calls often.',
  },
  'Copsychus saularis': {
    aliases: ['magpie robin', 'robin'],
    zhAliases: ['猪屎渣'],
    appearance:
      'A black-and-white bird (about 20 cm). Males are glossy black above with a white wing stripe and white belly; females are greyer. It often cocks its long tail.',
    habitat: 'Parks, gardens, villages and woodland edges.',
    diet: 'Mainly insects and other small invertebrates, often taken from the ground.',
    behaviour: 'A fine singer with rich, varied songs, often delivered from a rooftop or other open perch, especially in spring.',
  },
  'Zosterops simplex': {
    aliases: ['white eye', 'swinhoes white eye', 'japanese white eye'],
    zhAliases: ['相思', '绣眼'],
    appearance: 'A small green bird (about 11 cm) with a yellow throat and a bold white ring around the eye.',
    habitat: 'Woodland, parks and gardens, wherever there are flowering or fruiting trees.',
    diet: 'Nectar, fruit and small insects.',
    behaviour: 'Moves through the treetops in busy, twittering flocks, often mixing with other small birds.',
  },
  'Milvus migrans': {
    aliases: ['kite'],
    zhAliases: ['麻鹰'],
    appearance:
      'A large brown bird of prey (about 55–60 cm) with long wings and a slightly forked tail, most often seen soaring overhead.',
    habitat: 'Over the harbour, coasts, hills and the city. Victoria Harbour is a good place to watch them.',
    diet: 'Fish taken from the water surface, food scraps, carrion and small animals.',
    behaviour:
      'Soars and circles for long periods, twisting its forked tail to steer. Large numbers gather at shared roosts outside the breeding season.',
  },
  'Gracupica nigricollis': {
    aliases: ['black collared starling'],
    zhAliases: [],
    appearance:
      'A large starling (about 28 cm) with a white head, a broad black collar, black-and-white wings and yellow skin around the eye.',
    habitat: 'Open grassy areas, farmland, parks and playing fields.',
    diet: 'Insects and other invertebrates found on the ground, plus fruit.',
    behaviour: 'Usually in pairs or small groups walking on grass to feed. It is noisy, with loud, harsh calls.',
  },
  'Passer montanus': {
    aliases: ['tree sparrow', 'sparrow'],
    zhAliases: [],
    appearance:
      'A small brown sparrow (about 14 cm) with a chestnut cap, white cheeks and a black spot on each cheek. Males and females look alike.',
    habitat: 'Towns, villages, farmland and parks. It lives close to people.',
    diet: 'Seeds and grains, and insects when feeding its young.',
    behaviour: 'Sociable and chirpy, feeding in flocks on the ground and nesting in holes and gaps in buildings.',
  },
  'Orthotomus sutorius': {
    aliases: ['tailorbird', 'tailor bird'],
    zhAliases: [],
    appearance:
      'A small, active warbler (about 12 cm) with a rufous cap, olive-green back, pale underparts and a long tail that is often held cocked up.',
    habitat: 'Gardens, parks, scrub and woodland edges, including in the city.',
    diet: 'Small insects and spiders.',
    behaviour:
      'Named for the way it "sews" the edges of leaves together with spider silk or plant fibres to hold its nest. Its loud, repeated calls are often heard before the bird is seen.',
  },
  'Acridotheres cristatellus': {
    aliases: ['crested mynah'],
    zhAliases: [],
    appearance:
      'A black myna (about 26 cm) with a short tuft of feathers on the forehead, a pale yellow bill and white wing patches that show in flight.',
    habitat: 'Open country, farmland, parks and urban areas.',
    diet: 'Insects, fruit, seeds and scraps.',
    behaviour: 'Often walks on lawns in pairs or small flocks. It is noisy and can copy other sounds.',
  },
  'Egretta garzetta': {
    aliases: [],
    zhAliases: [],
    appearance: 'A slim, all-white heron (about 60 cm) with a black bill, black legs and yellow feet.',
    habitat: 'Wetlands, fishponds, rivers, mangroves and the shore.',
    diet: 'Small fish, shrimps and other small water creatures.',
    behaviour:
      'Often stirs the water with its feet to flush out prey. It nests in colonies, called egretries, together with other herons.',
  },
  'Parus cinereus': {
    aliases: ['tit', 'great tit', 'cinereous tit', 'japanese tit'],
    zhAliases: [],
    appearance:
      'A small grey-and-white tit (about 13 cm) with a black head, bright white cheeks and a black stripe down the middle of the belly.',
    habitat: 'Woodland, parks and wooded hillsides.',
    diet: 'Insects and caterpillars, plus seeds and fruit.',
    behaviour: 'Agile and acrobatic, often hanging upside down to search leaves. It often joins mixed flocks of small birds.',
  },
  'Motacilla alba': {
    aliases: ['pied wagtail'],
    zhAliases: [],
    appearance:
      'A slender black, grey and white bird (about 19 cm) with a long tail that it constantly wags up and down.',
    habitat: 'Open ground, often near water: riverbanks, fishponds, roadsides, car parks and playing fields.',
    diet: 'Insects, caught while running along the ground or in short flights.',
    behaviour: 'Walks and runs quickly while pumping its tail, and flies with a bouncing, up-and-down flight.',
  },
  'Corvus macrorhynchos': {
    aliases: ['jungle crow', 'large billed crow'],
    zhAliases: [],
    appearance: 'A large, all-black crow (about 50 cm) with a heavy, arched bill and a steep forehead.',
    habitat: 'Hillsides, woodland, villages and the city.',
    diet: 'Almost anything: scraps, carrion, insects, small animals, eggs and fruit.',
    behaviour: 'Intelligent and adaptable, often seen in pairs, with loud cawing calls.',
  },
  'Ardea alba': {
    aliases: ['great white egret'],
    zhAliases: [],
    appearance:
      'A large, all-white heron (about 90 cm) with a long, kinked neck and long dark legs. Its bill is yellow for much of the year.',
    habitat: 'Fishponds, marshes, mudflats and other wetlands.',
    diet: 'Fish, frogs and other water creatures.',
    behaviour: 'Hunts by standing still or wading slowly, then striking fast. It nests in colonies with other herons.',
  },
  'Pterorhinus perspicillatus': {
    aliases: ['laughingthrush', 'laughing thrush', 'masked laughing thrush'],
    zhAliases: [],
    appearance:
      'A large, plain brown bird (about 30 cm) with a black "mask" across the eyes and forehead, and a rusty patch under the tail.',
    habitat: 'Shrubby areas, parks, gardens and woodland edges.',
    diet: 'Insects and other invertebrates, seeds and fruit, often found on the ground.',
    behaviour: 'Lives in noisy groups that hop on the ground and through bushes, keeping in touch with loud chattering calls.',
  },
  'Phylloscopus inornatus': {
    aliases: ['yellow browed warbler'],
    zhAliases: [],
    appearance:
      'A tiny leaf warbler (about 10 cm), olive-green above, with a long pale eyebrow stripe and two pale bars on each wing.',
    habitat: 'Woodland, parks and gardens with trees.',
    diet: 'Small insects and spiders picked from leaves.',
    behaviour:
      'Restless, constantly flitting through the foliage. It often joins mixed flocks and is easiest to find by its high, rising call.',
  },
  'Eudynamys scolopaceus': {
    aliases: ['koel', 'common koel'],
    zhAliases: [],
    appearance:
      'A large, long-tailed cuckoo (about 40 cm) with red eyes. Males are glossy black; females are brown with white spots and bars.',
    habitat: 'Parks, gardens and woodland with fruiting trees, including in the city.',
    diet: 'Mainly fruit, such as figs.',
    behaviour:
      'Famous for its loud, rising "ko-el" calls, often heard before dawn. It lays its eggs in the nests of crows and other birds, which raise its young.',
  },
  'Ardeola bacchus': {
    aliases: ['pond heron', 'chinese pond heron'],
    zhAliases: [],
    appearance:
      'A stocky heron (about 45 cm) that looks brown and streaky when standing but shows bright white wings in flight. In the breeding season it has a chestnut head and neck.',
    habitat: 'Fishponds, streams, marshes and even park ponds.',
    diet: 'Fish, frogs, insects and other small animals.',
    behaviour: 'Often stands still at the water’s edge waiting for prey, and usually feeds alone.',
  },
  'Hirundo rustica': {
    aliases: ['swallow'],
    zhAliases: [],
    appearance: 'A glossy blue-black swallow (about 18 cm) with a red throat, pale underparts and long tail streamers.',
    habitat: 'Open areas, farmland, wetlands and villages. It nests on buildings.',
    diet: 'Flying insects, caught in the air.',
    behaviour: 'Flies low and fast over fields and water, and builds a cup-shaped mud nest under eaves and in buildings.',
  },
  'Ardea cinerea': {
    aliases: [],
    zhAliases: [],
    appearance:
      'A very large heron (about 95 cm), grey above with a white head and neck, a black stripe over the eye and a dagger-like yellowish bill.',
    habitat: 'Fishponds, mudflats, mangroves and reservoirs.',
    diet: 'Mainly fish, plus frogs and other animals.',
    behaviour: 'Stands motionless for long periods before striking, and flies slowly with its neck tucked in.',
  },
  'Urocissa erythroryncha': {
    aliases: ['blue magpie', 'red billed blue magpie'],
    zhAliases: [],
    appearance:
      'A striking magpie (about 65 cm, much of it tail) with a black head, red bill and legs, and a blue back and long blue tail tipped with white.',
    habitat: 'Woodland, wooded hillsides and well-wooded parks.',
    diet: 'Insects, small animals, eggs, fruit and scraps.',
    behaviour: 'Travels in noisy family groups, gliding from tree to tree with its long tail streaming behind.',
  },
  'Amaurornis phoenicurus': {
    aliases: ['waterhen', 'white breasted waterhen'],
    zhAliases: [],
    appearance:
      'A dark grey, chicken-like waterbird (about 30 cm) with a white face and breast and a rusty patch under the tail.',
    habitat: 'Marshes, streams, ponds and wet vegetation, sometimes in parks.',
    diet: 'Insects, worms, snails, seeds and plants.',
    behaviour: 'Walks with a jerky, tail-flicking gait. It is often noisy at dawn and dusk, with loud, repeated croaking calls.',
  },
  'Columba livia': {
    aliases: ['pigeon', 'feral pigeon', 'rock dove', 'city pigeon'],
    zhAliases: ['鸽子', '白鸽'],
    appearance:
      'The familiar city pigeon (about 33 cm). It is usually grey with two dark wing bars and a shiny green-and-purple neck, but colours vary a lot.',
    habitat: 'Towns and cities, especially around buildings, squares and piers.',
    diet: 'Seeds, grain and food scraps.',
    behaviour: 'Lives in flocks and nests on building ledges. City pigeons are descended from domestic pigeons that went wild.',
  },
  'Centropus sinensis': {
    aliases: ['coucal', 'crow pheasant'],
    zhAliases: [],
    appearance: 'A large, crow-sized bird (about 50 cm) with a black body, chestnut wings, a long tail and red eyes.',
    habitat: 'Scrub, grassland, reedbeds, farmland and woodland edges.',
    diet: 'Insects, snails, frogs, lizards, eggs and other small animals.',
    behaviour:
      'A ground-loving cuckoo that clambers through thick vegetation. Its deep, booming "hoop-hoop-hoop" carries far. Unlike some cuckoos, it raises its own young.',
  },
  'Prinia flaviventris': {
    aliases: ['yellow bellied prinia'],
    zhAliases: ['黄腹鹪莺'],
    appearance:
      'A small, long-tailed bird (about 13 cm) with a grey head, green back, white throat and breast, and yellow belly.',
    habitat: 'Tall grass, reedbeds and scrubby wetland edges.',
    diet: 'Small insects.',
    behaviour: 'Often sings from the top of a grass stem. When alarmed it gives a cat-like mewing call.',
  },
  'Lonchura punctulata': {
    aliases: ['scaly breasted munia', 'spotted munia', 'nutmeg mannikin'],
    zhAliases: [],
    appearance:
      'A small brown finch-like bird (about 11 cm) with a stout grey bill and dark, scale-like markings on its white breast.',
    habitat: 'Grassland, farmland, scrub and parks with seeding grasses.',
    diet: 'Grass seeds.',
    behaviour: 'Usually in small flocks that feed on seeding grasses and fly off together when disturbed.',
  },
  'Phylloscopus fuscatus': {
    aliases: [],
    zhAliases: [],
    appearance: 'A small, plain brown warbler (about 11 cm) with a whitish eyebrow stripe.',
    habitat: 'Low, dense vegetation near water: reedbeds, scrub, overgrown farmland and shrubs in parks.',
    diet: 'Small insects and spiders.',
    behaviour: 'Stays low in cover and is easiest to notice by its hard "tack" call.',
  },
  'Himantopus himantopus': {
    aliases: ['stilt'],
    zhAliases: [],
    appearance: 'A slim black-and-white wader (about 35 cm) with extremely long pink legs and a thin black bill.',
    habitat: 'Fishponds, shallow wetlands, drained ponds and mudflats.',
    diet: 'Insects, small crustaceans and other small water animals.',
    behaviour: 'Its long legs let it wade in deeper water than most waders. It calls noisily when disturbed.',
  },
  'Aethopyga christinae': {
    aliases: ['sunbird', 'fork tailed sunbird'],
    zhAliases: [],
    appearance:
      'A tiny bird (about 10 cm) with a long, curved bill. Males have a glossy green crown and tail, a dark red throat and a yellow rump; females are olive-green.',
    habitat: 'Woodland, gardens and parks with flowering trees and shrubs.',
    diet: 'Nectar from flowers, plus small insects and spiders.',
    behaviour: 'Flits quickly between flowers, sometimes hovering briefly. It is often heard before it is seen.',
  },
  'Prinia inornata': {
    aliases: [],
    zhAliases: ['纯色鹪莺'],
    appearance: 'A small, plain brown bird (about 13 cm) with a pale eyebrow stripe, buff underparts and a long, often raised tail.',
    habitat: 'Grassland, reedbeds, farmland and scrub.',
    diet: 'Small insects.',
    behaviour: 'Restless and noisy, often calling from grass stems.',
  },
  'Actitis hypoleucos': {
    aliases: [],
    zhAliases: [],
    appearance:
      'A small brown-and-white wader (about 20 cm) with a white patch curving up in front of the wing. It constantly bobs its rear end.',
    habitat: 'Rocky shores, streams, riverbanks, ponds and mudflats.',
    diet: 'Insects, small crustaceans and worms.',
    behaviour: 'Flies low over the water with stiff, flickering wingbeats, and is usually seen alone.',
  },
  'Apus nipalensis': {
    aliases: ['swift', 'little swift'],
    zhAliases: [],
    appearance: 'A small, dark swift (about 15 cm) with long, curved wings, a white rump and a short tail.',
    habitat: 'In the air over cities, hills and wetlands. It nests under building eaves and overhangs.',
    diet: 'Flying insects, caught on the wing.',
    behaviour: 'Spends almost all its time flying, often in noisy, screaming flocks.',
  },
  'Acridotheres tristis': {
    aliases: ['indian myna', 'common mynah'],
    zhAliases: [],
    appearance:
      'A brown myna (about 25 cm) with a black head, a yellow bill and a patch of bare yellow skin around the eye. White wing patches show in flight.',
    habitat: 'Urban areas, parks, farmland and open country.',
    diet: 'Insects, fruit, seeds and scraps.',
    behaviour: 'Bold and noisy, walking (rather than hopping) on the ground. It gathers in large shared roosts.',
  },
  'Halcyon smyrnensis': {
    aliases: ['white breasted kingfisher', 'smyrna kingfisher'],
    zhAliases: [],
    appearance:
      'A large kingfisher (about 28 cm) with a bright blue back, chocolate-brown head and belly, white throat and breast, and a big red bill.',
    habitat: 'Fishponds, streams, farmland and wetlands; it also hunts away from water.',
    diet: 'Fish, plus insects, frogs, lizards and other small animals.',
    behaviour: 'Sits on wires or posts watching for prey, and gives a loud, laughing call.',
  },
  'Motacilla tschutschensis': {
    aliases: ['yellow wagtail'],
    zhAliases: [],
    appearance:
      'A slim wagtail (about 18 cm) with an olive back, yellow underparts and a long tail. Head patterns vary between different forms.',
    habitat: 'Wet grassland, farmland, fishpond banks and marshes.',
    diet: 'Insects.',
    behaviour: 'Walks through grass, often near grazing animals, catching the insects they disturb. It often travels in loose flocks.',
  },
  'Alcedo atthis': {
    aliases: ['river kingfisher'],
    zhAliases: ['翠鸟'],
    appearance:
      'A small, brilliantly coloured kingfisher (about 16 cm) with a shining blue-green back, orange underparts and a long, dagger-like bill.',
    habitat: 'Streams, ponds, fishponds, mangroves and the shore.',
    diet: 'Small fish, plus some water insects and shrimps.',
    behaviour: 'Dives headfirst into water from a perch, and is often seen as a fast blue streak flying low over the water.',
  },
  'Saxicola stejnegeri': {
    aliases: ['stonechat', 'stejnegers stonechat', 'siberian stonechat'],
    zhAliases: [],
    appearance:
      'A small chat (about 13 cm). Males have a black head, a white neck patch and an orange breast; females and non-breeding birds are browner and streaked.',
    habitat: 'Open grassland, farmland, scrub and the edges of reedbeds.',
    diet: 'Insects, often caught by dropping onto the ground from a perch.',
    behaviour: 'Perches upright on the tops of bushes, posts or grass stems, flicking its wings and tail.',
  },
  'Nycticorax nycticorax': {
    aliases: ['night heron', 'black crowned night heron'],
    zhAliases: [],
    appearance:
      'A stocky, short-necked heron (about 60 cm). Adults are grey with a black crown and back and red eyes; young birds are brown with white spots.',
    habitat: 'Fishponds, streams, mangroves and park ponds.',
    diet: 'Fish, frogs, crustaceans and insects.',
    behaviour: 'Mostly active at dusk and at night, resting in trees during the day. It nests in colonies.',
  },
  'Tringa nebularia': {
    aliases: ['greenshank'],
    zhAliases: [],
    appearance:
      'A tall, greyish wader (about 32 cm) with greenish legs and a long, slightly upturned bill. It shows a white wedge up the back in flight.',
    habitat: 'Mudflats, fishponds, marshes and shallow coastal wetlands.',
    diet: 'Small fish, crustaceans, worms and insects.',
    behaviour: 'Wades actively and sometimes runs after small fish. Its call is a loud, ringing "tew-tew-tew".',
  },
  'Dicrurus macrocercus': {
    aliases: ['drongo'],
    zhAliases: [],
    appearance: 'A glossy black bird (about 28 cm) with a long, deeply forked tail.',
    habitat: 'Open country, farmland and wetland edges.',
    diet: 'Insects, often caught in mid-air.',
    behaviour: 'Perches on wires and posts, darting out after insects. It is bold enough to chase away much larger birds.',
  },
  'Corvus torquatus': {
    aliases: ['collared crow'],
    zhAliases: [],
    appearance: 'A large black crow (about 52 cm) with a broad white collar around the neck and breast.',
    habitat: 'Wetlands, coasts, farmland and fishponds.',
    diet: 'Almost anything: invertebrates, small animals, carrion, grain and scraps.',
    behaviour: 'Often in pairs or small groups feeding on the ground, and gathers at shared roosts.',
    conservationNote: 'BirdLife International assessed it as Vulnerable in 2018 (it was Near Threatened before).',
  },
  'Anthus hodgsoni': {
    aliases: ['pipit', 'olive backed pipit'],
    zhAliases: [],
    appearance:
      'A small, streaky pipit (about 15 cm) with an olive-green back, a bold pale eyebrow and a white spot and dark spot behind the eye.',
    habitat: 'Woodland, parks and wooded hillsides, where it feeds on the ground.',
    diet: 'Insects and seeds picked from the ground.',
    behaviour: 'Walks quietly on the ground under trees, pumping its tail, and flies up into a tree when disturbed.',
  },
  'Phalacrocorax carbo': {
    aliases: ['cormorant'],
    zhAliases: ['鸬鹚'],
    appearance:
      'A large, dark waterbird (about 85 cm) with a long neck and a hooked bill, and white on the face and throat.',
    habitat: 'Deep Bay, fishponds, reservoirs and the coast.',
    diet: 'Fish, caught by diving.',
    behaviour:
      'Swims low in the water and dives for fish, then often stands with its wings spread out to dry. It roosts in large groups.',
  },
  'Myophonus caeruleus': {
    aliases: ['whistling thrush', 'blue whistling thrush'],
    zhAliases: [],
    appearance:
      'A large thrush (about 32 cm) that looks black but is dark purplish-blue with small shiny spots, and has a yellow bill.',
    habitat: 'Wooded streams, ravines and rocky areas, and also around buildings and drains near woodland.',
    diet: 'Snails, insects, worms, crabs and other small animals.',
    behaviour: 'Sings a loud, whistled song, especially early in the morning, and often fans its tail.',
  },
  'Recurvirostra avosetta': {
    aliases: ['avocet'],
    zhAliases: [],
    appearance: 'An elegant black-and-white wader (about 43 cm) with long blue-grey legs and a thin, upturned bill.',
    habitat: 'Mudflats, shallow ponds and drained fishponds around Deep Bay.',
    diet: 'Small invertebrates such as shrimps, worms and insect larvae.',
    behaviour: 'Feeds by sweeping its upturned bill from side to side through shallow water, often in flocks.',
  },
  'Lanius schach': {
    aliases: ['shrike', 'rufous backed shrike'],
    zhAliases: [],
    appearance:
      'A bold shrike (about 25 cm) with a black mask, grey crown, rufous back and sides, and a long black tail. Some birds are almost entirely dark.',
    habitat: 'Open country, farmland, scrub and grassland.',
    diet: 'Large insects, lizards, small birds and other small animals.',
    behaviour: 'Perches prominently on wires or bush tops watching for prey, and sometimes stores prey on thorns.',
  },
  'Ardea coromanda': {
    aliases: ['cattle egret', 'eastern cattle egret'],
    zhAliases: [],
    appearance:
      'A small, stocky white egret (about 50 cm) with a short yellow bill. In the breeding season its head, neck and back turn orange-buff.',
    habitat: 'Farmland, wet fields, grassland and fishponds.',
    diet: 'Insects such as grasshoppers, plus frogs and other small animals.',
    behaviour: 'Often follows cattle or machinery to catch disturbed insects, and nests in colonies with other egrets.',
  },
  'Gallinula chloropus': {
    aliases: ['moorhen', 'common moorhen'],
    zhAliases: [],
    appearance:
      'A dark waterbird (about 32 cm) with a red forehead shield, a yellow-tipped red bill, a white line along its side and white under the tail.',
    habitat: 'Ponds, marshes, ditches and fishponds with plenty of vegetation.',
    diet: 'Water plants, seeds, insects and snails.',
    behaviour: 'Swims with a jerky, head-bobbing motion and flicks its tail to show the white underneath.',
  },
  'Tachybaptus ruficollis': {
    aliases: ['grebe', 'dabchick'],
    zhAliases: [],
    appearance:
      'A small, round diving bird (about 26 cm) with a short bill. In breeding plumage it has a chestnut neck and a pale yellow spot at the base of the bill.',
    habitat: 'Ponds, reservoirs, fishponds and slow rivers.',
    diet: 'Small fish, tadpoles and water insects.',
    behaviour: 'Dives often and can sink quietly out of sight. Its call is a whinnying trill.',
  },
  'Tringa glareola': {
    aliases: [],
    zhAliases: [],
    appearance:
      'A slim, medium-sized wader (about 20 cm) with a brown back speckled with white, a pale eyebrow stripe and yellowish legs.',
    habitat: 'Freshwater marshes, wet fields, fishponds and flooded grassland.',
    diet: 'Insects, small crustaceans and worms.',
    behaviour: 'Picks food from the surface while walking, and gives a high-pitched call when flushed.',
  },
  'Spatula clypeata': {
    aliases: ['shoveler', 'shoveller'],
    zhAliases: [],
    appearance:
      'A duck (about 48 cm) with a very large, spoon-shaped bill. Males have a green head, white breast and chestnut sides; females are mottled brown.',
    habitat: 'Fishponds, shallow lagoons and mudflats.',
    diet: 'Tiny animals and seeds filtered from the water.',
    behaviour: 'Sweeps its wide bill through the water to filter food, often feeding in groups.',
  },
  'Pericrocotus speciosus': {
    aliases: ['minivet'],
    zhAliases: [],
    appearance: 'A colourful, long-tailed bird (about 20 cm). Males are bright red and black; females are yellow and grey.',
    habitat: 'Woodland and well-wooded parks, usually high in the trees.',
    diet: 'Insects.',
    behaviour: 'Moves through the treetops in small groups, its bright colours standing out against the leaves.',
  },
  'Motacilla cinerea': {
    aliases: [],
    zhAliases: [],
    appearance: 'A slim wagtail (about 19 cm) with a grey back, yellow underparts and a very long tail.',
    habitat: 'Streams, drains, rivers and other wet places, in towns and woodland alike.',
    diet: 'Insects, usually caught near water.',
    behaviour: 'Constantly wags its long tail, and is often seen alone on rocks in streams.',
  },
  'Anas crecca': {
    aliases: ['teal', 'eurasian teal', 'common teal'],
    zhAliases: [],
    appearance:
      'A small duck (about 35 cm). Males have a chestnut head with a green eye patch; females are speckled brown. Both show a green patch on the wing.',
    habitat: 'Fishponds, marshes and shallow wetlands.',
    diet: 'Seeds, plants and small invertebrates.',
    behaviour: 'Fast and agile in flight, often in tight flocks. It feeds in shallow water rather than diving.',
  },
  'Gallinago gallinago': {
    aliases: ['snipe'],
    zhAliases: [],
    appearance: 'A stocky, well-camouflaged wader (about 26 cm) with a very long, straight bill and striped brown plumage.',
    habitat: 'Wet fields, marshes and the muddy edges of ponds.',
    diet: 'Worms and insect larvae, found by probing mud with its bill.',
    behaviour: 'Hides in vegetation and is usually seen when it bursts up and flies off in a zigzag.',
  },
  'Cyanoderma ruficeps': {
    aliases: ['babbler', 'rufous capped babbler'],
    zhAliases: [],
    appearance: 'A small, plain olive-brown babbler (about 12 cm) with a rufous cap and a pale yellowish throat.',
    habitat: 'Dense undergrowth in woodland and on shrubby slopes.',
    diet: 'Small insects.',
    behaviour: 'Keeps to thick cover, often in pairs or small groups. It is heard more often than seen.',
  },
  'Hemixos castanonotus': {
    aliases: [],
    zhAliases: [],
    appearance: 'A bulbul (about 21 cm) with a chestnut back and cheeks, a short dark crest, a white throat and grey wings.',
    habitat: 'Woodland and wooded hillsides.',
    diet: 'Fruit and insects.',
    behaviour: 'Usually in small groups high in the trees, and often joins mixed flocks.',
  },
  'Streptopelia decaocto': {
    aliases: ['collared dove', 'eurasian collared dove'],
    zhAliases: [],
    appearance: 'A pale greyish-buff dove (about 32 cm) with a narrow black half-collar on the back of the neck.',
    habitat: 'Farmland, villages and open country.',
    diet: 'Seeds and grain.',
    behaviour: 'Often perches on wires, and gives a repeated three-note cooing call.',
  },
  'Lonchura striata': {
    aliases: ['white rumped mannikin'],
    zhAliases: [],
    appearance: 'A small, dark brown finch-like bird (about 11 cm) with a stout grey bill, a white rump and a pale belly.',
    habitat: 'Grassland, scrub, farmland and woodland edges.',
    diet: 'Grass seeds.',
    behaviour: 'Usually in small flocks, and builds round nests from grass.',
  },
  'Platalea minor': {
    aliases: ['spoonbill', 'black faced spoonbill'],
    zhAliases: [],
    appearance:
      'A large white waterbird (about 75 cm) with a long, flat, spoon-shaped black bill and a black face. Breeding adults have a yellowish crest and breast patch.',
    habitat: 'Mudflats, shallow ponds and drained fishponds around Deep Bay, especially Mai Po Nature Reserve.',
    diet: 'Small fish and shrimps.',
    behaviour: 'Feeds by sweeping its open bill from side to side through shallow water, and often rests in groups at high tide.',
    season:
      'A winter visitor, mainly from about October to April. Our eBird-based model doesn’t cover this species yet, so there are no monthly figures.',
    where:
      'Deep Bay, especially the mudflats and ponds of Mai Po Nature Reserve. The trip planner’s model doesn’t cover this species yet.',
    conservationNote:
      'BirdLife International assessed it as Vulnerable in 2025, after it had been Endangered since at least 2008. Deep Bay in Hong Kong is one of its important wintering sites.',
  },
}
