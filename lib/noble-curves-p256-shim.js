/**
 * Shim for @noble/curves/p256: ox expects this path and exports { p256, secp256r1 }.
 * @noble/curves 2.x only has p256 in nist.js; secp256r1 is an alias for the same curve.
 */
import { p256 } from "@noble/curves/nist.js";
export { p256 };
export const secp256r1 = p256;
