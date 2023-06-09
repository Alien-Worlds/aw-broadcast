export type BroadcastConnectionConfig = {
  url?: string;
  port?: number;
  host?: string;
};

export type BroadcastConfig = BroadcastConnectionConfig & {
  clientName?: string;
};

export type ConnectionStateHandler = (...args: unknown[]) => Promise<void>;
