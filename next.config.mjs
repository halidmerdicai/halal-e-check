/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const repositoryName = "halal-e-check";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: isGitHubPages ? `/${repositoryName}` : undefined,
  assetPrefix: isGitHubPages ? `/${repositoryName}/` : undefined,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
