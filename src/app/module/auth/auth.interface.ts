export interface IRegisterUserPayload {
	name: string;
	email: string;
	password: string;
	phone?: string;
}

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	newPassword: string;
	otp: string;
}

export interface IChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
}
