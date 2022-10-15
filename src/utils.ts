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

export function decodeJwtHeader(jwt: string) {
  const [base64] = jwt.split('.');
  const buffer = Buffer.from(base64, 'base64');
  return buffer.toString();
}

export function getBearerToken(auth?: string) {
  if (auth) {
    const [scheme, credentials] = auth.split(' ');
    if (scheme.toLocaleLowerCase() === 'bearer') {
      return credentials;
    }
  }
}
