import crypto from "crypto";

export const RISE_UPLOAD_USERNAME = "kraftconcept-developers";
export const RISE_UPLOAD_COOKIE = "rise_upload_session";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function getRequiredRiseEnv(name: string, developmentFallback: string) {
    const value = process.env[name];
    if (value) return value;

    if (process.env.NODE_ENV !== "production") {
        return developmentFallback;
    }

    throw new Error(`${name} is not configured`);
}

function getPasswordSalt() {
    return getRequiredRiseEnv(
        "RISE_UPLOAD_PASSWORD_SALT",
        "rise-upload-local-development-salt"
    );
}

function getPasswordHash() {
    return getRequiredRiseEnv(
        "RISE_UPLOAD_PASSWORD_HASH",
        "f5f6913b67251d7f4b917758717844d2664c2c6a7a96cb6c3414fa907c3042f5376e7784a9aa3f9d4d97d11927e6751fd8e9fcf50119fee957f16832ad3a1f441"
    );
}

function getSessionSecret() {
    return (
        process.env.RISE_UPLOAD_SESSION_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        getPasswordHash()
    );
}

function digestPassword(password: string) {
    return crypto.pbkdf2Sync(password, getPasswordSalt(), 210000, 64, "sha512");
}

function signExpiry(expiresAt: number) {
    return crypto
        .createHmac("sha256", getSessionSecret())
        .update(String(expiresAt))
        .digest("hex");
}

export function isValidRiseCredentials(username: string, password: string) {
    if (username !== RISE_UPLOAD_USERNAME || !password) return false;

    const expected = Buffer.from(getPasswordHash(), "hex");
    const actual = digestPassword(password);

    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
}

export function createRiseSessionToken() {
    const expiresAt = Date.now() + SESSION_TTL_MS;
    return `${expiresAt}.${signExpiry(expiresAt)}`;
}

export function isValidRiseSessionToken(token?: string) {
    if (!token) return false;

    const [expiryRaw, signature] = token.split(".");
    const expiresAt = Number(expiryRaw);

    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || !signature) {
        return false;
    }

    const expected = signExpiry(expiresAt);
    const expectedBuffer = Buffer.from(expected, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    if (expectedBuffer.length !== signatureBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
