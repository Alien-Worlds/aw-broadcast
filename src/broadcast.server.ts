import { BroadcastMessage } from './broadcast.message';
/**
 * The `BroadcastConnectedClient` abstract class represents a client that is connected to the broadcast system.
 * It provides an interface for getting the client's address and sending messages.
 */
export abstract class BroadcastConnectedClient {
  /**
   * Returns the address of the connected client.
   *
   * @returns A string representing the address of the client.
   */
  public abstract get address(): string;

  /**
   * Sends a message to the broadcast system from this client.
   *
   * @param message The message to send, which can be a `BroadcastMessage` object or any other type.
   */
  public abstract send(message: BroadcastMessage | unknown): void;
}

/**
 * The `BroadcastClientCast` abstract class represents a connected client that can interact with specific channels
 * within the broadcast system. It extends `BroadcastConnectedClient`.
 */
export abstract class BroadcastClientCast extends BroadcastConnectedClient {
  /**
   * Adds this client to a specific channel.
   *
   * @param channel The name of the channel to which the client should be added.
   */
  public abstract addChannel(channel: string): void;

  /**
   * Removes this client from a specific channel.
   *
   * @param channel The name of the channel from which the client should be removed.
   */
  public abstract removeChannel(channel: string): void;
}

/**
 * A handler function for processing incoming client messages.
 *
 * @template BroadcastMessageType The type of the message that the handler processes.
 * @param socket The `BroadcastClientCast` object that represents the client sending the message.
 * @param message The message to process.
 * @returns A Promise resolving to void, or void.
 */
export type ClientMessageHandler<BroadcastMessageType> = (
  socket: BroadcastClientCast,
  message: BroadcastMessageType
) => Promise<void> | void;

/**
 * The `BroadcastServer` abstract class provides a blueprint for creating a server that can start, 
 * handle incoming messages, and send messages within the broadcast system.
 */
export abstract class BroadcastServer {
  /**
   * Starts the server. The implementation details depend on the specific subclass that extends this abstract class.
   *
   * @returns A Promise resolving to void.
   */
  public abstract start(): Promise<void>;

  /**
   * Sets a message handler for incoming client messages. When a message is received, the handler function is called.
   *
   * @param handler The `ClientMessageHandler` function that processes incoming client messages.
   */
  public abstract onMessage(handler: ClientMessageHandler<BroadcastMessage>): void;

  /**
   * Sends a message to the broadcast system from the server.
   *
   * @param message The `BroadcastMessage` object to be sent.
   */
  public abstract sendMessage(message: BroadcastMessage): void;
}
