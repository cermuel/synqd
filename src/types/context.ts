export type MessageType = "text" | "image" | "video" | "file" | "folder";

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

export interface FolderMetadata {
  name: string;
  fileCount: number;
  totalSize: number;
  files: FileMetadata[];
}

export interface TransferMessage {
  id: string;
  type: MessageType;
  metadata: FileMetadata | FolderMetadata | null;
  data?: string;
  preview?: string;
}

export interface MessageRequest {
  sender: string;
  message: TransferMessage;
}

export interface ChunkMessage {
  type: "metadata" | "chunk" | "complete" | "ack";
  transferId: string;
  chunkIndex?: number;
  totalChunks?: number;
  data?: ArrayBuffer | FileMetadata;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface ActiveTransfer {
  file: File;
  totalChunks: number;
  sentChunks: number;
}
