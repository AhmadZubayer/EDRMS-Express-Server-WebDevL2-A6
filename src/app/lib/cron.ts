import cron from "node-cron";
import { PaymentStatus } from "../../generated/prisma/enums";
import { trashService } from "../module/trash/trash.service";
import { logger } from "./logger";
import { prisma } from "./prisma";

// every 10 minutes: close payments that were started but never finished
const cancelStalePendingPayments = () => {
	cron.schedule("*/10 * * * *", async () => {
		try {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

			const cancelledPayments = await prisma.payment.updateMany({
				where: {
					status: PaymentStatus.PENDING,
					createdAt: { lt: oneHourAgo },
				},
				data: {
					status: PaymentStatus.CANCELLED,
				},
			});

			if (cancelledPayments.count > 0) {
				logger.info(
					{ count: cancelledPayments.count },
					"Cron: Cancelled stale pending payments older than 1 hour",
				);
			}
		} catch (error) {
			logger.error(
				{ err: error },
				"Cron: Failed to cancel stale pending payments",
			);
		}
	});
};

// every day at 03:00: permanently remove trash items older than 30 days
const cleanupExpiredTrash = () => {
	cron.schedule("0 3 * * *", async () => {
		try {
			const { removed } = await trashService.cleanupExpiredTrashFromDB();

			if (removed > 0) {
				logger.info({ count: removed }, "Cron: Purged expired trash items");
			}
		} catch (error) {
			logger.error({ err: error }, "Cron: Failed to purge expired trash items");
		}
	});
};

export const startCronJobs = () => {
	cancelStalePendingPayments();
	cleanupExpiredTrash();

	logger.info("Cron jobs scheduled");
};
