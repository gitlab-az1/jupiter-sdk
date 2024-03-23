import Credentials from './Credentials';


export interface ApiGateway {
  readonly credentials: Credentials;
}

export class Jupiter implements ApiGateway {
  readonly #c: Credentials;

  public constructor(
    credentials: Credentials // eslint-disable-line comma-dangle
  ) {
    if(!credentials ||
      !(credentials instanceof Credentials)) {
      throw new Error('Invalid credentials');
    }

    this.#c = credentials;
  }

  public get credentials(): Credentials {
    return this.#c;
  }
}


/**
 * Create a new instance of the Jupiter API Gateway
 * 
 * @param {string} apiKey The API key 
 * @param {string} token The API bearer token
 * @param {string|undefined} secretServiceKey The secret key of the service you want to access 
 * @returns {ApiGateway} The Jupiter API Gateway
 */
export function api(
  apiKey: string,
  token: string,
  secretServiceKey?: string // eslint-disable-line comma-dangle
): ApiGateway {
  return new Jupiter(
    new Credentials(
      apiKey,
      token,
      secretServiceKey // eslint-disable-line comma-dangle
    ) // eslint-disable-line comma-dangle
  );
}
