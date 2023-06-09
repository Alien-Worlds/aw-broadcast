export enum BroadcastTcpMessageType {
  Data = 'DATA',
  System = 'SYSTEM',
}

export enum BroadcastTcpMessageName {
  Undefined = 'UNDEFINED',
  ClientConnected = 'CLIENT_CONNECTED',
  ClientDisconnected = 'CLIENT_DISCONNECTED',
  ClientAddedMessageHandler = 'ADDED_MESSAGE_HANDLER',
  ClientRemovedMessageHandler = 'REMOVED_MESSAGE_HANDLER',
  MessageDelivered = 'MESSAGE_DELIVERED',
  MessageNotDelivered = 'MESSAGE_NOT_DELIVERED',
}
