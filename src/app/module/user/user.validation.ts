import { z } from "zod";

// multipart forms send an empty string for an empty field, so blanks count as not provided
const blankToUndefined = (value: unknown) =>
	value === "" || value === null ? undefined : value;

const optionalNumber = (min: number, max: number, label: string) =>
	z.preprocess(
		blankToUndefined,
		z.coerce
			.number(`${label} must be a number`)
			.min(min, `${label} must be at least ${min}`)
			.max(max, `${label} must be at most ${max}`)
			.optional(),
	);

// blank text clears the column, missing text leaves it untouched
const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `Cannot exceed ${max} characters`)
		.transform((value) => (value === "" ? null : value))
		.optional();

const phoneSchema = z
	.string()
	.trim()
	.regex(
		/^(?:\+?88)?01[3-9]\d{8}$/,
		"Enter a valid Bangladeshi mobile number (e.g. 01712345678)",
	)
	.or(z.literal("").transform(() => null))
	.optional();

const updateProfileSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, "Name must be atleast 3 characters long")
		.max(50, "Name cannot exceed 50 characters")
		.optional(),
	phone: phoneSchema,
	house: optionalText(200),
	city: optionalText(100),
	district: optionalText(100),
	country: optionalText(100),
	gpsLat: optionalNumber(-90, 90, "Latitude"),
	gpsLng: optionalNumber(-180, 180, "Longitude"),
	emergencyMessage: optionalText(1000),
	medicalInformation: optionalText(2000),
});

const completeProfileSchema = z.object({
	gpsLat: optionalNumber(-90, 90, "Latitude"),
	gpsLng: optionalNumber(-180, 180, "Longitude"),
	emergencyMessage: optionalText(1000),
	medicalInformation: optionalText(2000),
});

export const userValidation = {
	updateProfileSchema,
	completeProfileSchema,
};
