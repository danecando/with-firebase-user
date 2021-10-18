import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiRequestWithFirebaseUser, FirebaseUser } from './types';
import jwt from 'jsonwebtoken';
import { getBearerToken } from './utils/headers';
import { decodeJwtHeader } from './utils/jwt';
import { getCachedKeys, updateCachedKeys } from './utils/cache';
import { fetchPublicKeys } from './utils/fetchPublicKeys';

interface WithFirebaseUserOptions {
  cacheFilename?: string;
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
    const { cacheFilename, projectId } = Object.assign(
      {},
      {
        cacheFilename: 'cachedPublicKeys.json',
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

    let publicKeys: Record<string, any> | undefined;

    // try to pull public keys from cache
    try {
      const cachedKeys = await getCachedKeys(cacheFilename);
      if (
        cachedKeys &&
        typeof cachedKeys.expires === 'number' &&
        cachedKeys.expires > Date.now()
      ) {
        publicKeys = cachedKeys;
      }

      // otherwise fetch new public keys and save to cache file
      if (!publicKeys) {
        const freshKeys = await fetchPublicKeys();
        await updateCachedKeys(cacheFilename, freshKeys);
        publicKeys = freshKeys;
      }
    } catch (err) {
      if (err instanceof Error) {
        console.info('withFirebaseUser: ', err.message);
      }
    }

    // failed to get public keys from cache and server: epic fail
    if (
      !publicKeys ||
      typeof publicKeys.keys !== 'object' ||
      Object.values(publicKeys.keys).length < 1
    ) {
      return handler(decoratedReq, res);
    }

    try {
      // parse jwt header for public key id
      const jwtHeader = JSON.parse(decodeJwtHeader(accessToken));
      const publicKey = publicKeys.keys[jwtHeader.kid];
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
      console.error('withFirebaseUser: ', err);
    }

    // success, call decorated handler with our decorated req arg
    return handler(decoratedReq, res);
  };
