import { BroadcastTcpClientCast } from './tcp.client-cast';
import { BroadcastTcpMessage } from './messages/tcp.message';

/**
 * The BroadcastTcpChannel class represents a TCP channel for broadcasting messages.
 */
export class BroadcastTcpChannel {
  /**
   * Constructs a new BroadcastTcpChannel instance.
   *
   * @param {string} name The name of the channel.
   * @param {BroadcastTcpClientCast[]} clients The clients in the channel.
   */
  constructor(
    public readonly name: string,
    protected readonly clients: BroadcastTcpClientCast[] = []
  ) {
    clients.forEach(client => {
      client.addChannel(name);
    });
  }
  /**
   * Adds a client to the channel.
   *
   * @param {BroadcastTcpClientCast} client The client to add to the channel.
   */
  public addClient(client: BroadcastTcpClientCast): void {
    const ref = this.clients.find(c => c.address === client.address);
    if (!ref) {
      client.addChannel(this.name);
      this.clients.push(client);
    }
  }
  /**
   * Removes a client from the channel.
   *
   * @param {string} address The address of the client to remove.
   */
  public removeClient(address: string): void {
    const i = this.clients.findIndex(c => c.address === address);
    if (i > -1) {
      this.clients[i].removeChannel(this.name);
      this.clients.splice(i, 1);
    }
  }
  /**
   * Sends a message to all clients in the channel, except for those specified in the exclude array.
   *
   * @param {BroadcastTcpMessage} message The message to send.
   * @param {string[]} exclude An array of addresses of clients to exclude from the message broadcast.
   * @returns {boolean} Whether the message was sent.
   */
  public sendMessage(message: BroadcastTcpMessage, exclude: string[] = []) {
    let sent = false;
    this.clients.forEach(client => {
      if (exclude.includes(client.address)) {
        return;
      }
      sent = true;
      client.send(message);
    });

    return sent;
  }
}
