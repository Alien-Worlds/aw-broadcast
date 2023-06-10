import { BroadcastMessage } from './broadcast.message';

/**
 * A handler function for processing incoming broadcast messages.
 *
 * @template BroadcastMessageType The type of the message that the handler processes.
 * @param message The message to process.
 * @returns A Promise resolving to void, or void.
 */
export type MessageHandler<BroadcastMessageType> = (
  message: BroadcastMessageType
) => Promise<void> | void;

/**
 * The `BroadcastClient` abstract class provides a blueprint for creating a client that can connect, 
 * send messages, and handle incoming messages within a broadcast system.
 *
 * This class must be extended by any client implementation within the system.
 */
export abstract class BroadcastClient {
  /**
   * Connects the client to the broadcast system. The implementation details depend on the specific
   * subclass that extends this abstract class.
   */
  public abstract connect(): void;
  /**
   * Sends a message to the broadcast system. The specific routing of the message will be determined
   * by the implementation in the subclass.
   *
   * @param message The `BroadcastMessage` object to be sent.
   */
  public abstract sendMessage(message: BroadcastMessage): void;
  /**
   * Sets a message handler for a specific channel. When a message is received on the specified
   * channel, the handler function is called.
   *
   * @param channel The name of the channel for which the handler is being set.
   * @param handler The `MessageHandler` function that processes incoming messages on the specified channel.
   */
  public abstract onMessage(
    channel: string,
    handler: MessageHandler<BroadcastMessage>
  ): void;
}
