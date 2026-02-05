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

export const generatePreview = async (
  file: File,
): Promise<string | undefined> => {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return undefined;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    if (file.type.startsWith("image/")) {
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        video.currentTime = 1;
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = (200 * video.videoHeight) / video.videoWidth;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      reader.onload = (e) => {
        video.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  });
};

export const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// utils/roomCode.ts

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

const roomCodeMap = new Map<string, string>();
const uuidToCodeMap = new Map<string, string>();

function generateHash(uuid: string): string {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

export function uuidToShareCode(uuid: string): string {
  if (uuidToCodeMap.has(uuid)) {
    return uuidToCodeMap.get(uuid)!;
  }

  const hash = generateHash(uuid);

  let code = "";

  for (let i = 0; i < 3; i++) {
    const index = hash.charCodeAt(i % hash.length) % 24;
    code += ALPHABET[index];
  }

  for (let i = 3; i < 6; i++) {
    const index = hash.charCodeAt(i % hash.length) % ALPHABET.length;
    code += ALPHABET[index];
  }

  roomCodeMap.set(code, uuid);
  uuidToCodeMap.set(uuid, code);

  return code;
}

export function shareCodeToUuid(code: string): string | null {
  const normalizedCode = code.toUpperCase().replace(/-/g, "").trim();
  return roomCodeMap.get(normalizedCode) || null;
}

export function isValidShareCode(code: string): boolean {
  const normalized = code.toUpperCase().replace(/-/g, "");
  const pattern = /^[A-Z]{3}[A-Z0-9]{3}$/;
  return pattern.test(normalized);
}

export function formatShareCode(code: string): string {
  const normalized = code.toUpperCase().replace(/-/g, "");
  if (normalized.length !== 6) return code;
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}
