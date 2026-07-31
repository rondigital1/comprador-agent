import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import type { NextConfig } from "next";

config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@casero/core", "@casero/database", "@casero/gmail"],
};

export default nextConfig;
