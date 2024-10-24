/**
 * Example of [Jest](https://jestjs.io/docs/getting-started) unit tests
 */

import { coerceBooleanString, buildQueryString } from '../utils';

describe('coerceBooleanString', () => {
  it('should return "true" for undefined input', () => {
    expect(coerceBooleanString(undefined)).toBe('true');
  });

  it('should return "true" for input string "true"', () => {
    expect(coerceBooleanString('true')).toBe('true');
  });

  it('should return "false" for input string "false"', () => {
    expect(coerceBooleanString('false')).toBe('false');
  });
});

describe('buildQueryString', () => {
  it('should convert { headless: "true", baseUrl: "https://example.com" } to a query string', () => {
    const params = { headless: 'true', baseUrl: 'https://example.com' };
    const result = buildQueryString(params);
    expect(result).toBe('headless=true&baseUrl=https%3A%2F%2Fexample.com');
  });

  it('should convert { headless: "false", baseUrl: "https://example.com" } to a query string', () => {
    const params = { headless: 'false', baseUrl: 'https://example.com' };
    const result = buildQueryString(params);
    expect(result).toBe('headless=false&baseUrl=https%3A%2F%2Fexample.com');
  });

  it('should encode special characters in baseUrl', () => {
    const params = {
      headless: 'true',
      baseUrl: 'https://example.com/search?q=Jest'
    };
    const result = buildQueryString(params);
    expect(result).toBe(
      'headless=true&baseUrl=https%3A%2F%2Fexample.com%2Fsearch%3Fq%3DJest'
    );
  });

  it('should return an empty string if no valid parameters are provided', () => {
    const params = {};
    const result = buildQueryString(params);
    expect(result).toBe('');
  });
});
