import { Flags } from ".";

declare module "express-serve-static-core" {
  interface Request {
    /**
     * The trunker `flags` for the request.
     */
    trunker: Flags;
  }
}
