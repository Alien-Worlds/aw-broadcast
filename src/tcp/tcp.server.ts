import { BroadcastTcpStash } from './tcp.stash';
import { createServer, Server, Socket } from 'net';
import { BroadcastConnectionConfig } from '../types';
import {
  getTcpConnectionOptions,
  splitToMessageBuffers,
  getClientAddress,
} from './tcp.utils';
import { BroadcastTcpClientCast } from './tcp.client-cast';
import { BroadcastTcpChannel } from './tcp.channel';
import { log } from '@alien-worlds/api-core';
import { BroadcastServer, ClientMessageHandler } from '../broadcast.server';
import { BroadcastMessage } from '../broadcast.message';
import { BroadcastClientConnectedData, BroadcastMessageHandlerData } from './tcp.types';
import { BroadcastTcpMessage } from './messages/tcp.message';
import { BroadcastTcpSystemMessage } from './messages/tcp.system.message';
import {
  BroadcastTcpMessageName,
  BroadcastTcpMessageType,
} from './messages/tcp.message.enums';

/**
 * Class representing a TCP server for broadcast communication.
 * @implements {BroadcastServer}
 */
export class BroadcastTcpServer implements BroadcastServer {
  /**
   * @property {Server} server - Node.js net.Server instance.
   * @property {BroadcastTcpClientCast[]} clients - Array of connected clients.
   * @property {Map<string, BroadcastTcpChannel>} channelsByName - Mapping of channels to clients.
   * @property {BroadcastTcpStash} stash - Instance of BroadcastTcpStash for stashing messages.
   * @property {ClientMessageHandler<BroadcastMessage>} clientMessageHandler - Handler for incoming client messages.
   */
  protected server: Server;
  protected clients: BroadcastTcpClientCast[] = [];
  protected channelsByName: Map<string, BroadcastTcpChannel> = new Map();
  protected stash: BroadcastTcpStash = new BroadcastTcpStash();
  protected clientMessageHandler: ClientMessageHandler<BroadcastMessage>;
  /**
   * Creates an instance of BroadcastTcpServer.
   *
   * @param {BroadcastConnectionConfig} config - Configuration for the server.
   */
  constructor(protected config: BroadcastConnectionConfig) {}
  /**
   * Method to resend stashed messages.
   *
   * @protected
   * @param {BroadcastTcpClientCast} client - The client to which the messages will be sent.
   * @param {string} channel - The channel from which the messages will be popped.
   */
  protected resendStashedMessages(client: BroadcastTcpClientCast, channel: string) {
    try {
      const messages = this.stash.pop(channel);
      for (const message of messages) {
        const { id, channel, name } = message;
        client.send(message);
        log(
          `Broadcast TCP Server: message (${JSON.stringify({
            id,
            channel,
            name,
          })}) has been resent.`
        );
      }
    } catch (error) {
      log(`Something went wrong.`);
      log(error);
    }
  }
  /**
   * Event listener for when a client connects.
   *
   * @protected
   * @param {Socket} socket - The socket object of the client.
   * @param {BroadcastClientConnectedData} data - Connection data.
   */
  protected onClientConnected(socket: Socket, data: BroadcastClientConnectedData) {
    try {
      const { name, channels } = data;
      const address = getClientAddress(socket, false);
      let client = this.clients.find(client => client.address === address);

      if (!client) {
        client = new BroadcastTcpClientCast(socket, name);
        this.clients.push(client);
      }

      log(
        `Broadcast TCP Server: client ${client.address} (${client.name}) connection open.`
      );

      for (const channel of channels) {
        if (this.channelsByName.has(channel)) {
          this.channelsByName.get(channel).addClient(client);
        } else {
          this.channelsByName.set(channel, new BroadcastTcpChannel(channel, [client]));
        }
        // if there are any undelivered messages, then send them
        // to the first client that listens to the selected channel
        this.resendStashedMessages(client, channel);
      }
    } catch (error) {
      log(`Something went wrong.`);
      log(error);
    }
  }
  /**
   * Event listener for when a client adds a message handler.
   *
   * @protected
   * @param {Socket} socket - The socket object of the client.
   * @param {BroadcastMessageHandlerData} data - The message handler data.
   */
  protected onClientAddedMessageHandler(
    socket: Socket,
    data: BroadcastMessageHandlerData
  ) {
    try {
      const { channel } = data;
      const address = getClientAddress(socket, false);
      const client = this.clients.find(client => client.address === address);
      if (client) {
        log(
          `Broadcast TCP Server: client ${client.address} (${client.name}) is listening to channel "${channel}".`
        );

        if (this.channelsByName.has(channel)) {
          this.channelsByName.get(channel).addClient(client);
        } else {
          this.channelsByName.set(channel, new BroadcastTcpChannel(channel, [client]));
        }
        // if there are any undelivered messages, then send them
        // to the first client that listens to the selected channel
        this.resendStashedMessages(client, channel);
      }
    } catch (error) {
      log(`Something went wrong.`);
      log(error);
    }
  }
  /**
   * Event listener for when a client removes a message handler.
   *
   * @protected
   * @param {Socket} socket - The socket object of the client.
   * @param {BroadcastMessageHandlerData} data - The message handler data.
   */
  protected onClientRemovedMessageHandler(
    socket: Socket,
    data: BroadcastMessageHandlerData
  ) {
    try {
      const { channel } = data;
      const address = getClientAddress(socket, false);
      const client = this.clients.find(client => client.address === address);

      if (this.channelsByName.has(channel) && client) {
        log(
          `Broadcast TCP Server: client ${client.address} (${client.name}) has stopped listening to channel "${channel}".`
        );
        this.channelsByName.get(channel).removeClient(address);
      }
    } catch (error) {
      log(`Something went wrong.`);
      log(error);
    }
  }
  /**
   * Event listener for when a client disconnects.
   *
   * @protected
   * @param {Socket} socket - The socket object of the client.
   */
  protected onClientDisconnected(socket: Socket) {
    try {
      const address = getClientAddress(socket, false);
      const i = this.clients.findIndex(client => client.address === address);

      if (i > -1) {
        this.clients.splice(i, 1);
      }

      this.channelsByName.forEach(channel => {
        channel.removeClient(address);
      });

      log(`Broadcast TCP Server: client ${address} connection closed.`);
    } catch (error) {
      log(`Something went wrong.`);
      log(error);
    }
  }
  /**
   * Method to find a client based on name or address.
   *
   * @protected
   * @param {string} nameOrAddress - The name or address of the client.
   * @returns {BroadcastTcpClientCast} - The client object, if found.
   */
  protected findClient(nameOrAddress: string): BroadcastTcpClientCast {
    return this.clients.find(client => {
      return client.name === nameOrAddress || client.address === nameOrAddress;
    });
  }
  /**
   * Event listener for when a client sends a message.
   *
   * @protected
   * @param {Socket} socket - The socket object of the client.
   * @param {BroadcastTcpMessage} message - The message sent by the client.
   */
  protected onClientIncomingMessage(socket: Socket, message: BroadcastTcpMessage) {
    try {
      const { data, channel, recipient, name } = message;
      const address = getClientAddress(socket, false);
      const sender = this.clients.find(client => client.address === address);
      let success = false;

      if (!sender) {
        log(`No client found with address: ${address}`);
      }

      const broadcastMessage = BroadcastMessage.create(recipient, channel, data, name);
      if (this.clientMessageHandler && sender) {
        this.clientMessageHandler(sender, broadcastMessage);
      }

      if (recipient) {
        const client = this.findClient(recipient);
        if (client) {
          client.send(message);
        }
      }

      if (this.channelsByName.has(channel)) {
        success = this.channelsByName.get(channel).sendMessage(message, [address]);
      }

      if (!success) {
        if (sender) {
          sender.send(BroadcastTcpSystemMessage.createMessageNotDelivered(message));
        }

        if (message.persistent) {
          this.stash.add(message);
        }
      }
    } catch (error) {
      log(`Something went wrong.`);
      log(error);
    }
  }
  /**
   * Event listener for when an error occurs with a client connection.
   *
   * @protected
   * @param {Socket} socket - The socket object of the client.
   * @param {Error} error - The error object.
   */
  protected onClientError(socket: Socket, error: Error) {
    try {
      const address = getClientAddress(socket, false);
      this.channelsByName.forEach(channel => {
        channel.removeClient(address);
      });
      log(`Broadcast TCP Server: client ${address} connection error: ${error.message}`);
    } catch (error) {
      log(`Something went wrong.`);
      log(error);
    }
  }
  /**
   * Method to handle client messages.
   *
   * @protected
   * @param {Socket} socket - The socket object of the client.
   * @param {Buffer} buffer - The message buffer.
   */
  protected handleClientMessage(socket: Socket, buffer: Buffer) {
    try {
      const message = BroadcastTcpMessage.fromBuffer(buffer);
      const { type, data, name } = message;

      if (
        type === BroadcastTcpMessageType.System &&
        name === BroadcastTcpMessageName.ClientConnected
      ) {
        this.onClientConnected(socket, <BroadcastClientConnectedData>data);
      } else if (
        type === BroadcastTcpMessageType.System &&
        name === BroadcastTcpMessageName.ClientAddedMessageHandler
      ) {
        this.onClientAddedMessageHandler(socket, <BroadcastMessageHandlerData>data);
      } else if (
        type === BroadcastTcpMessageType.System &&
        name === BroadcastTcpMessageName.ClientRemovedMessageHandler
      ) {
        this.onClientRemovedMessageHandler(socket, <BroadcastMessageHandlerData>data);
      } else if (type === BroadcastTcpMessageType.Data) {
        this.onClientIncomingMessage(socket, message);
      }
    } catch (error) {
      log(`Something went wrong.`);
      log(error);
    }
  }
  /**
   * Method to start the TCP Server.
   *
   * @returns {Promise<void>}
   */
  public async start(): Promise<void> {
    try {
      if (!this.server) {
        this.server = createServer();
      }

      this.server.on('connection', socket => {
        socket.on('data', buffer => {
          const buffers = splitToMessageBuffers(buffer);
          buffers.forEach(buffer => {
            this.handleClientMessage(socket, buffer);
          });
        });
        socket.on('error', error => this.onClientError(socket, error));
        socket.once('close', () => this.onClientDisconnected(socket));
      });

      const options = getTcpConnectionOptions(this.config);

      this.server.listen(options, () => {
        log(`Broadcast TCP Server: listening on ${JSON.stringify(options)}`);
      });
    } catch (error) {
      log(`Something went wrong.`);
      log(error);
    }
  }
  /**
   * Method to set the client message handler.
   *
   * @param {ClientMessageHandler<BroadcastMessage>} handler - Handler for incoming client messages.
   */
  public onMessage(handler: ClientMessageHandler<BroadcastMessage>): void {
    this.clientMessageHandler = handler;
  }
  /**
   * Method to send a message from the server.
   *
   * @param {BroadcastMessage} message - The message to be sent.
   */
  public sendMessage(message: BroadcastMessage): void {
    const { channel, client, id, name, data: content } = message;

    if (channel) {
      this.sendMessageToChannel(id, name, channel, content);
    }
    const recipient = this.clients.find(
      ({ address, name }) => client === address || client === name
    );

    if (recipient) {
      this.sendMessageToClient(id, recipient, content, name);
    }
  }
  /**
   * Method to send a message to a specific channel.
   *
   * @private
   * @param {string} id - The id of the message.
   * @param {string} name - The name of the message.
   * @param {string} channel - The channel to send the message to.
   * @param {unknown} data - The data to be sent.
   */
  private sendMessageToChannel(
    id: string,
    name: string,
    channel: string,
    data: unknown
  ): void {
    try {
      if (this.channelsByName.has(channel)) {
        BroadcastTcpMessage;
        this.channelsByName.get(channel).sendMessage(
          BroadcastTcpMessage.create({
            id,
            sender: 'server',
            channel,
            data,
            name: name || 'server-channel-message',
            type: BroadcastTcpMessageType.Data,
          })
        );
      } else {
        log(
          `Broadcast TCP Server: channel #${channel} does not exist. Message cannot be sent.`
        );
      }
    } catch (error) {
      log(`An error occurred while sending a message to #${channel}.`);
      log(error);
    }
  }
  /**
   * Method to send a message to a specific client.
   *
   * @private
   * @param {string} id - The id of the message.
   * @param {BroadcastTcpClientCast} client - The client to send the message to.
   * @param {unknown} data - The data to be sent.
   * @param {string} name - The name of the message.
   */
  private sendMessageToClient(
    id: string,
    client: BroadcastTcpClientCast,
    data: unknown,
    name: string
  ): void {
    try {
      client.send(
        BroadcastTcpMessage.create({
          id,
          sender: 'server',
          channel: null,
          data,
          name: name || 'server-client-message',
          type: BroadcastTcpMessageType.Data,
          recipient: client.address,
        })
      );
    } catch (error) {
      log(`An error occurred while sending a message to client.`);
      log(error);
    }
  }
}
