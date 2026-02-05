const prefixes = [
  "Nova",
  "Echo",
  "Flux",
  "Neon",
  "Void",
  "Zen",
  "Aero",
  "Luna",
  "Byte",
  "Pixel",
  "Cosmo",
  "Drift",
  "Vibe",
  "Bolt",
  "Core",
  "Glide",
  "Spark",
  "Ghost",
  "Chill",
  "Hyper",
  "Rapid",
  "Swift",
  "Prime",
  "Solar",
  "Turbo",
  "Ultra",
  "Alpha",
  "Omega",
  "Infer",
  "Frost",
  "Storm",
  "Shadow",
  "Pulse",
  "Orbit",
];

const animals = [
  "Fox",
  "Wolf",
  "Owl",
  "Hawk",
  "Lynx",
  "Bear",
  "Crow",
  "Rex",
  "Cat",
  "Dog",
  "Bat",
  "Ram",
  "Boar",
  "Bull",
  "Koi",
  "Yak",
  "Eel",
  "Ant",
  "Bee",
  "Elk",
  "Cod",
  "Hen",
  "Pig",
  "Ape",
  "Doe",
  "Rat",
  "Cub",
  "Ox",
  "Jay",
  "Pug",
  "Emu",
  "Ibis",
  "Mole",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function generateCompactName(id: string): string {
  const hash = hashString(id);

  const prefix = prefixes[hash % prefixes.length];
  const animal = animals[(hash >>> 6) % animals.length];

  return `${prefix}${animal}`;
}
