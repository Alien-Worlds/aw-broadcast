
import { Socket } from 'net';
import { BroadcastTcpMessage } from '../messages/tcp.message';
import { BroadcastTcpMessageQueue } from '../tcp.message-queue';

describe('BroadcastTcpMessageQueue', () => {
  let socket: Socket;
  let messageQueue: BroadcastTcpMessageQueue;

  beforeEach(() => {
    // Mock the Socket object
    socket = new Socket() as jest.Mocked<Socket>;
    // Initialize the BroadcastTcpMessageQueue with the mocked socket
    messageQueue = new BroadcastTcpMessageQueue(socket);
  });

  it('should start and stop the queue', () => {
    messageQueue.start();
    expect((messageQueue as any).started).toBeTruthy();
    messageQueue.stop();
    expect((messageQueue as any).started).toBeFalsy();
  });

  it('should add message to the queue', () => {
    const message = new BroadcastTcpMessage('id', 'sender', 'channel', 'type');
    messageQueue.add(message);
    expect((messageQueue as any).queue[0]).toBe(message);
  });

  it('should process messages when queue is started', () => {
    const message = new BroadcastTcpMessage('id', 'sender', 'channel', 'type');
    messageQueue.add(message);
    messageQueue.start();
    expect(socket.write).toHaveBeenCalled();
    expect((messageQueue as any).queue.length).toBe(0);
  });

  it('should not process messages when queue is stopped', () => {
    const message = new BroadcastTcpMessage('id', 'sender', 'channel', 'type');
    messageQueue.add(message);
    messageQueue.stop();
    expect(socket.write).not.toHaveBeenCalled();
    expect((messageQueue as any).queue.length).toBe(1);
  });
});
