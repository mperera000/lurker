export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local || email;
}

export function signupErrorMessage(input: {
  email: string;
  password: string;
}): string | null {
  if (!isValidEmail(input.email)) {
    return "Enter a real email address.";
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function loginErrorMessage(error?: string | null): string | null {
  if (!error) return null;
  if (error === "CredentialsSignin") {
    return "Email or password is wrong. Try again, or create an account.";
  }
  if (error === "Configuration") {
    return "Login is not set up yet. Add AUTH_SECRET, then try again.";
  }
  return "Could not sign in. Try again.";
}
