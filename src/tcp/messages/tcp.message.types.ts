export type BroadcastTcpMessageContent<DataType = unknown> = {
  sender: string;
  type: string;
  channel?: string;
  name?: string;
  id?: string;
  recipient?: string;
  data?: DataType;
  persistent?: boolean;
};
