import { MessageRequest } from "@/types/context";
import { generateCompactName } from "@/utils/helpers";
import { FaFile, FaFolder, FaImage, FaVideo } from "react-icons/fa";
import { MdMessage } from "react-icons/md";

const RequestModal = ({
  handleMessageRequest,
  messageRequest,
}: {
  handleMessageRequest: (status: "approved" | "rejected") => void;
  messageRequest: MessageRequest;
}) => {
  const message = messageRequest.message;
  const isText = message.type === "text";
  const isFolder = message.type === "folder";

  const getFileInfo = () => {
    if (isText) {
      return {
        icon: <MdMessage className="w-8 h-8 text-blue-500" />,
        title: "Message",
        description:
          message.data?.substring(0, 50) +
          (message.data && message.data.length > 50 ? "..." : ""),
      };
    }

    if (isFolder) {
      const folderMeta = message.metadata as any;
      return {
        icon: <FaFolder className="w-8 h-8 text-yellow-500" />,
        title: folderMeta.name,
        description: `${folderMeta.fileCount} files • ${formatFileSize(folderMeta.totalSize)}`,
      };
    }

    const fileMeta = message.metadata as any;
    const icon =
      message.type === "image" ? (
        <FaImage className="w-8 h-8 text-green-500" />
      ) : message.type === "video" ? (
        <FaVideo className="w-8 h-8 text-purple-500" />
      ) : (
        <FaFile className="w-8 h-8 text-gray-500" />
      );

    return {
      icon,
      title: fileMeta.name,
      description: formatFileSize(fileMeta.size),
      preview: message.preview || fileMeta.preview,
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const fileInfo = getFileInfo();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-lg border border-gray-200 flex flex-col rounded-2xl items-center justify-center py-6 w-full max-w-sm px-4 shadow-xl">
        <img
          src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${generateCompactName(messageRequest.sender)}`}
          width={50}
          height={50}
          className="rounded-full"
          alt={generateCompactName(messageRequest.sender)}
        />
        <h3 className="text-sm font-semibold text-[#222] mt-2">
          {generateCompactName(messageRequest.sender)}
        </h3>
        <p className="text-xs text-[#666] font-medium mt-1">
          wants to share{" "}
          {isText ? "a message" : isFolder ? "a folder" : "a file"}
        </p>

        <div className="w-full rounded-xl p-4  border border-gray-200">
          {fileInfo.preview ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={fileInfo.preview}
                alt="preview"
                className="max-h-32 rounded-lg object-contain"
              />
              <div className="text-center">
                <p className="text-sm font-semibold text-[#222] truncate max-w-full">
                  {fileInfo.title}
                </p>
                <p className="text-xs text-[#666]">{fileInfo.description}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="shrink-0">{fileInfo.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#222] truncate">
                  {fileInfo.title}
                </p>
                <p className="text-xs text-[#666]">{fileInfo.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex w-full gap-2">
          <button
            onClick={() => handleMessageRequest("rejected")}
            className="flex-1 py-2.5 text-sm font-semibold bg-[#EC0000] hover:bg-[#D00000] cursor-pointer text-white rounded-lg transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => handleMessageRequest("approved")}
            className="flex-1 py-2.5 text-sm font-semibold bg-[#C79101] hover:bg-[#B08001] cursor-pointer text-black rounded-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;
