// ============================================================
// MOCK DATA: sample species for building the interface.
// These are real Hong Kong birds, but the descriptions are short
// summaries for testing the layout, not a checked dataset.
// Verify against a trusted source (e.g. the Hong Kong Bird
// Watching Society) before using any of it in the project.
// Only services/ should import this file.
// ============================================================

export const MOCK_SPECIES = [
  {
    id: 'black-faced-spoonbill',
    commonName: 'Black-faced Spoonbill',
    scientificName: 'Platalea minor',
    habitat: 'Coastal wetlands and mudflats',
    season: 'Mainly winter',
    conservation: 'Vulnerable (IUCN Red List, 2025; Endangered until then)',
  },
  {
    id: 'little-egret',
    commonName: 'Little Egret',
    scientificName: 'Egretta garzetta',
    habitat: 'Wetlands, fishponds and shores',
    season: 'All year',
    conservation: 'Least Concern (IUCN Red List)',
  },
  {
    id: 'oriental-magpie-robin',
    commonName: 'Oriental Magpie-Robin',
    scientificName: 'Copsychus saularis',
    habitat: 'Parks, gardens and woodland edges',
    season: 'All year',
    conservation: 'Least Concern (IUCN Red List)',
  },
  {
    id: 'red-whiskered-bulbul',
    commonName: 'Red-whiskered Bulbul',
    scientificName: 'Pycnonotus jocosus',
    habitat: 'Parks, gardens and shrubland',
    season: 'All year',
    conservation: 'Least Concern (IUCN Red List)',
  },
  {
    id: 'common-kingfisher',
    commonName: 'Common Kingfisher',
    scientificName: 'Alcedo atthis',
    habitat: 'Streams, ponds and coastal wetlands',
    season: 'Mainly autumn to spring',
    conservation: 'Least Concern (IUCN Red List)',
  },
]
