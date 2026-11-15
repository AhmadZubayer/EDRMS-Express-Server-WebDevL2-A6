import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";
import { redisClient } from "../lib/redis";

let connecting: Promise<unknown> | null = null;

// On serverless hosts server.ts never runs, so connect Redis on first use.
export const ensureRedis = async (
	_req: Request,
	_res: Response,
	next: NextFunction,
) => {
	try {
		if (!redisClient.isOpen) {
			connecting ??= redisClient.connect().finally(() => {
				connecting = null;
			});
			await connecting;
		}
		next();
	} catch (error) {
		logger.error({ err: error }, "Redis connection failed");
		next(error);
	}
};
