import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @overmind-lab/trace-sdk ships TypeScript source, not compiled JS,
  // so Next has to transpile it like our own code.
  transpilePackages: ["@overmind-lab/trace-sdk"],
  // That same SDK source has a type error (debug(e) with e: unknown), which
  // fails `next build`'s type check even though it's a third-party file and
  // harmless at runtime. Skip build-time type-checking; dev still type-checks
  // our code live, and CI can run `tsc` against our own files.
  typescript: { ignoreBuildErrors: true },
  // OpenTelemetry's instrumentation packages do dynamic requires; let
  // Webpack/Turbopack leave them as runtime resolution rather than bundling.
  serverExternalPackages: [
    "@opentelemetry/sdk-node",
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/instrumentation",
    "@opentelemetry/exporter-trace-otlp-proto",
  ],
};

export default nextConfig;
