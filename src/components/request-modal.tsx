import { generateCompactName } from "@/utils/helpers";

const RequestModal = ({
  handleMessageRequest,
  messageRequest,
}: {
  handleMessageRequest: (status: "approved" | "rejected") => void;
  messageRequest: {
    sender: string;
    message: any;
  };
}) => {
  return (
    <div className="fixed top-1/2 bg-white/80 backdrop-blur-lg border border-gray-200 flex flex-col rounded-2xl items-center justify-center py-4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-sm:max-w-[80%] max-w-sm px-4">
      <img
        src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${generateCompactName(messageRequest.sender)}`}
        width={50}
        height={50}
        className="rounded-full"
        alt={generateCompactName(messageRequest.sender)}
      />

      <h3 className="text-sm font-semibold text-[#222]">
        {generateCompactName(messageRequest.sender)}
      </h3>
      <p className="text-xs text-[#444] font-medium mt-1 mb-4 ">
        would like to share a{" "}
        {typeof messageRequest?.message === "string" ? "message" : "file"}
      </p>

      <div className="flex w-full gap-2">
        <button
          onClick={() => handleMessageRequest("rejected")}
          className="flex-1 py-2 text-sm font-semibold bg-[#EC0000AA]  cursor-pointer text-white rounded-md"
        >
          Reject
        </button>
        <button
          onClick={() => handleMessageRequest("approved")}
          className="flex-1 py-2 text-sm font-semibold bg-[#C79101] cursor-pointer text-black rounded-md"
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default RequestModal;
