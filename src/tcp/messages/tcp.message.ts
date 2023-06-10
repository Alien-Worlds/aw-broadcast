import { deserialize, serialize } from 'v8';
import { BroadcastTcpMessageContent } from './tcp.message.types';
import { nanoid } from 'nanoid';

/**
 * The BroadcastTcpMessage class represents a message to be broadcasted over TCP.
 *
 * @template DataType The type of data that the message will carry.
 */
export class BroadcastTcpMessage<DataType = unknown> {
  /**
   * Constructs a new BroadcastTcpMessage object from a Buffer.
   *
   * @template DataType The type of data that the buffer represents.
   * @param {Buffer} buffer The buffer to deserialize into a BroadcastTcpMessage object.
   * @returns {BroadcastTcpMessage<DataType>} The deserialized BroadcastTcpMessage object.
   */
  public static fromBuffer<DataType = unknown>(
    buffer: Buffer
  ): BroadcastTcpMessage<DataType> {
    const content = deserialize(buffer) as BroadcastTcpMessageContent<DataType>;
    const { id, sender, channel, type, name, recipient, data, persistent } = content;
    return new BroadcastTcpMessage(
      id,
      sender,
      channel,
      type,
      name,
      recipient,
      data,
      typeof persistent === 'boolean' ? persistent : true
    );
  }

  /**
   * Creates a new BroadcastTcpMessage object from the given content.
   *
   * @template DataType The type of data that the message will carry.
   * @param {BroadcastTcpMessageContent<DataType>} content The content for the new BroadcastTcpMessage object.
   * @returns {BroadcastTcpMessage<DataType>} The new BroadcastTcpMessage object.
   */
  public static create<DataType = unknown>(
    content: BroadcastTcpMessageContent<DataType>
  ): BroadcastTcpMessage<DataType> {
    const { id, sender, channel, type, name, recipient, data, persistent } = content;
    return new BroadcastTcpMessage(
      id || nanoid(),
      sender,
      channel,
      type,
      name,
      recipient,
      data,
      typeof persistent === 'boolean' ? persistent : true
    );
  }

  /**
   * Protected constructor for the BroadcastTcpMessage class.
   *
   * @param {string} id The ID of the message.
   * @param {string} sender The sender of the message.
   * @param {string} channel The channel over which the message is sent.
   * @param {string} type The type of the message.
   * @param {string} [name] The name of the message.
   * @param {string} [recipient] The recipient of the message.
   * @param {DataType} [data] The data carried by the message.
   * @param {boolean} [persistent = true] Indicates whether the message is persistent.
   */
  constructor(
    public id: string,
    public sender: string,
    public channel: string,
    public type: string,
    public name?: string,
    public recipient?: string,
    public data?: DataType,
    public persistent = true
  ) {}

  /**
   * Converts this BroadcastTcpMessage object into a Buffer.
   *
   * @returns {Buffer} The serialized BroadcastTcpMessage object.
   */
  public toBuffer(): Buffer {
    const { sender, channel, type, name, recipient, data, persistent } = this;
    return serialize({ sender, channel, type, name, recipient, data, persistent });
  }
}
