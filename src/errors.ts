import { BroadcastErrorType } from './enums';

export class BroadcastError extends Error {
  constructor(public type: BroadcastErrorType, message?: string) {
    super(message);
  }
}

export class BroadcastSendError extends BroadcastError {
  constructor(private reason?: Error) {
    super(
      BroadcastErrorType.SendError,
      `An error occurred while sending a message. ${reason ? reason.message : ''}`
    );
  }
}
