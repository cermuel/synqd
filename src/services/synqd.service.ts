const BASE_URI = "http://localhost:4717";

export const createRoom = async () => {
  const res = await fetch(`${BASE_URI}/synq`, { method: "POST" });

  console.log({ res });
  return res.json();
};

export const checkRoomStatus = async ()=> {
    
}
