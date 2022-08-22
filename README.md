# with-firebase-user

A higher order function that decodes a Firebase Auth JWT and decorates the NextJS API request object with a Firebase user.

## Introduction

I wanted to use Firebase Auth to authenticate and secure routes in my NextJS API.

**The Problem**

- Unable to add middleware to express middleware chain for NextJS API routes.
- Don't want to add a large library for a lightweight operation to be run on a serverless function.

**My Solution**

- Follow the [Verify ID Tokens using a third party JWT library](https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library) instructions from the firebase auth docs to securely verify and decode the JWT.
- Write a higher order function to decorate the NextJS request object with authenticated Firebase user data.

## Installation

```bash
npm i --save with-firebase-user
```

or

```bash
yarn add with-firebase-user
```

## Usage

Pass your NextJS handler to `withFirebaseUser` and it will add the authenticated user to the request object `user` key.

```js
import { withFirebaseUser } from 'with-firebase-user';

const handler = async (req, res) => {
  res.send(req.user); // FirebaseUser
};

export default withFirebaseUser(handler);
```

Make sure to add your JWT to the request headers on the client.

```javascript
fetch('/api/users', {
  headers: {
    Authorization: 'Bearer <JWT>',
  },
});
```

### Decoded user data

```ts
interface FirebaseUser {
  name?: string;
  user_id: string;
  email?: string;
  email_verified?: boolean;
}
```

## API

```typescript
const withFirebaseUser: (
  handler: (
    req: NextApiRequestWithFirebaseUser,
    res: NextApiResponse
  ) => Promise<void>,
  options?: WithFirebaseUserOptions | undefined
) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
```

### WithFirebaseUserOptions (passed as a second argument to withFirebaseUser function)

```typescript
interface WithFirebaseUserOptions {
  clientCertUrl?: string; // defaults to url provided in Firebase auth docs
  projectId?: string; // verifies the audience and issuer of the JWT when provided
  isEmulator?: boolean; // defaults to false
}
```

## Contributing

Feel free

## License

Do whatever you want with this code
