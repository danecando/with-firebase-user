import https from 'https';
import { getMaxAge } from './headers';

const JWT_PUBLIC_KEYS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

export function fetchPublicKeys(): Promise<Record<string, any>> {
  const error = new Error('Failed to fetch public keys from server');
  return new Promise((resolve, reject) => {
    https
      .get(JWT_PUBLIC_KEYS_URL, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const maxAge = getMaxAge(res.headers['cache-control']);
          resolve({
            expires: Date.now() + maxAge,
            keys: JSON.parse(body),
          });
        });
      })
      .on('error', () => {
        reject(error);
      });
  });
}
