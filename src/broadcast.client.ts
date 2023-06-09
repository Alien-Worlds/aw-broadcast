import { BroadcastMessage } from './broadcast.message';

export type MessageHandler<BroadcastMessageType> = (
  message: BroadcastMessageType
) => Promise<void> | void;

export abstract class BroadcastClient {
  public abstract connect(): void;
  public abstract sendMessage(message: BroadcastMessage): void;
  public abstract onMessage(
    channel: string,
    handler: MessageHandler<BroadcastMessage>
  ): void;
}
