export function decodeJwtHeader(jwt: string) {
  const [base64] = jwt.split('.');
  const buffer = Buffer.from(base64, 'base64');
  return buffer.toString();
}
