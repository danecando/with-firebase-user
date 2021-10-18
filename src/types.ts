import type { NextApiRequest } from 'next';

export interface FirebaseUser {
  name?: string;
  user_id: string;
  email?: string;
  email_verified?: boolean;
}

export interface NextApiRequestWithFirebaseUser extends NextApiRequest {
  user?: FirebaseUser;
}
