import { Credentials } from './Credentials';


/* eslint-disable no-magic-numbers */
describe('credentials', () => {
  test('it should be ok', () => {
    expect(25 ** 0.5).toBe(5);
  });

  // 32 bytes random hex string
  const API_KEY = 'a'.repeat(32);

  // jwt
  const BEARER_TOKEN = 'jwt'.repeat(32);

  // base64 encoded 16 bytes random string
  const SECRET_SERVICE_KEY = Buffer.from('b'.repeat(16)).toString('base64');

  test('should be able to create a new instance', () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN,
      SECRET_SERVICE_KEY // eslint-disable-line comma-dangle
    );

    expect(c).toBeInstanceOf(Credentials);
  });

  test('should be able to create a new instance without secret', () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN // eslint-disable-line comma-dangle
    );

    expect(c).toBeInstanceOf(Credentials);
  });

  test('should be able to get the apiKey', () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN,
      SECRET_SERVICE_KEY // eslint-disable-line comma-dangle
    );
    
    expect(c.apiKey).toBe(API_KEY);
  });

  test('should be able to get the token', () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN,
      SECRET_SERVICE_KEY // eslint-disable-line comma-dangle
    );

    expect(c.token).toBe(BEARER_TOKEN);
  });

  test('should be able to get the secret', () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN,
      SECRET_SERVICE_KEY // eslint-disable-line comma-dangle
    );

    expect(c.secret).toBeDefined();
    expect(c.secret).toBeInstanceOf(Buffer);
  });

  test('shouldn\'t be able to get the secret as undefined', () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN // eslint-disable-line comma-dangle
    );
    
    expect(c.secret).toBeUndefined();
  });

  test('should be able to get the credentialsInstanceId', () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN,
      SECRET_SERVICE_KEY // eslint-disable-line comma-dangle
    );

    expect(c.credentialsInstanceId).toBeDefined();
    expect(typeof c.credentialsInstanceId).toBe('string');
  });

  test('should throw an error if apiKey is not a string', () => {
    expect(() => {
      new Credentials(
        123 as never,
        BEARER_TOKEN,
        SECRET_SERVICE_KEY // eslint-disable-line comma-dangle
      );
    }).toThrow('apiKey must be a string');
  });

  test('should throw an error if apiToken is not a string', () => {
    expect(() => {
      new Credentials(
        API_KEY,
        123 as never,
        SECRET_SERVICE_KEY // eslint-disable-line comma-dangle
      );
    }).toThrow('apiToken must be a string');
  });

  test('should be able to sign and verify a message if secret is provided', async () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN,
      SECRET_SERVICE_KEY // eslint-disable-line comma-dangle
    );

    const message = 'hello world';
    const signature = await c.sign(message);

    expect(signature).toBeDefined();
    expect(signature).not.toEqual(message);

    const verified = await c.verify(message, signature);
    expect(verified).toBe(true);
  });

  test('should be able to sign and verify a message with custom options', async () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN,
      SECRET_SERVICE_KEY // eslint-disable-line comma-dangle
    );
    
    const message = 'hello world';
    const signature = await c.sign(message);
    
    expect(signature).toBeDefined();
    expect(signature).not.toEqual(message);
    
    const verified = await c.verify(message, signature, {
      timestamp: Date.now(),
      timeout: 1000 // eslint-disable-line comma-dangle
    });
    
    expect(verified).toBe(true);
  });

  test('should throw an error if secret is not provided', async () => {
    const c = new Credentials(
      API_KEY,
      BEARER_TOKEN // eslint-disable-line comma-dangle
    );
    
    const message = 'hello world';

    await expect(c.sign(message)).rejects.toThrow('Cannot sign content without a secret key');
    await expect(c.verify(message, 'signature')).rejects.toThrow('Cannot verify content without a secret key');
  });
});
