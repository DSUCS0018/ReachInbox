import { Router } from "express";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

export const healthRouter = Router();

healthRouter.get("/", async (_request, response) => {
  const results = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping()
  ]);
  const services = {
    postgres: results[0].status === "fulfilled" ? "ok" : "unavailable",
    redis: results[1].status === "fulfilled" ? "ok" : "unavailable"
  };
  const healthy = Object.values(services).every((status) => status === "ok");

  response.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "unavailable",
    services
  });
});