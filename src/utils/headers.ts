export function getBearerToken(auth?: string) {
  if (auth) {
    const [scheme, credentials] = auth.split(' ');
    if (scheme.toLocaleLowerCase() === 'bearer') {
      return credentials;
    }
  }
}

export function getMaxAge(cacheControl?: string) {
  let maxAge = 0;

  if (!cacheControl) {
    return maxAge;
  }

  const parts = cacheControl.split(',').reduce((acc, item) => {
    const [key, value] = item.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  if (Object.hasOwnProperty.call(parts, 'max-age')) {
    const parsedMaxAge = parseInt(parts['max-age']);
    if (!isNaN(parsedMaxAge)) {
      maxAge = parsedMaxAge;
    }
  }

  return maxAge;
}
