export const BASE_URI =
  process.env.NEXT_PUBLIC_BASE_URI || "http://localhost:3000";
export const API_URI =
  process.env.NEXT_PUBLIC_API_URI || "http://localhost:4717";

export const config: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:global.turn.twilio.com:3478?transport=udp",
      username: "your-twilio-username",
      credential: "your-twilio-credential",
    },
    {
      urls: "turn:global.turn.twilio.com:3478?transport=tcp",
      username: "your-twilio-username",
      credential: "your-twilio-credential",
    },
    {
      urls: "turn:global.turn.twilio.com:443?transport=tcp",
      username: "your-twilio-username",
      credential: "your-twilio-credential",
    },
  ],
  iceTransportPolicy: "all",
  iceCandidatePoolSize: 10,
};
