import { BroadcastTcpMessageName, BroadcastTcpMessageType } from './tcp.message.enums';
import { BroadcastTcpMessage } from './tcp.message';
import { nanoid } from 'nanoid';

/**
 * The BroadcastTcpSystemMessage class represents a system message to be broadcasted over TCP.
 * It extends the BroadcastTcpMessage class.
 */
export class BroadcastTcpSystemMessage extends BroadcastTcpMessage {
  /**
   * Creates a new BroadcastTcpSystemMessage when a client connects.
   *
   * @param {string} name The name of the client.
   * @param {string} sender The sender of the message.
   * @param {string[]} channels The channels over which the client communicates.
   * @returns {BroadcastTcpSystemMessage} The new BroadcastTcpSystemMessage.
   */
  public static createClientConnected(name: string, sender: string, channels: string[]) {
    return new BroadcastTcpSystemMessage(
      nanoid(),
      sender,
      null,
      BroadcastTcpMessageType.System,
      BroadcastTcpMessageName.ClientConnected,
      null,
      { name, channels }
    );
  }
  /**
   * Creates a new BroadcastTcpSystemMessage when a client disconnects.
   *
   * @param {string} name The name of the client.
   * @param {string} sender The sender of the message.
   * @returns {BroadcastTcpSystemMessage} The new BroadcastTcpSystemMessage.
   */
  public static createClientDisconnected(name: string, sender: string) {
    return new BroadcastTcpSystemMessage(
      nanoid(),
      sender,
      null,
      BroadcastTcpMessageType.System,
      BroadcastTcpMessageName.ClientDisconnected,
      null,
      { name }
    );
  }
  /**
   * Creates a new BroadcastTcpSystemMessage when a message was not delivered.
   *
   * @param {BroadcastTcpMessage} message The message that was not delivered.
   * @returns {BroadcastTcpSystemMessage} The new BroadcastTcpSystemMessage.
   */
  public static createMessageNotDelivered(message: BroadcastTcpMessage) {
    return new BroadcastTcpSystemMessage(
      nanoid(),
      null,
      null,
      BroadcastTcpMessageType.System,
      BroadcastTcpMessageName.MessageNotDelivered,
      message.sender,
      message
    );
  }
  /**
   * Creates a new BroadcastTcpSystemMessage when a client added a message handler.
   *
   * @param {string} channel The channel over which the client communicates.
   * @param {string} sender The sender of the message.
   * @returns {BroadcastTcpSystemMessage} The new BroadcastTcpSystemMessage.
   */
  public static createClientAddedMessageHandler(channel: string, sender: string) {
    return new BroadcastTcpSystemMessage(
      nanoid(),
      sender,
      null,
      BroadcastTcpMessageType.System,
      BroadcastTcpMessageName.ClientAddedMessageHandler,
      null,
      { channel }
    );
  }

  /**
   * Creates a new BroadcastTcpSystemMessage when a client removed a message handler.
   *
   * @param {string} channel The channel over which the client communicates.
   * @param {string} sender The sender of the message.
   * @returns {BroadcastTcpSystemMessage} The new BroadcastTcpSystemMessage.
   */
  public static createClientRemovedMessageHandler(channel: string, sender: string) {
    return new BroadcastTcpSystemMessage(
      nanoid(),
      sender,
      null,
      BroadcastTcpMessageType.System,
      BroadcastTcpMessageName.ClientRemovedMessageHandler,
      null,
      { channel }
    );
  }
}
