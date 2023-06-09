import { Socket } from 'net';
import { BroadcastTcpMessage } from './messages/tcp.message';
import { writeSocketBuffer, getClientAddress } from './tcp.utils';

/**
 * Class that represents a queue of BroadcastTcpMessages.
 * This class is responsible for adding messages to the queue and sending them when the queue is started.
 * The queue operates in a FIFO (first-in-first-out) manner, with the exception that system messages are prioritized.
 */
export class BroadcastTcpMessageQueue {
  private queue: BroadcastTcpMessage[] = [];
  private started = false;
  private address: string;
  /**
   * Creates a new instance of the BroadcastTcpMessageQueue class.
   *
   * @param {Socket} client The socket client that the messages should be sent through.
   */
  constructor(private client: Socket) {}
  /**
   * Adds a message to the queue.
   * System messages are added to the front of the queue.
   *
   * @param {BroadcastTcpMessage} message The message to add to the queue.
   */
  public add(message: BroadcastTcpMessage) {
    if (message.type === 'SYSTEM') {
      this.queue.unshift(message);
    } else {
      this.queue.push(message);
    }

    if (this.started === true) {
      this.loop();
    }
  }
  /**
   * Starts the message queue, allowing messages to be sent.
   */
  public start() {
    this.address = getClientAddress(this.client, true);
    this.started = true;
    this.loop();
  }
  /**
   * Stops the message queue, preventing messages from being sent.
   */
  public stop() {
    this.started = false;
  }
  /**
   * Processes the messages in the queue, sending them in the order they were added.
   * If the queue has been stopped, the processing will also stop.
   */
  private loop() {
    while (this.started && this.queue.length > 0) {
      const message = this.queue.shift();
      message.sender = this.address;
      const buffer = writeSocketBuffer(message);
      this.client.write(buffer);
    }
  }
}
