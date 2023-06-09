import { nanoid } from 'nanoid';

export class BroadcastMessage<DataType = unknown> {
  public static createChannelMessage<DataType = unknown>(
    channel: string,
    data: DataType,
    name?: string
  ): BroadcastMessage {
    return new BroadcastMessage(nanoid(), null, channel, name, data);
  }

  public static createClientMessage<DataType = unknown>(
    client: string,
    data: DataType,
    name?: string
  ): BroadcastMessage {
    return new BroadcastMessage(nanoid(), client, null, name, data);
  }

  public static createMultiChannelMessage<DataType = unknown>(
    channels: string[],
    data: DataType,
    name?: string
  ): BroadcastMessage[] {
    return channels.map(
      channel => new BroadcastMessage(nanoid(), null, channel, name, data)
    );
  }

  public static createGroupMessage<DataType = unknown>(
    clients: string[],
    data: DataType,
    name?: string
  ): BroadcastMessage[] {
    return clients.map(
      client => new BroadcastMessage(nanoid(), client, null, name, data)
    );
  }

  public static create<DataType = unknown>(
    client: string,
    channel: string,
    data: DataType,
    name?: string
  ): BroadcastMessage {
    return new BroadcastMessage(nanoid(), client, channel, name, data);
  }

  protected constructor(
    public readonly id: string,
    public readonly client: string,
    public readonly channel: string,
    public readonly name: string,
    public readonly data: DataType
  ) {}
}
