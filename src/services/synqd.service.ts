const BASE_URI = process.env.NEXT_PUBLIC_API_URI;

interface Synq {
  message: string;
  data: Data;
}

interface Data {
  id: string;
  duration: number;
  createdAt: string;
  shareCode: string;
}

export const createRoom = async (): Promise<Synq> => {
  const res = await fetch(`${BASE_URI}/synq`, { method: "POST" });

  return res.json();
};
export const getStars = async (): Promise<any> => {
  const res = await fetch(`https://api.github.com/repos/cermuel/synqd`, {
    method: "GET",
  });
  return res.json();
};
