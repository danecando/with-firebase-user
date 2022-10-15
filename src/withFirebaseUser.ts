import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiRequestWithFirebaseUser, FirebaseUser } from './types';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getBearerToken, decodeJwtHeader, fetchPublicKeys } from './utils';

interface WithFirebaseUserOptions {
  clientCertUrl?: string;
  projectId?: string;
  isEmulator: boolean;
}

const FIREBASE_AUTH_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

export const withFirebaseUser =
  (
    handler: (
      req: NextApiRequestWithFirebaseUser,
      res: NextApiResponse
    ) => Promise<void>,
    options?: WithFirebaseUserOptions
  ) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    // merge options with defaults
    const { projectId, clientCertUrl, isEmulator } = Object.assign(
      {},
      {
        clientCertUrl: FIREBASE_AUTH_CERT_URL,
        isEmulator: false,
      },
      options
    );

    // copy request object
    const decoratedReq: NextApiRequestWithFirebaseUser = Object.assign(
      {},
      req,
      {
        user: undefined,
      }
    );

    // check request for access token
    const accessToken = getBearerToken(req.headers.authorization);
    if (!accessToken) {
      return handler(decoratedReq, res);
    }

    try {
      const publicKeys = await fetchPublicKeys(clientCertUrl);

      // parse jwt header for public key id
      const jwtHeader = JSON.parse(decodeJwtHeader(accessToken));

      const publicKey = publicKeys[jwtHeader.kid];
      if (publicKey) {
        let decodedToken: string | JwtPayload | null;

        if (isEmulator) {
          decodedToken = jwt.decode(accessToken);
        } else {
          decodedToken = jwt.verify(accessToken, publicKey, {
            audience: projectId,
            issuer: projectId && `https://securetoken.google.com/${projectId}`,
          });
        }

        if (typeof decodedToken === 'object' && decodedToken !== null) {
          // might want to support custom claims in the future
          const user: FirebaseUser = {
            user_id: decodedToken.user_id ?? decodedToken.sub,
            name: decodedToken.name,
            email: decodedToken.email,
            email_verified: decodedToken.email_verified,
          };

          decoratedReq.user = user;
        }
      }
    } catch (err) {
      console.error('withFirebaseUser: ', err);
    }

    return handler(decoratedReq, res);
  };
