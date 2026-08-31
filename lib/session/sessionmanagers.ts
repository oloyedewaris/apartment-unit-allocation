import { SignJWT, jwtVerify } from "jose";
import { deleteCookie, getCookie, setCookie } from "cookies-next";

const secretKey = process.env.NEXT_PUBLIC_JWT_KEY ?? "existence";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: { info: unknown; expires: Date }) {
  return await new SignJWT(payload as Record<string, unknown>).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(payload.expires).sign(key);
}

export async function decrypt(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function setSession(info: unknown, keyName: string, expires: Date) {
  const session = await encrypt({ info, expires });
  setCookie(keyName, session, {
    path: "/",
    expires,
  });
}

export function deleteCookies(key: string | string[]) {
  if (Array.isArray(key)) {
    for (let i = 0; i < key.length; i++) {
      deleteCookie(key[i]);
    }
  } else {
    deleteCookie(key);
  }
}

export async function getSession(key: string) {
  const session = getCookie(key);
  if (!session) return null;
  const decrypted = await decrypt(session as string);
  return (decrypted as { info?: unknown }).info ?? null;
}
