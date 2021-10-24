export function getBearerToken(auth?: string) {
  if (auth) {
    const [scheme, credentials] = auth.split(' ');
    if (scheme.toLocaleLowerCase() === 'bearer') {
      return credentials;
    }
  }
}
