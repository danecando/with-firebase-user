import https from 'https';

export function fetchPublicKeys(
  certUrl: string
): Promise<Record<string, string>> {
  const error = new Error('Failed to fetch public keys from server');
  return new Promise((resolve, reject) => {
    https
      .get(certUrl, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const keys = JSON.parse(body);
          resolve(keys);
        });
      })
      .on('error', () => {
        reject(error);
      });
  });
}
