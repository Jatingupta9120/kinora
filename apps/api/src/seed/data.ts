/**
 * Original mock catalog for Kinora. Every title, person and synopsis here is fictional.
 */
import type { Collection } from '../schemas/collection.schema.js';
import type { Episode, Season, Title } from '../schemas/title.schema.js';

type SeedTitle = Omit<Title, 'seasons'> & { seasons?: Season[] };

const MEDIA_IDS = ['bbb', 'tos', 'bipbop'];

function makeSeasons(slug: string, counts: number[], names: string[][]): Season[] {
  return counts.map((count, s) => ({
    number: s + 1,
    episodes: Array.from({ length: count }, (_, e): Episode => ({
      id: `${slug}-s${s + 1}e${e + 1}`,
      number: e + 1,
      name: names[s]?.[e] ?? `Chapter ${e + 1}`,
      synopsis: `Season ${s + 1}, episode ${e + 1} of ${slug.replace(/-/g, ' ')}.`,
      durationMin: 38 + ((s * 7 + e * 5) % 17),
      mediaId: MEDIA_IDS[(s + e) % MEDIA_IDS.length],
    })),
  }));
}

export const TITLES: SeedTitle[] = [
  {
    slug: 'harbor-lights', name: 'Harbor Lights', kind: 'series', year: 2026, maturity: '16+', tier: 'premium',
    tagline: 'A lighthouse town keeps one secret too many.',
    synopsis: 'When the keeper of Gull Point vanishes during a storm, his estranged daughter returns to run the light and finds the town has been signalling something offshore for decades.',
    genres: ['drama', 'mystery'], cast: ['Imani Okafor', 'Teodor Lind', 'Rhea Castellanos'], directors: ['Mara Quist'],
    palette: ['#0b3954', '#e0a458'], badge: 'NEW SEASON', popularity: 98, durationMin: 46, trailerMediaId: 'tos',
    seasons: makeSeasons('harbor-lights', [6, 8], [['The Dark Lamp', 'Low Tide', 'Fog Signal', 'Breakwater', 'Salt', 'Return'], ['Two Lights', 'The Wreck', 'Ledger', 'Undertow', 'Shoal', 'Beacon', 'Ashore', 'Gull Point']]),
  },
  {
    slug: 'paper-comets', name: 'Paper Comets', kind: 'movie', year: 2025, maturity: 'all', tier: 'free',
    tagline: 'Two kids, one cardboard rocket, the whole summer.',
    synopsis: 'Siblings build a backyard observatory to win the county science fair and accidentally spot a real comet nobody else has catalogued.',
    genres: ['family', 'comedy'], cast: ['Niko Barros', 'Ada Feng', 'Gus Whitlow'], directors: ['Lena Oduya'],
    palette: ['#3d348b', '#f7b801'], badge: 'FREE', popularity: 81, durationMin: 94, mediaId: 'bbb', trailerMediaId: 'bbb',
  },
  {
    slug: 'iron-meridian', name: 'Iron Meridian', kind: 'movie', year: 2026, maturity: '16+', tier: 'premium',
    tagline: 'The last train across the border leaves at midnight.',
    synopsis: 'A retired rail engineer is pulled into one final run when a sealed freight car turns out to hold the only witness to a coup.',
    genres: ['action', 'thriller'], cast: ['Dario Velez', 'Sun-hee Park', 'Callum Reyes'], directors: ['Jonah Mbeki'],
    palette: ['#1b1b1e', '#d64933'], badge: 'NEW MOVIE', popularity: 95, durationMin: 118, mediaId: 'tos', trailerMediaId: 'tos',
  },
  {
    slug: 'quiet-orbit', name: 'Quiet Orbit', kind: 'series', year: 2025, maturity: '13+', tier: 'premium',
    tagline: 'Six crew. One station. No reply from Earth.',
    synopsis: 'Aboard a research station at the edge of the solar system, the crew wake from hibernation to find the ground team has stopped answering — and the station logs say they never slept.',
    genres: ['science-fiction', 'mystery'], cast: ['Yara Haddad', 'Ollie Brandt', 'Mei Takeda'], directors: ['Pell Anand'],
    palette: ['#0d1b2a', '#76c7c0'], badge: 'MOST LIKED', popularity: 92, durationMin: 52, trailerMediaId: 'tos',
    seasons: makeSeasons('quiet-orbit', [8], [['Wake', 'Silence', 'Drift', 'Telemetry', 'Mirror', 'Burn', 'Signal', 'Home']]),
  },
  {
    slug: 'saffron-street', name: 'Saffron Street', kind: 'series', year: 2024, maturity: '7+', tier: 'free',
    tagline: 'One street, twelve kitchens, endless rivalries.',
    synopsis: 'A food-truck newcomer shakes up a neighbourhood of family restaurants in a warm comedy about recipes, rent and second chances.',
    genres: ['comedy', 'drama'], cast: ['Priya Nair', 'Tomasz Wolny', 'Bea Achebe'], directors: ['Ravi Menon'],
    palette: ['#9c3d00', '#ffd166'], badge: 'FREE', popularity: 77, durationMin: 28, trailerMediaId: 'bipbop',
    seasons: makeSeasons('saffron-street', [6, 6], []),
  },
  {
    slug: 'the-glass-archive', name: 'The Glass Archive', kind: 'movie', year: 2023, maturity: '13+', tier: 'premium',
    tagline: 'Every memory is evidence.',
    synopsis: 'A forensic archivist who can restore damaged recordings uncovers a tampered interview that rewrites a decades-old trial.',
    genres: ['thriller', 'drama'], cast: ['Helena Voss', 'Marcus Idowu'], directors: ['Clara Benn'],
    palette: ['#22223b', '#c9ada7'], popularity: 70, durationMin: 109, mediaId: 'tos', trailerMediaId: 'tos',
  },
  {
    slug: 'moss-and-ember', name: 'Moss & Ember', kind: 'series', year: 2025, maturity: 'all', tier: 'free',
    tagline: 'A dragon who is scared of fire.',
    synopsis: 'An anxious young dragon and a fearless hedgehog run the forest\'s lost-and-found in this gentle animated series for the whole family.',
    genres: ['kids', 'family', 'animation'], cast: ['Voices: Juno Park', 'Elio Martins'], directors: ['Sam Ochoa'],
    palette: ['#2d6a4f', '#f4a261'], badge: 'KIDS', popularity: 74, durationMin: 12, trailerMediaId: 'bbb',
    seasons: makeSeasons('moss-and-ember', [10], []),
  },
  {
    slug: 'northbound', name: 'Northbound', kind: 'movie', year: 2022, maturity: '13+', tier: 'free',
    tagline: 'Two thousand kilometres. One borrowed van.',
    synopsis: 'Strangers sharing a rideshare to the Arctic Circle discover they\'re each running from the same small town.',
    genres: ['drama', 'romance'], cast: ['Freya Holm', 'Andre Kova'], directors: ['Tove Ek'],
    palette: ['#14213d', '#a8dadc'], popularity: 63, durationMin: 101, mediaId: 'bbb', trailerMediaId: 'bbb',
  },
  {
    slug: 'velvet-heist', name: 'Velvet Heist', kind: 'movie', year: 2026, maturity: '16+', tier: 'premium',
    tagline: 'Steal the song before the encore.',
    synopsis: 'A washed-up session musician assembles a crew to steal back the master tapes a record label buried for forty years.',
    genres: ['comedy', 'action'], cast: ['Lou Ferrante', 'Amara Diallo', 'Kenji Mori'], directors: ['Bex Hollis'],
    palette: ['#590d22', '#ff4d6d'], badge: 'NEW MOVIE', popularity: 89, durationMin: 112, mediaId: 'tos', trailerMediaId: 'tos',
  },
  {
    slug: 'deep-field', name: 'Deep Field', kind: 'series', year: 2023, maturity: '7+', tier: 'free',
    tagline: 'The ocean has more stories than the stars.',
    synopsis: 'A documentary series following marine researchers as they map the deepest unexplored trenches on Earth.',
    genres: ['documentary'], cast: ['Narrated by Ruth Achterberg'], directors: ['Owen Pike'],
    palette: ['#03045e', '#00b4d8'], popularity: 58, durationMin: 50, trailerMediaId: 'bipbop',
    seasons: makeSeasons('deep-field', [5], [['Abyss', 'Vents', 'Glow', 'Pressure', 'Surface']]),
  },
  {
    slug: 'hollow-pines', name: 'Hollow Pines', kind: 'movie', year: 2024, maturity: '18+', tier: 'premium',
    tagline: 'The camp closed in 1987. Someone kept the lights on.',
    synopsis: 'Five former counsellors return to a shuttered summer camp for a reunion and realise the camp never stopped running.',
    genres: ['horror', 'thriller'], cast: ['Gemma Rook', 'Theo Adair', 'Nia Bello'], directors: ['Felix Ward'],
    palette: ['#081c15', '#95d5b2'], badge: 'MOST REWATCHED', popularity: 84, durationMin: 97, mediaId: 'tos', trailerMediaId: 'tos',
  },
  {
    slug: 'kite-season', name: 'Kite Season', kind: 'movie', year: 2021, maturity: 'all', tier: 'free',
    tagline: 'A grandfather, a granddaughter and the windiest week of the year.',
    synopsis: 'A girl spends the festival week learning to build fighter kites from her grandfather, and learns why he stopped flying them.',
    genres: ['family', 'drama'], cast: ['Arjun Rao', 'Tara Rao'], directors: ['Meera Sethi'],
    palette: ['#ef476f', '#ffd166'], popularity: 55, durationMin: 88, mediaId: 'bbb', trailerMediaId: 'bbb',
  },
  {
    slug: 'circuit-ronin', name: 'Circuit Ronin', kind: 'series', year: 2026, maturity: '13+', tier: 'premium',
    tagline: 'A masterless android with a borrowed sword.',
    synopsis: 'In a flooded megacity, a decommissioned security android takes freelance jobs to pay for the memory chip that holds its old owner\'s last words.',
    genres: ['anime', 'science-fiction', 'action'], cast: ['Voices: Ren Aoki', 'Kaya Brooks'], directors: ['Hiro Tanabe'],
    palette: ['#240046', '#ff9e00'], badge: 'NEW SERIES', popularity: 91, durationMin: 24, trailerMediaId: 'tos',
    seasons: makeSeasons('circuit-ronin', [12], []),
  },
  {
    slug: 'the-long-table', name: 'The Long Table', kind: 'series', year: 2022, maturity: '7+', tier: 'free',
    tagline: 'Grandma\'s recipes, rebuilt from memory.',
    synopsis: 'A chef travels to the villages of her grandparents to recreate dishes that were never written down.',
    genres: ['documentary', 'food'], cast: ['Hosted by Lucia Ferraz'], directors: ['Tom Akers'],
    palette: ['#6a040f', '#e85d04'], popularity: 49, durationMin: 32, trailerMediaId: 'bipbop',
    seasons: makeSeasons('the-long-table', [8], []),
  },
  {
    slug: 'second-serve', name: 'Second Serve', kind: 'movie', year: 2025, maturity: '7+', tier: 'premium',
    tagline: 'She retired at 24. She\'s back at 41.',
    synopsis: 'A former tennis prodigy returns to the tour as a wildcard, facing the rival who ended her career.',
    genres: ['sports', 'drama'], cast: ['Noor Haddad', 'Ingrid Sole'], directors: ['Pia Castell'],
    palette: ['#004b23', '#ccff33'], popularity: 73, durationMin: 115, mediaId: 'bbb', trailerMediaId: 'bbb',
  },
  {
    slug: 'midnight-ledger', name: 'Midnight Ledger', kind: 'series', year: 2024, maturity: '16+', tier: 'premium',
    tagline: 'Follow the money. It follows you back.',
    synopsis: 'A junior auditor at a family-owned bank discovers the books balance perfectly — which is exactly the problem.',
    genres: ['thriller', 'drama', 'crime'], cast: ['Owen Hart', 'Selin Kaya', 'Bruno Alves'], directors: ['Ines Carvalho'],
    palette: ['#10002b', '#7b2cbf'], badge: 'MOST LIKED', popularity: 88, durationMin: 49, trailerMediaId: 'tos',
    seasons: makeSeasons('midnight-ledger', [8, 8], []),
  },
  {
    slug: 'sunday-league', name: 'Sunday League', kind: 'series', year: 2023, maturity: '7+', tier: 'free',
    tagline: 'The worst team in the county. The best team in town.',
    synopsis: 'A mockumentary following an amateur football club through a season of mud, misfortune and one miraculous cup run.',
    genres: ['comedy', 'sports'], cast: ['Dev Patil', 'Shona McRae', 'Kofi Mensah'], directors: ['Harriet Lowe'],
    palette: ['#1d3557', '#e63946'], popularity: 66, durationMin: 25, trailerMediaId: 'bipbop',
    seasons: makeSeasons('sunday-league', [6, 6, 6], []),
  },
  {
    slug: 'atlas-of-ash', name: 'Atlas of Ash', kind: 'movie', year: 2026, maturity: '13+', tier: 'premium',
    tagline: 'The map was drawn after the world ended.',
    synopsis: 'A cartographer and a courier cross a volcanic wasteland to deliver the only accurate map of the new coastline.',
    genres: ['science-fiction', 'action', 'fantasy'], cast: ['Rafe Dunmore', 'Zola Achieng'], directors: ['Kit Moreau'],
    palette: ['#370617', '#f48c06'], badge: 'NEW MOVIE', popularity: 86, durationMin: 126, mediaId: 'tos', trailerMediaId: 'tos',
  },
  {
    slug: 'letters-to-juniper', name: 'Letters to Juniper', kind: 'movie', year: 2020, maturity: '13+', tier: 'free',
    tagline: 'Some letters arrive thirty years late.',
    synopsis: 'A postal worker finds a sack of undelivered love letters and sets out to deliver them, one by one.',
    genres: ['romance', 'drama'], cast: ['Clara Wynn', 'Elias Brandt'], directors: ['June Okoro'],
    palette: ['#5f0f40', '#fb8b24'], popularity: 61, durationMin: 104, mediaId: 'bbb', trailerMediaId: 'bbb',
  },
  {
    slug: 'tiny-titans', name: 'Tiny Titans of the Garden', kind: 'series', year: 2024, maturity: 'all', tier: 'free',
    tagline: 'Big adventures, very small heroes.',
    synopsis: 'Macro-photography nature series for kids, following ants, beetles and bees through a single summer garden.',
    genres: ['kids', 'documentary'], cast: ['Narrated by Pip Llewellyn'], directors: ['Ana Gil'],
    palette: ['#386641', '#a7c957'], popularity: 52, durationMin: 15, trailerMediaId: 'bbb',
    seasons: makeSeasons('tiny-titans', [8], []),
  },
  {
    slug: 'the-understudy', name: 'The Understudy', kind: 'movie', year: 2023, maturity: '16+', tier: 'premium',
    tagline: 'She knows every line. Including the lead\'s.',
    synopsis: 'When a star vanishes days before opening night, her understudy steps in — and begins receiving the star\'s threatening notes.',
    genres: ['thriller', 'mystery'], cast: ['Vera Okonkwo', 'Liam Castell'], directors: ['Odile Fournier'],
    palette: ['#2b2d42', '#ef233c'], popularity: 69, durationMin: 99, mediaId: 'tos', trailerMediaId: 'tos',
  },
  {
    slug: 'starling-academy', name: 'Starling Academy', kind: 'series', year: 2025, maturity: '13+', tier: 'premium',
    tagline: 'Magic is easy. Homework is hard.',
    synopsis: 'A scholarship student at a school for weather-witches discovers she can do something no one has done in a century: make it stop raining.',
    genres: ['fantasy', 'family'], cast: ['Isla Moreno', 'Benji Adeyemi', 'Cora Lisle'], directors: ['Wren Sato'],
    palette: ['#3a0ca3', '#4cc9f0'], badge: 'TRENDING', popularity: 90, durationMin: 41, trailerMediaId: 'bbb',
    seasons: makeSeasons('starling-academy', [8, 4], []),
  },
  {
    slug: 'cold-open', name: 'Cold Open', kind: 'series', year: 2026, maturity: '16+', tier: 'free',
    tagline: 'Live comedy. Nothing goes to plan.',
    synopsis: 'Behind the scenes of a struggling late-night sketch show during its final, chaotic season.',
    genres: ['comedy'], cast: ['Max Delacroix', 'Tanvi Shah', 'Ruby Okoye'], directors: ['Ellis Grant'],
    palette: ['#003049', '#fcbf49'], badge: 'NEW SERIES', popularity: 79, durationMin: 27, trailerMediaId: 'bipbop',
    seasons: makeSeasons('cold-open', [10], []),
  },
  {
    slug: 'granite', name: 'Granite', kind: 'movie', year: 2024, maturity: '18+', tier: 'premium',
    tagline: 'The quarry keeps what it takes.',
    synopsis: 'A quarry foreman covers up an accident, and the town that depends on the quarry helps him do it.',
    genres: ['crime', 'drama', 'thriller'], cast: ['Hal Brennan', 'Moira Tate'], directors: ['Sid Calder'],
    palette: ['#212529', '#adb5bd'], popularity: 64, durationMin: 121, mediaId: 'tos', trailerMediaId: 'tos',
  },
  {
    slug: 'fable-of-the-fox', name: 'Fable of the Fox', kind: 'movie', year: 2022, maturity: 'all', tier: 'free',
    tagline: 'The cleverest fox in the valley meets her match.',
    synopsis: 'A hand-drawn animated adventure about a fox who must outwit a winter that arrives a month too early.',
    genres: ['kids', 'animation', 'family'], cast: ['Voices: Olu Jacobs', 'Mina Lee'], directors: ['Bram Visser'],
    palette: ['#bc3908', '#f6aa1c'], popularity: 71, durationMin: 82, mediaId: 'bbb', trailerMediaId: 'bbb',
  },
  {
    slug: 'signal-and-noise', name: 'Signal & Noise', kind: 'movie', year: 2025, maturity: '13+', tier: 'free',
    tagline: 'How a garage radio club caught a satellite.',
    synopsis: 'Documentary about a group of teenagers who tracked and recovered a decommissioned weather satellite.',
    genres: ['documentary', 'science-fiction'], cast: ['Featuring the Brightwater Radio Club'], directors: ['Lea Novak'],
    palette: ['#001219', '#0a9396'], popularity: 47, durationMin: 86, mediaId: 'bipbop', trailerMediaId: 'bipbop',
  },
];

