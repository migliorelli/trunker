import { ErrorOptions, Flag, Flags, Trunker, TrunkerOptions } from "@trunker/types";
import { Request } from "express";

/**
 * Creates a new Trunker instance with the given options.
 *
 * @param options The options for the Trunker instance.
 * @returns A new Trunker instance.
 */
export function createTrunker<T extends Flags>(options: TrunkerOptions<T>): Trunker<T> {  const errorCode = options.error?.statusCode ?? 403;
  return {
    options,
    middleware() {
      return (req, _res, next) => {
        req.trunker = req.trunker ?? options.flags;
        next();
      };
    },
    restrict(target) {
      return async (req, res, next) => {
        if (req.trunker === undefined) {
          throw new Error(
            "TrunkerError: req.trunker not found. Did you `app.use(trunker.middleware)`?",
          );
        }

        if (typeof target === "string") {
          const isActive = await isFlagActive(req, target);
          if (!isActive) {
            res.status(errorCode).json(getErrorResponse(target, options.error));
            return;
          }
        }

        if (Array.isArray(target)) {
          for (let flagName of target) {
            const isActive = await isFlagActive(req, flagName as string);
            if (!isActive) {
              res
                .status(errorCode)
                .json(getErrorResponse(flagName as string, options.error));
              return;
            }
          }
        }

        next();
      };
    },
  };
}

/**
 * It checks if the flag is `active` for the given `request`.
 *
 * @param req the request object
 * @param flagName the name of the flag
 * @returns a boolean
 */
export async function isFlagActive(
  req: Request,
  flagName: string,
): Promise<boolean> {
  if (!req.trunker || !req.trunker[flagName]) {
    return false;
  }

  const flag = req.trunker[flagName];
  if (typeof flag.active === "function") {
    return await flag.active(req);
  }

  return flag.active;
}

/**
 * It creates a `TrunkerOptions` object from the `environment variables`.
 *
 * @param env the `environment variables`
 * @param options the aditional `options` for the Trunker instance
 * @returns A complete `TrunkerOptions` object
 */
export function fromEnv(
  env: Record<string, any>,
  options?: Omit<TrunkerOptions, "flags">,
): TrunkerOptions {
  const flags: Record<string, Flag> = {};

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("TRUNKER_")) {
      const flagName = convertFlagName(key);

      if (["true", "false"].includes(value)) {
        flags[flagName] = { active: value === "true" };
      } else {
        throw new Error(
          `Invalid value for flag ${flagName}: ${value}. Only boolean values are supported.`,
        );
      }
    }
  }

  return { ...options, flags };
}

/**
 * It returns a `json` object with the error message or a `string` with the error message.
 *
 * @param flagName the name of the flag that is not active
 * @param errorOptions the `trunker.options.error` for the error response
 * @returns
 */
function getErrorResponse(
  flagName: string,
  errorOptions: ErrorOptions | undefined,
) {
  const template = errorOptions?.template ?? "Flag {flag} is not active";
  const message = template.replace(/\{flag\}/, flagName);

  if (errorOptions === undefined || errorOptions.format === "json") {
    return {
      [errorOptions?.key ?? "error"]: message,
    };
  }

  return message;
}

/**
 * It converts a `TRUNKER_` environment variable to a camelCased flag name.
 *
 * @param key the `TRUNKER_` environment variable
 * @returns the flag name
 */
function convertFlagName(key: string) {
  const str = key.replace("TRUNKER_", "").toLowerCase();
  return str.replace(/(_[a-z])/g, (g) => g[1].toUpperCase());
}
