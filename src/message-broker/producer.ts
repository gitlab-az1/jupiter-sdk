import HttpClient from './http';
import Credentials from '../Credentials';
import Slicer, { Chunk } from '../_internal/Slicer';
import { aesEncrypt } from '../_internal/crypto';
import { EncoderDecoder, Json } from '../encoder';
import { DECIMAL_BASE_NUMBERS } from 'src/_internal/utils';


export type ProduceOptionsWithoutMessageSplitting = {
  partition?: number;
  driver: 'socketbus' | 'virtual-http';
  headers?: { key: string; value: string }[];
  key?: string;
};

export type ProduceOptionsWithMessageSplitting = {
  partition?: number;
  driver: 'socketbus' | 'virtual-http';
  headers?: { key: string; value: string }[];
  key?: string;
  split: {
    maxBlockSize: number;
    maxBlocks?: number;
    mode: 'serial';
  };
};

export type ProduceResponse = {
  timestamp: number;
}

export type MessagePreflightResponse = {
  messageId: string;
  transporterKey: string;
  blocksCount: number;
  target: string;
  timestamp: number;
}

export class Producer {
  readonly #client: HttpClient;
  readonly #encoder: EncoderDecoder = new Json();

  public constructor(client: HttpClient);
  public constructor(url: string, credentials: Credentials);
  public constructor(urlOrClient: string | HttpClient, credentials?: Credentials) {
    if(typeof urlOrClient === 'string') {
      if(!(credentials instanceof Credentials)) {
        throw new TypeError('credentials must be an instance of Credentials');
      }

      this.#client = new HttpClient({
        baseUrl: urlOrClient,
        credentials,
        defaultHeaders: {
          'Accept-Language': 'en-US',
        },
      });
    } else if(urlOrClient instanceof HttpClient) {
      this.#client = urlOrClient;
    } else {
      throw new TypeError('Please provide a valid HttpClient instance or a string url');
    }
  }

  public publish<T = unknown>(topic: string, message: T, options?: ProduceOptionsWithMessageSplitting): Promise<MessagePreflightResponse>;
  public publish<T = unknown>(topic: string, message: T, options?: ProduceOptionsWithoutMessageSplitting): Promise<ProduceResponse>;
  public publish<T = unknown>(topic: string, message: T, options?: ProduceOptionsWithoutMessageSplitting | ProduceOptionsWithMessageSplitting): Promise<ProduceResponse | MessagePreflightResponse> {
    return this.#publishMessage<T>(topic, message, options);
  }

  async #publishMessage<T>(topic: string, message: T, options?: ProduceOptionsWithMessageSplitting | ProduceOptionsWithoutMessageSplitting): Promise<ProduceResponse | MessagePreflightResponse> {
    if(!!options && options.driver !== 'virtual-http') {
      throw new Error('Only `virtual-http` driver is supported for now');
    }

    if(!this.#client.credentials.secret) {
      throw new Error('Cannot publish message without secret service key in credentials');
    }

    const shouldSplitMessage = !!options && 'split' in options;
    if(!shouldSplitMessage) return this.#deliverFullMessage(topic, message, options as ProduceOptionsWithoutMessageSplitting);
    
    const encodedMessage = this.#encoder.encode(message);
    const messageSignature = await this.#client.credentials.sign(encodedMessage);
    const encryptedMessage = await aesEncrypt(this.#client.credentials.secret, encodedMessage, 'base64');

    const blocks: (Chunk & { last: boolean; })[] = [];

    if(encryptedMessage.length <= options.split.maxBlockSize) {
      blocks.push({
        index: 0,
        value: encryptedMessage,
        hash: messageSignature,
        last: true,
      });
    } else {
      const slicer = new Slicer(encryptedMessage, options.split.maxBlockSize);
      await slicer.slice();

      for(let i = 0; i < slicer.chunks.length; i++) {
        blocks.push({
          index: i,
          value: slicer.chunks[i].value,
          hash: slicer.chunks[i].hash,
          last: i === slicer.chunks.length - DECIMAL_BASE_NUMBERS.One,
        });
      }
    }

    const preflight = await this.#client.put<MessagePreflightResponse>([
      'api',
      'exposed',
      'v1',
      'queues',
      'topics',
      topic,
      'messages',
      'preflight',
    ], { timestamp: Date.now() }, {
      headers: {
        'X-Jupiter-Queue-Message-Blocks-Count': blocks.length.toString(),
        'X-Jupiter-Queue-Message-Signature': messageSignature,
      },
    });
  }

  async #deliverFullMessage<T>(topic: string, message: T, options: ProduceOptionsWithoutMessageSplitting): Promise<ProduceResponse> {
    throw { topic, message, options };
  }
}

export default Producer;
