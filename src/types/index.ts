import { Request, RequestHandler } from "express";

/**
 * Flag object.
 *
 * `active` is required. Can be either a `boolean`, a function that returns a `boolean` or a function that returns a `promise` that resolves to a `boolean`.
 */
export type Flag = {
  active:
    | boolean
    | ((req?: Request) => boolean)
    | ((req?: Request) => Promise<boolean>);
};

export type Flags = Record<string, Flag>;

/**
 * Error options object.
 *
 * `statusCode` is optional. Defaults to `403`.
 * 
 * `template` is optional. Use `{flag}` to define where 
 * the flagName should be. Defaults to `Flag {flag} is not active`.
 *
 * `format` is required. Can be either `json` or `plain`.
 *
 * `key` is optional and only available if `format=json`. Defaults to `error`.
 */
export type ErrorOptions = {
  statusCode?: number;
  template?: string;
} & (
  | {
      format: "json";
      key?: string;
    }
  | {
      format: "plain";
    }
);

/**
 * Trunker options object.
 *
 * `flags` is required.
 *
 * `error` is optional.
 */
export type TrunkerOptions<T extends Flags = Flags> = {
  flags: T;
  error?: ErrorOptions;
};

export type Trunker<T extends Flags = Flags> = {
  options: TrunkerOptions<T>;
  /**
   * Trunker main middleware function that adds the `trunker` property to the request object.
   *
   * *Should always be used before a `trunker.restrict` middleware.*
   *
   * @returns A `Express.RequestHandler` function.
   */
  middleware: () => RequestHandler;
  /**
   * Trunker restrict middleware function that restricts access to the route based on given Feature Flag.
   *
   * *Should always be used after a `trunker.middleware` middleware.*
   *
   * @param { string | string[] } target The Feature Flag or Feature Flags to restrict access to.
   *
   * @returns A `Express.RequestHandler` function.
   */
  restrict: (target: keyof T | (keyof T)[]) => RequestHandler;
};
