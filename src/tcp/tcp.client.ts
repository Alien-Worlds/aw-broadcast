import { Socket } from 'net';
import { ConnectionState } from '../enums';
import { BroadcastConnectionConfig } from '../types';
import { BroadcastTcpMessageQueue } from './tcp.message-queue';
import {
  getClientAddress,
  getTcpConnectionOptions,
  splitToMessageBuffers,
} from './tcp.utils';
import { nanoid } from 'nanoid';
import { log, wait } from '@alien-worlds/api-core';
import { BroadcastClient, MessageHandler } from '../broadcast.client';
import { BroadcastMessage } from '../broadcast.message';
import { BroadcastTcpSystemMessage } from './messages/tcp.system.message';
import { BroadcastTcpMessage } from './messages/tcp.message';
import {
  BroadcastTcpMessageName,
  BroadcastTcpMessageType,
} from './messages/tcp.message.enums';

/**
 * The BroadcastTcpClient class represents a TCP client that can send, receive and handle broadcast messages.
 */
export class BroadcastTcpClient implements BroadcastClient {
  private socket: Socket;
  private address: string;
  private messageQueue: BroadcastTcpMessageQueue;
  private connectionOptions: { path?: string; host?: string; port?: number };
  private connectionState: ConnectionState = ConnectionState.Offline;
  private channelHandlers: Map<string, MessageHandler<BroadcastMessage>> = new Map();
  private clientName: string;
  private reconnectTimeout = 5000;

  /**
   * Constructs a new BroadcastTcpClient instance.
   *
   * @param {BroadcastConnectionConfig} config The configuration for the connection.
   * @param {string} [name] The name of the client.
   */
  constructor(config: BroadcastConnectionConfig, name?: string) {
    this.clientName = name || nanoid();
    this.connectionOptions = getTcpConnectionOptions(config);
    this.socket = new Socket();

    this.messageQueue = new BroadcastTcpMessageQueue(this.socket);
    this.socket.on('connect', () => {
      this.connectionState = ConnectionState.Online;
      const address = getClientAddress(this.socket, true);
      this.address = address;

      log(`Broadcast - ${JSON.stringify({ name, address })}: connected to the server.`);

      const message = BroadcastTcpSystemMessage.createClientConnected(
        name,
        this.address,
        Array.from(this.channelHandlers.keys())
      );

      this.messageQueue.add(message);
      this.messageQueue.start();
    });
    this.socket.on('end', () => {
      const { clientName: name, address } = this;
      this.connectionState = ConnectionState.Offline;
      log(
        `Broadcast - ${JSON.stringify({ name, address })}: disconnected from the server.`
      );
      this.messageQueue.stop();
      this.reconnect();
    });
    this.socket.on('error', error => {
      const { clientName: name, address } = this;
      this.connectionState = ConnectionState.Offline;
      log(`Broadcast - ${JSON.stringify({ name, address })}: Error: ${error.message}`);
      this.messageQueue.stop();
      this.reconnect();
    });
    this.socket.on('data', buffer => {
      const buffers = splitToMessageBuffers(buffer);

      for (const buffer of buffers) {
        const message = BroadcastTcpMessage.fromBuffer(buffer);
        const { type, channel, data, name } = message;

        if (type === BroadcastTcpMessageType.System) {
          this.onSystemMessage(<BroadcastTcpSystemMessage>message);
        } else {
          const handler = this.channelHandlers.get(channel);
          if (handler) {
            const broadcastMessage = BroadcastMessage.createChannelMessage(
              channel,
              data,
              name
            );
            handler(broadcastMessage);
          }
        }
      }
    });
  }

  /**
   * Handles the system messages received by the client.
   *
   * @param {BroadcastTcpSystemMessage} message The system message to handle.
   * @private
   */
  private onSystemMessage(message: BroadcastTcpSystemMessage) {
    const { data, name } = message;

    if (name === BroadcastTcpMessageName.MessageNotDelivered) {
      const { id, channel, name } = <BroadcastTcpMessage>data;

      log(
        `Broadcast - ${this.clientName}: message (${JSON.stringify({
          id,
          channel,
          name,
        })}) was not delivered.`
      );
    }
  }
  /**
   * Attempts to reconnect the client to the server.
   *
   * @private
   */
  private async reconnect() {
    if (this.connectionState === ConnectionState.Offline) {
      await wait(this.reconnectTimeout);
      this.connect();
    }
  }
  /**
   * Connects the client to the server.
   */
  public connect() {
    if (this.connectionState === ConnectionState.Offline) {
      this.connectionState = ConnectionState.Connecting;
      const { path, port, host } = this.connectionOptions;
      this.socket.connect({ path, port, host });
    }
  }

  /**
   * Sends a message to the server.
   *
   * @param {BroadcastMessage} message The message to send.
   */
  public sendMessage(message: BroadcastMessage): void {
    const { address } = this;
    const { name, data, channel, client, id } = message;

    if (channel) {
      this.messageQueue.add(
        BroadcastTcpMessage.create({
          id,
          sender: address,
          channel,
          type: BroadcastTcpMessageType.Data,
          name: name || BroadcastTcpMessageName.Undefined,
          data,
        })
      );
    }

    if (client) {
      this.messageQueue.add(
        BroadcastTcpMessage.create({
          id,
          sender: address,
          recipient: client,
          type: BroadcastTcpMessageType.Data,
          name: name || BroadcastTcpMessageName.Undefined,
          data,
        })
      );
    }
  }

  /**
   * Registers a handler for messages on a specific channel.
   *
   * @param {string} channel The channel to listen to.
   * @param {MessageHandler<BroadcastMessage>} handler The handler for the messages.
   */
  public onMessage(channel: string, handler: MessageHandler<BroadcastMessage>): void {
    this.channelHandlers.set(channel, handler);
    this.messageQueue.add(
      BroadcastTcpSystemMessage.createClientAddedMessageHandler(channel, this.address)
    );
  }
}
