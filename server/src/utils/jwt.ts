import crypto from "crypto";
import config from "../config/config.js";

export interface JWTPayload {
    userId: string;
    organizationId: string;
    exp: number;
}

const base64urlEncode = (str: string): string => {
    return Buffer.from(str).toString("base64url");
};

const base64urlDecode = (str: string): string => {
    return Buffer.from(str, "base64url").toString("utf8");
};

/**
 * Sign a payload with HS256 to generate a standard JWT token.
 * Defaults to 24-hour expiration.
 */
export const signToken = (payload: Omit<JWTPayload, "exp">, expiresInSeconds = 86400): string => {
    const header = { alg: "HS256", typ: "JWT" };
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const fullPayload: JWTPayload = { ...payload, exp };

    const headerB64 = base64urlEncode(JSON.stringify(header));
    const payloadB64 = base64urlEncode(JSON.stringify(fullPayload));

    const signature = crypto
        .createHmac("sha256", config.JWT_SECRET)
        .update(`${headerB64}.${payloadB64}`)
        .digest("base64url");

    return `${headerB64}.${payloadB64}.${signature}`;
};

/**
 * Verify a JWT token. Returns the payload if valid, otherwise null.
 */
export const verifyToken = (token: string): JWTPayload | null => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const [headerB64, payloadB64, signature] = parts;
        if (!headerB64 || !payloadB64 || !signature) return null;

        const expectedSignature = crypto
            .createHmac("sha256", config.JWT_SECRET)
            .update(`${headerB64}.${payloadB64}`)
            .digest("base64url");

        if (signature !== expectedSignature) return null;

        const payload: JWTPayload = JSON.parse(base64urlDecode(payloadB64));
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null; // Token expired
        }

        return payload;
    } catch (e) {
        return null;
    }
};
