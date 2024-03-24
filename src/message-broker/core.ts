import HttpClient from './http';
import Producer from './producer';
import Credentials from '../Credentials';
import { API_BASE_URL, DECIMAL_BASE_NUMBERS } from '../_internal/utils';


export type Header = { key: string; value: string };

export type Message = {
  topic: string;
  partition: number;
  partitioned: boolean;
  offset: number;
  timestamp: number;
  key: string;
  value: string;
  headers: Header[];
};


export class MessageBroker {
  readonly #client: HttpClient;
  #producer?: Producer;

  public constructor(credentials: Credentials) {
    if(!(credentials instanceof Credentials)) {
      throw new TypeError('credentials must be an instance of Credentials');
    }

    if(!credentials.secret) {
      throw new TypeError('credentials must contain the secret key of the queue you want to connect to');
    }

    this.#client = new HttpClient({
      baseUrl: API_BASE_URL.split('/api/')[DECIMAL_BASE_NUMBERS.Zero].trim(),
      credentials,
      defaultHeaders: {
        'Accept-Language': 'en-US',
      },
    });
  }

  public get producer(): Producer {
    if(!this.#producer) {
      this.#producer = new Producer(this.#client);
    }

    return this.#producer;
  }
}
