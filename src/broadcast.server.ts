import { BroadcastMessage } from './broadcast.message';

export abstract class BroadcastConnectedClient {
  public abstract get address(): string;
  public abstract send(message: BroadcastMessage | unknown): void;
}

export abstract class BroadcastClientCast extends BroadcastConnectedClient {
  public abstract addChannel(channel: string): void;
  public abstract removeChannel(channel: string): void;
}

export type ClientMessageHandler<BroadcastMessageType> = (
  socket: BroadcastClientCast,
  message: BroadcastMessageType
) => Promise<void> | void;

export abstract class BroadcastServer {
  public abstract start(): Promise<void>;
  public abstract onMessage(handler: ClientMessageHandler<BroadcastMessage>): void;
  public abstract sendMessage(message: BroadcastMessage): void;
}
