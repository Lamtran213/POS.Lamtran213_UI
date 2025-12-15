export interface RegisterRequest {
	email: string;
	password: string;
	confirmPassword: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponseData {
	email: string;
	accessToken?: string;
	refreshToken?: string;
	avatarUrl?: string;
	fullName?: string;
	[key: string]: unknown;
}

export interface RegistrationData {
	email: string;
	message: string;
	registrationToken: string;
}

export interface RegisterResponse {
	success: boolean;
	message: string;
	data: RegistrationData;
	timestamp: string;
}

export interface CompleteRegistrationRequest {
	email: string;
	registrationToken: string;
	otpCode: string;
}

export interface StandardResponse<T> {
	success: boolean;
	message: string;
	data: T;
	timestamp: string;
}
