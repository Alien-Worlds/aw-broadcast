import { Socket } from 'net';
import { BroadcastTcpMessage } from './messages/tcp.message';
import { getClientAddress, writeSocketBuffer } from './tcp.utils';
import { BroadcastClientCast } from '../broadcast.server';

/**
 * The BroadcastTcpClientCast class represents a TCP client that can send and receive broadcast messages.
 */
export class BroadcastTcpClientCast implements BroadcastClientCast {
  protected _address: string;
  protected channels: Set<string> = new Set();

  /**
   * Constructs a new BroadcastTcpClientCast instance.
   *
   * @param {Socket} socket The socket of the client.
   * @param {string} name The name of the client.
   */
  constructor(private readonly socket: Socket, public readonly name: string) {
    this._address = getClientAddress(socket, false);
  }
  /**
   * Gets the address of the client.
   *
   * @returns {string} The address of the client.
   */
  public get address(): string {
    return this._address;
  }
  /**
   * Adds a channel to the client.
   *
   * @param {string} channel The name of the channel to add.
   */
  public addChannel(channel: string): void {
    this.channels.add(channel);
  }
  /**
   * Removes a channel from the client.
   *
   * @param {string} channel The name of the channel to remove.
   */
  public removeChannel(channel: string): void {
    this.channels.delete(channel);
  }
  /**
   * Sends a message to the client.
   *
   * @param {BroadcastTcpMessage} message The message to send.
   */
  public send(message: BroadcastTcpMessage): void {
    this.socket.write(writeSocketBuffer(message));
  }
}
