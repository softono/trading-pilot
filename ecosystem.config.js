const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  apps: [
    {
      name: isProduction ? "trading-pilot" : "trading-pilot-dev",
      script: "node_modules/next/dist/bin/next",
      args: isProduction ? "start" : "dev -H 127.0.0.1 -p 3042",
      env: {
        NODE_ENV: process.env.NODE_ENV || "development",
      },
    },
    {
      name: isProduction ? "trading-pilot-worker" : "trading-pilot-worker-dev",
      script: "node_modules/tsx/dist/cli.mjs",
      args: "--env-file=.env src/server/workers/worker.ts",
      env: {
        NODE_ENV: process.env.NODE_ENV || "development",
      },
    },
  ],
};
