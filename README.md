# use-firebase-user (wip)

A higher order function that decodes a Firebase Auth JWT and decorates the NextJS API request object with a Firebase user.

### Warning

This software is currently experimental as I haven't written any tests or validated it in production for any period of time. I have only briefly tested it during the development of a project I am working on.

## Introduction

I wanted to use Firebase Auth to authenticate and secure routes in my NextJS API.

**The Problem**

- Unable to add middleware to express middleware chain for NextJS API routes.
- Don't want to add the large Firebase Admin library for light weight serverless functions on Vercel.

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

## Configure Caching on Vercel

This library attempts to cache the public keys that the Firebase Auth JWT's are signed with. To do this you need to add some configuration to your Vercel project to be able to read/write the file system. Here is the documentation for how this works: [How can I use files in serverless functions](https://vercel.com/support/articles/how-can-i-use-files-in-serverless-functions#node.js). By default the library uses a file called `cachedPublicKeys.json`.

### Instructions

Create `_files/cachedPublicKeys.json` in the root of your Next project.

Update your Vercel config to include the `_files` directory for relevant serverless functions.

```json
{
  "functions": {
    "pages/api/user.js": {
      "includeFiles": "_files/**"
    }
  }
}
```

For NextJS currently you need to enable an expirimental feature called `nftTracing` as well for the filesystem caching to work. See [this issue](https://github.com/vercel/next.js/issues/8251#issuecomment-915287535) for more details.

### Instructions

```
yarn add next@canary
```

Add the following to your projects `next.config.js`

```javascript
experimental: {
  nftTracing: true;
}
```

## Usage

Pass your NextJS handler to `withFirebaseUser` and it will add the authenticated user to the request object `user` key.

```js
import { withFirebaseUser } from 'with-firebase-user';

const handler = async (req, res) => {
  res.send(req.user);
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
  cacheFilename?: string; // defaults to `cachedPublicKeys.json`
  projectId?: string; // verifies the audience and issuer of the JWT when provided
}
```

## Contributing

If you decide to use this library and find any issues please open a new issue reporting the bug. If you'd like to contribute some code, open a PR! :) Thanks
