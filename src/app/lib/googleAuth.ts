import { OAuth2Client } from "google-auth-library";
import config from "../config";

export const googleClient = new OAuth2Client({
	client_id: config.google_client_id,
});

export const googleCallbackUrl = () =>
	config.google_callback_url || `${config.server_url}/api/auth/google/callback`;

export const googleRedirectClient = () =>
	new OAuth2Client({
		client_id: config.google_client_id,
		client_secret: config.google_client_secret,
		redirectUri: googleCallbackUrl(),
	});
