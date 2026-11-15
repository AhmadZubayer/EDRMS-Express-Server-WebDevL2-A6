import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../src/app/lib/prisma";
import { UserRole } from "../src/generated/prisma/enums";

const envSchema = z.object({
	SUPER_ADMIN_NAME: z.string().min(2).default("EDRMS Super Admin"),
	SUPER_ADMIN_EMAIL: z.email(),
	SUPER_ADMIN_PASSWORD: z.string().min(8),
	ADMIN_NAME: z.string().min(2),
	ADMIN_EMAIL: z.email(),
	ADMIN_PASSWORD: z.string().min(8),
	BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10),
});

const seedAccount = async (
	name: string,
	rawEmail: string,
	plainPassword: string,
	role: UserRole,
	rounds: number,
) => {
	const email = rawEmail.toLowerCase();
	const existingUser = await prisma.user.findUnique({ where: { email } });

	if (existingUser) {
		if (existingUser.role !== role) {
			throw new Error(`${email} already belongs to a ${existingUser.role} user`);
		}
		console.log(`${role} already exists: ${email}`);
		return;
	}

	const password = await bcrypt.hash(plainPassword, rounds);
	await prisma.user.create({
		data: { name, email, password, role, emailVerified: true },
	});
	console.log(`${role} created: ${email}`);
};

const seed = async () => {
	const env = envSchema.parse(process.env);

	await seedAccount(
		env.SUPER_ADMIN_NAME,
		env.SUPER_ADMIN_EMAIL,
		env.SUPER_ADMIN_PASSWORD,
		UserRole.SUPER_ADMIN,
		env.BCRYPT_SALT_ROUNDS,
	);
	await seedAccount(
		env.ADMIN_NAME,
		env.ADMIN_EMAIL,
		env.ADMIN_PASSWORD,
		UserRole.ADMIN,
		env.BCRYPT_SALT_ROUNDS,
	);
};

seed()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
