const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,50}$/;
const SECRET_KEY_REGEX = /^[A-Z0-9_]{1,255}$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 255 && EMAIL_REGEX.test(email);
}

/** 3-50 chars, letters/digits/underscore/hyphen only — keeps usernames safe to use in URLs, logs, etc. */
export function isValidUsername(username: unknown): username is string {
  return typeof username === 'string' && USERNAME_REGEX.test(username);
}

/** 8-128 chars. Length is the meaningful signal for brute-force resistance — we don't police character classes. */
export function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

export function isValidName(name: unknown, maxLength = 100): name is string {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= maxLength;
}

/** Descriptions are optional everywhere they're used, so undefined/null both pass. */
export function isValidDescription(description: unknown, maxLength = 255): boolean {
  if (description === undefined || description === null) return true;
  return typeof description === 'string' && description.length <= maxLength;
}

/** Secret env-var keys: uppercase letters/digits/underscore, matching the client's auto-uppercase input. */
export function isValidSecretKey(key: unknown): key is string {
  return typeof key === 'string' && SECRET_KEY_REGEX.test(key);
}
