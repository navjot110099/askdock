/**
 * App logger — use this instead of `console` (ESLint enforces it).
 *
 * `debug` and `info` are for local development and are silent in production.
 * `warn` and `error` always reach the server logs (Vercel captures them), so
 * real failures are never swallowed.
 *
 *   const log = logger("chat");
 *   log.debug("retrieved", chunks.length, "chunks");
 *   log.error("stream failed", error);
 */
const silent = process.env.NODE_ENV === "production";

type Args = unknown[];

export function logger(scope: string) {
  const tag = `[${scope}]`;
  return {
    debug: (...args: Args) => {
      if (!silent) console.debug(tag, ...args);
    },
    info: (...args: Args) => {
      if (!silent) console.info(tag, ...args);
    },
    warn: (...args: Args) => console.warn(tag, ...args),
    error: (...args: Args) => console.error(tag, ...args),
  };
}