/** Rails per page, mirroring the hero + rails + top-10 storefront pattern. */
export const COLLECTIONS: Collection[] = [
  { slug: 'featured', name: 'Featured', style: 'hero', pages: ['home'], order: 0,
    titleSlugs: ['harbor-lights', 'iron-meridian', 'circuit-ronin', 'paper-comets', 'velvet-heist'] },
  { slug: 'top-10', name: 'Top 10 on Kinora this week', style: 'top10', pages: ['home'], order: 1,
    titleSlugs: ['harbor-lights', 'iron-meridian', 'quiet-orbit', 'circuit-ronin', 'starling-academy', 'velvet-heist', 'midnight-ledger', 'atlas-of-ash', 'hollow-pines', 'paper-comets'] },
  { slug: 'free-to-watch', name: 'Free to watch', style: 'rail', pages: ['home', 'free'], order: 2,
    titleSlugs: ['paper-comets', 'saffron-street', 'cold-open', 'northbound', 'moss-and-ember', 'sunday-league', 'kite-season', 'letters-to-juniper', 'deep-field', 'signal-and-noise'] },
  { slug: 'new-releases', name: 'New releases', style: 'rail', pages: ['home', 'movies', 'tv'], order: 3,
    titleSlugs: ['iron-meridian', 'velvet-heist', 'atlas-of-ash', 'circuit-ronin', 'cold-open', 'harbor-lights', 'second-serve', 'starling-academy'] },
  { slug: 'binge-worthy', name: 'Binge-worthy series', style: 'rail', pages: ['home', 'tv'], order: 4,
    titleSlugs: ['midnight-ledger', 'quiet-orbit', 'harbor-lights', 'starling-academy', 'sunday-league', 'saffron-street', 'circuit-ronin'] },
  { slug: 'edge-of-your-seat', name: 'Edge-of-your-seat thrillers', style: 'rail', pages: ['home', 'movies'], order: 5,
    titleSlugs: ['iron-meridian', 'the-glass-archive', 'hollow-pines', 'the-understudy', 'granite', 'midnight-ledger'] },
  { slug: 'for-the-family', name: 'For the whole family', style: 'rail', pages: ['home', 'kids'], order: 6,
    titleSlugs: ['moss-and-ember', 'fable-of-the-fox', 'paper-comets', 'tiny-titans', 'kite-season', 'starling-academy'] },
  { slug: 'true-stories', name: 'Documentaries', style: 'rail', pages: ['home'], order: 7,
    titleSlugs: ['deep-field', 'the-long-table', 'signal-and-noise', 'tiny-titans'] },
];

export const GENRES: { slug: string; name: string }[] = [
  { slug: 'action', name: 'Action' }, { slug: 'anime', name: 'Anime' }, { slug: 'animation', name: 'Animation' },
  { slug: 'comedy', name: 'Comedy' }, { slug: 'crime', name: 'Crime' }, { slug: 'documentary', name: 'Documentary' },
  { slug: 'drama', name: 'Drama' }, { slug: 'family', name: 'Family' }, { slug: 'fantasy', name: 'Fantasy' },
  { slug: 'food', name: 'Food' }, { slug: 'horror', name: 'Horror' }, { slug: 'kids', name: 'Kids' },
  { slug: 'mystery', name: 'Mystery' }, { slug: 'romance', name: 'Romance' },
  { slug: 'science-fiction', name: 'Science fiction' }, { slug: 'sports', name: 'Sports' }, { slug: 'thriller', name: 'Thriller' },
];
