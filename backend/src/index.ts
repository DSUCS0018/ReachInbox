import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";

const server = app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});

let shuttingDown = false;

const shutdown = (signal: string): void => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`${signal} received; shutting down`);

  const timeout = setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  timeout.unref();

  server.close((serverError) => {
    if (serverError) {
      console.error("HTTP server shutdown failed", serverError);
      process.exitCode = 1;
    }

    Promise.all([prisma.$disconnect(), redis.quit()])
      .then(() => {
        clearTimeout(timeout);
      })
      .catch((error: unknown) => {
        console.error("Service shutdown failed", error);
        process.exitCode = 1;
        clearTimeout(timeout);
      });
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));