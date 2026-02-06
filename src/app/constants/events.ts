export const EVENTS = {
  EMIT: {
    JOIN_ROOM: "join-synq",
    SEND_ICE_CANDIDATE: "send-ice-candidate",
    SEND_OFFER: "send-offer",
    SEND_ANSWER: "send-answer",
    INITIATE_MESSAGE: "initiate-message",
    COMPLETE_MESSAGE: "complete-message",
  },
  ON: {
    USER_JOINED_SYNQ: "user-joined-synq",
    WARNING: "synq-warning",
    USER_LEFT: "user-left",
    ICE_CANDIDATE_RECEIVED: "ice-candidate-received",
    RECEIVED_OFFER: "received-offer",
    RECEIVED_ANSWER: "received-answer",
    SYNQ_USERS: "synq-users",
    MESSAGE_INITATED: "message-initiated",
    MESSAGE_COMPLETED: "message-completed",
  },
};
