# Trunker

<img src="trunker.png" alt="Trunker" style="width: 150px; height: 150px" />

A lightweight Express.js middleware to help you implement Trunk Based Development using feature flags. Easily manage and restrict access to routes based on static or dynamic flags, supporting both synchronous and asynchronous evaluation.

## Features

- Simple API for defining feature flags
- Support for static and async flag evaluation
- Restrict access to routes based on flags
- Environment variable integration
- TypeScript support out of the box

## Installation

```bash
npm install trunker
```

## Usage

### Basic Example

```ts
import express from "express";
import { createTrunker } from "trunker";

const app = express();

const trunker = createTrunker({
  flags: {
    betaFeature: { active: true },
    legacyMode: { active: false },
  },
});

app.use(trunker.middleware());

// this route is accessible because betaFeature is active
app.get("/beta", trunker.restrict("betaFeature"), (req, res) => {
  res.send("Beta feature is enabled!");
});

// this route is not accessible because legacyMode is not active
app.get("/legacy", trunker.restrict("legacyMode"), (req, res) => {
  res.send("Legacy mode is enabled!");
});

app.listen(3000);
```

### Restricting Access to Routes

You can restrict access to routes using the `restrict` middleware:

```ts
app.get(
  "/admin",
  trunker.restrict("betaFeature"),
  (req, res) => {
    res.send("Admin route with beta feature enabled");
  }
);
```

You can also restrict by multiple flags:

```ts
app.get(
  "/multi",
  trunker.restrict(["betaFeature", "legacyMode"]),
  (req, res) => {
    res.send("Route with multiple flags");
  }
);
```

### Using Environment Variables

```ts
import { fromEnv, createTrunker } from "trunker";

const trunker = createTrunker(fromEnv(process.env));
```

Environment variables should be prefixed with `TRUNKER_`, e.g.:

```
TRUNKER_BETA=true
TRUNKER_LEGACY=false
```

### Dynamic Flags

```ts
flags: {
  premiumUser: {
    active: async (req) => {
      // Custom logic, e.g., check user subscription
      return await checkUserSubscription(req.user);
    },
  },
}
```

### Checking Flags Manually

```ts
import { isFlagActive } from "trunker";

app.get("/some-route", async (req, res) => {
  if (await isFlagActive(req, "betaFeature")) {
    res.send("Feature enabled");
  } else {
    res.status(403).send("Not available");
  }
});
```

### Custom Error Responses

You can customize the error response format:

```typescript
const trunker = createTrunker({
  flags: { ... },
  error: { format: "json", key: "message", statusCode: 403 }, // or { format: "plain" }
});
```

## API

### `createTrunker(options)`
Creates the middleware. Pass an object with a `flags` property. Returns an object with `middleware()` and `restrict()` methods.

### `fromEnv(env, options?)`
Generates flag configuration from environment variables.

### `isFlagActive(req, flagName)`
Checks if a flag is active for the current request.

### `trunker.middleware()`
Express middleware to attach flags to `req.trunker`.

### `trunker.restrict(flagName | flagName[])`
Express middleware to restrict access based on one or more flags.

## TypeScript

The middleware adds a `trunker` property to the Express `Request` type. You may need to import the type definitions for full type safety.

```ts
import { type Flags } from "trunker";

declare module "express-serve-static-core" {
  interface Request {
    trunker: Flags;
  }
}
```

## License

MIT
