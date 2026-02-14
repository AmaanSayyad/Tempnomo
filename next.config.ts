import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // @noble/curves 2.x: ox and viem import paths that changed or lack .js
      "@noble/curves/abstract/utils": "@noble/curves/utils.js",
      "@noble/curves/p256": "./lib/noble-curves-p256-shim.js",
      "@noble/curves/secp256k1": "@noble/curves/secp256k1.js",
      // @noble/hashes 2.x: ethers/viem import without .js; sha256/sha512 live in sha2.js
      "@noble/hashes/hmac": "@noble/hashes/hmac.js",
      "@noble/hashes/pbkdf2": "@noble/hashes/pbkdf2.js",
      "@noble/hashes/sha256": "@noble/hashes/sha2.js",
      "@noble/hashes/sha512": "@noble/hashes/sha2.js",
      "@noble/hashes/sha3": "@noble/hashes/sha3.js",
      "@noble/hashes/ripemd160": "@noble/hashes/legacy.js",
      "@noble/hashes/scrypt": "@noble/hashes/scrypt.js",
      "@noble/hashes/utils": "@noble/hashes/utils.js",
    },
  },
};

export default nextConfig;
