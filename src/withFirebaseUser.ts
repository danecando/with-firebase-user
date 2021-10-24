import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiRequestWithFirebaseUser, FirebaseUser } from './types';
import jwt from 'jsonwebtoken';
import { getBearerToken } from './utils/headers';
import { decodeJwtHeader } from './utils/jwt';
import { fetchPublicKeys } from './utils/fetchPublicKeys';

const FIREBASE_AUTH_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
interface WithFirebaseUserOptions {
  clientCertUrl?: string;
  projectId?: string;
}

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
    const { projectId, clientCertUrl } = Object.assign(
      {},
      {
        clientCertUrl: FIREBASE_AUTH_CERT_URL,
      },
      options
    );

    // copy request object for decoration with firebase user
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
        // decode jwt with public key
        const decodedToken = jwt.verify(accessToken, publicKey, {
          audience: projectId,
          issuer: projectId && `https://securetoken.google.com/${projectId}`,
        });

        if (typeof decodedToken === 'object') {
          // create user object we decorate req with from decoded token
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
      console.info('withFirebaseUser: ', err);
    }

    return handler(decoratedReq, res);
  };
