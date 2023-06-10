import { nanoid } from 'nanoid';

/**
 * The `BroadcastMessage` class is used to create and manage messages in the broadcast system.
 * Each message contains an ID, client, channel, name, data, and a persistence flag.
 *
 * @template DataType The type of data that the message carries.
 */
export class BroadcastMessage<DataType = unknown> {
  /**
   * Creates a message to be sent to a specific channel.
   *
   * @template DataType The type of data that the message carries.
   * @param channel The target channel for the message.
   * @param data The data to be sent in the message.
   * @param name Optional name for the message.
   * @param persistent Determines if the message is persistent. Default value is `true`.
   * @returns The new BroadcastMessage instance.
   */
  public static createChannelMessage<DataType = unknown>(
    channel: string,
    data: DataType,
    name?: string,
    persistent = true
  ): BroadcastMessage {
    return new BroadcastMessage(nanoid(), null, channel, name, data, persistent);
  }

  /**
   * Creates a message to be sent to a specific client.
   *
   * @template DataType The type of data that the message carries.
   * @param client The target client for the message.
   * @param data The data to be sent in the message.
   * @param name Optional name for the message.
   * @param persistent Determines if the message is persistent. Default value is `true`.
   * @returns The new BroadcastMessage instance.
   */
  public static createClientMessage<DataType = unknown>(
    client: string,
    data: DataType,
    name?: string,
    persistent = true
  ): BroadcastMessage {
    return new BroadcastMessage(nanoid(), client, null, name, data, persistent);
  }

  /**
   * Creates a message to be sent to several channels at once.
   *
   * @template DataType The type of data that the message carries.
   * @param channels The target channels for the message.
   * @param data The data to be sent in the message.
   * @param name Optional name for the message.
   * @param persistent Determines if the message is persistent. Default value is `true`.
   * @returns An array of new BroadcastMessage instances for each channel.
   */
  public static createMultiChannelMessage<DataType = unknown>(
    channels: string[],
    data: DataType,
    name?: string,
    persistent = true
  ): BroadcastMessage[] {
    return channels.map(
      channel => new BroadcastMessage(nanoid(), null, channel, name, data, persistent)
    );
  }

  /**
   * Creates a message to be sent to a group of clients.
   *
   * @template DataType The type of data that the message carries.
   * @param clients The target clients for the message.
   * @param data The data to be sent in the message.
   * @param name Optional name for the message.
   * @param persistent Determines if the message is persistent. Default value is `true`.
   * @returns An array of new BroadcastMessage instances for each client.
   */
  public static createGroupMessage<DataType = unknown>(
    clients: string[],
    data: DataType,
    name?: string,
    persistent = true
  ): BroadcastMessage[] {
    return clients.map(
      client => new BroadcastMessage(nanoid(), client, null, name, data, persistent)
    );
  }

  /**
   * Creates a message that can be sent to both a specific client and a specific channel.
   *
   * @template DataType The type of data that the message carries.
   * @param client The target client for the message.
   * @param channel The target channel for the message.
   * @param data The data to be sent in the message.
   * @param name Optional name for the message.
   * @param persistent Determines if the message is persistent. Default value is `true`.
   * @returns The new BroadcastMessage instance.
   */
  public static create<DataType = unknown>(
    client: string,
    channel: string,
    data: DataType,
    name?: string,
    persistent = true
  ): BroadcastMessage {
    return new BroadcastMessage(nanoid(), client, channel, name, data, persistent);
  }

  /**
   * Protected constructor to create a new BroadcastMessage instance.
   *
   * @param id The unique identifier of the message.
   * @param client The target client for the message.
   * @param channel The target channel for the message.
   * @param name The name of the message.
   * @param data The data to be sent in the message.
   * @param persistent Determines if the message is persistent.
   */
  protected constructor(
    public readonly id: string,
    public readonly client: string,
    public readonly channel: string,
    public readonly name: string,
    public readonly data: DataType,
    public readonly persistent: boolean
  ) {}
}
