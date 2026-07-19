import crypto from "crypto";
import config from "../config/config.js";

export interface JWTPayload {
    userId: string;
    organizationId: string;
    exp: number;
}

const base64urlEncode = (str: string): string =>
    Buffer.from(str).toString("base64url");

const base64urlDecode = (str: string): string =>
    Buffer.from(str, "base64url").toString("utf8");

/** Internal signer with a configurable secret. */
const _sign = (payload: Omit<JWTPayload, "exp">, secret: string, expiresInSeconds: number): string => {
    const header = { alg: "HS256", typ: "JWT" };
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const full: JWTPayload = { ...payload, exp };
    const headerB64 = base64urlEncode(JSON.stringify(header));
    const payloadB64 = base64urlEncode(JSON.stringify(full));
    const sig = crypto.createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest("base64url");
    return `${headerB64}.${payloadB64}.${sig}`;
};

/** Internal verifier with a configurable secret. */
const _verify = (token: string, secret: string): JWTPayload | null => {
    try {
        const [headerB64, payloadB64, sig] = token.split(".");
        if (!headerB64 || !payloadB64 || !sig) return null;
        const expected = crypto.createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest("base64url");
        if (sig !== expected) return null;
        const payload: JWTPayload = JSON.parse(base64urlDecode(payloadB64));
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
};

/**
 * Short-lived access token (15 minutes).
 * Signed with JWT_SECRET.
 */
export const signAccessToken = (payload: Omit<JWTPayload, "exp">): string =>
    _sign(payload, config.JWT_SECRET, 15 * 60); // 15 min

/**
 * Long-lived refresh token (7 days).
 * Signed with REFRESH_TOKEN_SECRET — a different secret so the two token types cannot be swapped.
 */
export const signRefreshToken = (payload: Omit<JWTPayload, "exp">): string =>
    _sign(payload, config.REFRESH_TOKEN_SECRET, 7 * 24 * 60 * 60); // 7 days

export const verifyAccessToken = (token: string): JWTPayload | null =>
    _verify(token, config.JWT_SECRET);

export const verifyRefreshToken = (token: string): JWTPayload | null =>
    _verify(token, config.REFRESH_TOKEN_SECRET);

/**
 * Legacy alias — defaults to access token (15 min) for backward compat.
 * @deprecated Prefer signAccessToken / signRefreshToken explicitly.
 */
export const signToken = signAccessToken;
export const verifyToken = verifyAccessToken;
