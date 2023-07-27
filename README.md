# Broadcast

Broadcast is a robust, scalable and efficient module for establishing inter-process communication. The package presents a suite of interfaces, types, and implementations leveraging TCP sockets to allow seamless data exchange between distributed services.

TCP (Transmission Control Protocol) is a communication protocol that ensures reliable, ordered, and error-checked delivery of data packets between applications running on networked hosts. In this package, TCP sockets serve as the communication endpoints for transmitting data between the processes.

This package is especially useful for building distributed systems, where different processes or services need to communicate with each other in a seamless and efficient way.

## Dependencies

- [@alien-worlds/aw-core](https://github.com/Alien-Worlds/api-core)
- [nanoid](https://github.com/ai/nanoid)


## Table of Contents

- [Installation](#installation)
- [Server](#server)
- [Client](#client)
- [BroadcastMessage](#broadcastMessage)
- [Contributing](#contributing)
- [License](#license)


## Installation

To add Broadcast to your project, use the following command with your favorite package manager:

```bash
yarn add @alien-worlds/aw-broadcast
```

## Server

Server listens to incoming network connections from clients and provides them with data or services. You can set up the server as follows:

```javascript
const server: BroadcastServer = new BroadcastTcpServer({ host: 'localhost', port: 9000 });
// Optionally set a handler for all incoming messages from clients
server.onMessage((message: BroadcastMessage) => {
  // handle broadcast message
});

await server.start();
```

If needed, the server can also send messages to clients or a specific channel:

```javascript
server.sendMessage(BroadcastMessage.sendChannelMessage(...));
```

### Server Features

The Broadcast TCP Server implementation includes these features:

- If a message cannot be delivered, it is stored in a queue and will be re-sent when the recipient becomes available.
- The server can broadcast its own messages to all connected clients or to specific clients or channels.
- If a message fails to reach a recipient, the server sends a message to the sender notifying them of the delivery failure.
- If a connection is lost, the server will attempt to reestablish it at regular intervals.

## Client

To start the client, follow these steps:

```javascript
const client: BroadcastClient = new BroadcastTcpClient({ host: 'localhost', port: 9000 }, <optional_client_name>);
client.onMessage('channel_name', (message: BroadcastMessage) => {
   // Handle incoming message
});
client.connect();
```

To send a message to a channel or a specific client, call the `sendMessage` method with the `BroadcastMessage` object:

```javascript
client.sendMessage(BroadcastMessage.sendChannelMessage(...));
```

## BroadcastMessage

`BroadcastMessage` is a utility to create messages within the broadcast system. It provides several static methods for message creation. Each message contains an ID, client, channel, name, data, and a persistence flag.

### Properties

- `id`: The unique identifier of the message.
- `client`: The target client for the message.
- `channel`: The target channel for the message.
- `name`: Optional name of the message.
- `data`: The data to be sent in the message.
- `persistent`: Determines whether the message is persistent and whether to add it to the stack in the event of a message undelivered. Default value is `true`


### Methods

#### createChannelMessage
Creates a message to be sent to a specific channel.
```javascript
const message = BroadcastMessage.createChannelMessage('room_1', 'Hello world');
```
#### createClientMessage
Creates a message to be sent to a specific client.
```javascript
const message = BroadcastMessage.createClientMessage('user1', 'Hello world');
```
#### createMultiChannelMessage
Creates a message to be sent to several channels at once.
```javascript
const message = BroadcastMessage.createMultiChannelMessage(['room_1', 'room_2'], 'Hello world');
```
#### createGroupMessage
Creates a message to be sent to a group of clients.
```javascript
const message = BroadcastMessage.createGroupMessage(['user1', 'user2'], 'Hello world');
```
#### create
Creates a message that can be sent to both a specific client and a specific channel.
```javascript
const message = BroadcastMessage.create('user1', 'room_1', 'Hello world');
```

By leveraging the `BroadcastMessage` utility, you can easily manage the creation and sending of messages within your distributed systems.

---

This package has been meticulously designed and built to provide a solid foundation for your distributed systems. By understanding the key concepts outlined above, you should be able to start using

it effectively. Enjoy seamless inter-process communication with Broadcast!

## Contributing

We welcome contributions from the community. Before contributing, please read through the existing issues on this repository to prevent duplicate submissions. New feature requests and bug reports can be submitted as an issue. If you would like to contribute code, please open a pull request.

## License

This project is licensed under the terms of the MIT license. For more information, refer to the [LICENSE](./LICENSE) file.


