import { BroadcastTcpMessageContent } from './messages/tcp.message.types';

export type BroadcastClientConnectedData = {
  name: string;
  channels: string[];
};

export type BroadcastClientDisonnectedData = {
  name: string;
};

export type BroadcastMessageDeliveryData = {
  id: string;
  content: BroadcastTcpMessageContent;
};

export type BroadcastMessageHandlerData = {
  channel: string;
};
