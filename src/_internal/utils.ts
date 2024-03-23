
import type { DataType } from './types';



export const APP_VERSION = '1.0.0';
export const API_BASE_URL = 'https://api.jupiterworkspace.com/api/exposed/v1';


export const RADIX_16 = 0x10;


export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuid(): string {
  let d = new Date().getTime();

  if(typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); // use high-precision timer if available
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // eslint-disable-next-line no-magic-numbers
    const r = (d + Math.random() * RADIX_16) % RADIX_16 | 0;
    d = Math.floor(d / RADIX_16);
      
    // eslint-disable-next-line no-magic-numbers
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(RADIX_16);
  });
}

export const uuidWithoutSlashes = () => uuid().replace(/-/g, '');


// eslint-disable-next-line no-magic-numbers
export const shortId = (length: 8 | 12 = 8) => uuid().split('-')[length === 12 ? 4 : 0];


export const DECIMAL_BASE_NUMBERS: { /* eslint-disable no-magic-numbers */
  readonly Zero: 0;
  readonly One: 1;
  readonly Two: 2;
  readonly Three: 3;
  readonly Four: 4;
  readonly Five: 5;
  readonly Six: 6;
  readonly Seven: 7;
  readonly Eight: 8;
  readonly Nine: 9;
} = Object.freeze({ /* eslint-enable no-magic-numbers */
  Zero: 0,
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
  Six: 6,
  Seven: 7,
  Eight: 8,
  Nine: 9,
} as const);


const kindOf = (cache => (thing: any) => {
  const str = Object.prototype.toString.call(thing);
  // eslint-disable-next-line no-magic-numbers
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));


export const kindOfTest = (type: string) => {
  type = type.toLowerCase();
  return (thing: any) => kindOf(thing) === type;
};


/**
 * Test if a value is of a certain type
 * @param type The type to test against
 * @returns {boolean} True if the value is of the specified type, otherwise false
 */
export const typeofTest = (type: DataType): ((thing: any) => boolean) => (thing: any) => typeof thing === type;


/**
 * Determine if a value is a Buffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
export function isBuffer(val: any): boolean {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
const isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
export function isArrayBufferView(val: any): boolean {
  let result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a Function
 *
 * @param {*} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
export const isFunction = typeofTest('function');

/**
 * Determine if a value is undefined
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if the value is undefined, otherwise false
 */
export const isUndefined = typeofTest('undefined');

/**
 * Determine if a value is a plain Object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a plain Object, otherwise false
 */
export function isPlainObject(val: any): boolean {
  if(!val || val == null || val == undefined) return false;

  if(Array.isArray(val)) return false;
  if(kindOf(val) !== 'object' || typeof val !== 'object') return false;

  const prototype = Object.getPrototypeOf(val);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
}
