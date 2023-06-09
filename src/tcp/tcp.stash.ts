import { BroadcastTcpMessage } from './messages/tcp.message';

/**
 * This class is responsible for storing TCP messages by their channel.
 * It provides methods to add messages to the stash and to retrieve them.
 * 
 * @class
 */
export class BroadcastTcpStash {
  /**
   * A private Map object that holds the messages, keyed by their channel.
   * @private
   */
  private messagesByChannel: Map<string, BroadcastTcpMessage[]> = new Map();

  /**
   * This method adds a TCP message to the stash. If a message from the same channel already exists,
   * the new message is added to the array of messages for this channel. If it's the first message
   * from this channel, a new array is created and the message is added to it.
   *
   * @param {BroadcastTcpMessage} message - The message to be added to the stash.
   * @public
   */
  public add(message: BroadcastTcpMessage) {
    const { channel } = message;

    if (this.messagesByChannel.has(channel)) {
      this.messagesByChannel.get(channel).push(message);
    } else {
      this.messagesByChannel.set(channel, [message]);
    }
  }

  /**
   * This method retrieves and removes all messages from a specific channel. If no messages exist
   * for the given channel, an empty array is returned.
   *
   * @param {string} channel - The channel whose messages should be popped from the stash.
   * @returns {BroadcastTcpMessage[]} The array of messages for the channel, or an empty array if
   * none exist.
   * @public
   */
  public pop(channel: string): BroadcastTcpMessage[] {
    if (this.messagesByChannel.has(channel)) {
      const messages = this.messagesByChannel.get(channel);
      this.messagesByChannel.delete(channel);
      return messages;
    }

    return [];
  }
}
