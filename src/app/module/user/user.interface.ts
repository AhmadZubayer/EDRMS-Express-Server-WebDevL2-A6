export interface IUpdateProfile {
	name?: string;
	phone?: string | null;
	house?: string | null;
	city?: string | null;
	district?: string | null;
	country?: string | null;
	gpsLat?: number;
	gpsLng?: number;
	emergencyMessage?: string | null;
	medicalInformation?: string | null;
}

export interface ICompleteProfile {
	gpsLat?: number;
	gpsLng?: number;
	emergencyMessage?: string | null;
	medicalInformation?: string | null;
}
