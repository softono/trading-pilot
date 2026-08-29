const isProduction = process.env.NODE_ENV !== "development";
const NODE_ENV = isProduction ? "production" : "development";

module.exports = {
  apps: [
    {
      name: isProduction ? "trading-pilot" : "trading-pilot-dev",
      script: "node_modules/next/dist/bin/next",
      args: isProduction
        ? "start -H 127.0.0.1 -p 3042"
        : "dev -H 127.0.0.1 -p 3042",
      env: {
        NODE_ENV,
      },
    },
    {
      name: isProduction ? "trading-pilot-worker" : "trading-pilot-worker-dev",
      script: "node_modules/tsx/dist/cli.mjs",
      // --conditions=react-server makes the `server-only` marker package resolve
      // to its empty stub instead of throwing, so server modules that guard with
      // `import "server-only"` (config, schema, sqliteCache) can run under tsx.
      args: "--conditions=react-server --env-file=.env src/server/workers/worker.ts",
      env: {
        NODE_ENV,
      },
    },
  ],
};
