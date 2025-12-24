import * as path from 'path';
import { Platform, RepoConfig } from './types';

/**
 * Detect if a string is a URL (remote repository) or a path (local repository)
 */
function isUrl(repository: string): boolean {
  return (
    repository.startsWith('http://') ||
    repository.startsWith('https://') ||
    repository.startsWith('git@')
  );
}

/**
 * Parse GitHub URL
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
    /^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }

  return null;
}

/**
 * Parse Gitea URL
 */
function parseGiteaUrl(
  url: string,
  baseUrl?: string
): { owner: string; repo: string; baseUrl: string } | null {
  // https://gitea.example.com/owner/repo
  // https://gitea.example.com/owner/repo.git
  // git@gitea.example.com:owner/repo.git
  let urlToParse = url;

  // Extract base URL from the repository URL if not provided
  if (!baseUrl) {
    const httpsMatch = url.match(/^(https?:\/\/[^\/]+)/);
    const sshMatch = url.match(/^git@([^:]+)/);
    if (httpsMatch) {
      baseUrl = httpsMatch[1];
    } else if (sshMatch) {
      baseUrl = `https://${sshMatch[1]}`;
    }
  }

  if (!baseUrl) {
    return null;
  }

  // Remove base URL to get path
  urlToParse = url.replace(/^https?:\/\//, '').replace(/^git@/, '');
  const baseUrlWithoutProtocol = baseUrl.replace(/^https?:\/\//, '');
  urlToParse = urlToParse.replace(baseUrlWithoutProtocol, '').replace(/^:/, '').replace(/^\//, '');

  // Extract owner/repo from path
  const pathMatch = urlToParse.match(/^([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/);
  if (pathMatch) {
    return {
      owner: pathMatch[1],
      repo: pathMatch[2].replace(/\.git$/, ''),
      baseUrl,
    };
  }

  return null;
}

/**
 * Parse Bitbucket URL
 */
function parseBitbucketUrl(url: string): { owner: string; repo: string } | null {
  // https://bitbucket.org/owner/repo
  // https://bitbucket.org/owner/repo.git
  // git@bitbucket.org:owner/repo.git
  const patterns = [
    /^https?:\/\/bitbucket\.org\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
    /^git@bitbucket\.org:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }

  return null;
}

/**
 * Detect platform from URL
 */
function detectPlatformFromUrl(url: string): Platform | null {
  if (url.includes('github.com')) {
    return Platform.GITHUB;
  }
  if (url.includes('bitbucket.org')) {
    return Platform.BITBUCKET;
  }
  // Gitea is detected by exclusion or explicit base_url
  return Platform.GITEA;
}

/**
 * Build repository configuration from inputs
 */
export function detectRepository(
  repository?: string,
  platform?: string,
  owner?: string,
  repo?: string,
  baseUrl?: string,
  token?: string,
  ignoreCertErrors: boolean = false
): RepoConfig {
  // Apply fallback to GITHUB_TOKEN if token is not provided
  const finalToken = token || process.env.GITHUB_TOKEN;

  // If separate inputs are provided, use them
  if (platform && owner && repo) {
    const platformEnum = platform.toLowerCase() as Platform;
    if (!Object.values(Platform).includes(platformEnum)) {
      throw new Error(`Unsupported platform: ${platform}. Supported: ${Object.values(Platform).join(', ')}`);
    }

    return {
      type: 'remote',
      platform: platformEnum,
      owner,
      repo,
      baseUrl: baseUrl || (platformEnum === Platform.GITEA ? undefined : undefined),
      token: finalToken,
      ignoreCertErrors,
    };
  }

  // If repository input is provided
  if (repository) {
    if (isUrl(repository)) {
      // Remote repository
      const detectedPlatform = detectPlatformFromUrl(repository);

      if (detectedPlatform === Platform.GITHUB) {
        const parsed = parseGitHubUrl(repository);
        if (!parsed) {
          throw new Error(`Failed to parse GitHub URL: ${repository}`);
        }
        return {
          type: 'remote',
          platform: Platform.GITHUB,
          owner: parsed.owner,
          repo: parsed.repo,
          token: finalToken,
          ignoreCertErrors,
        };
      }

      if (detectedPlatform === Platform.BITBUCKET) {
        const parsed = parseBitbucketUrl(repository);
        if (!parsed) {
          throw new Error(`Failed to parse Bitbucket URL: ${repository}`);
        }
        return {
          type: 'remote',
          platform: Platform.BITBUCKET,
          owner: parsed.owner,
          repo: parsed.repo,
          token: finalToken,
          ignoreCertErrors,
        };
      }

      // Gitea (default for unknown URLs or explicit Gitea)
      const parsed = parseGiteaUrl(repository, baseUrl);
      if (!parsed) {
        throw new Error(`Failed to parse Gitea URL: ${repository}`);
      }
      return {
        type: 'remote',
        platform: Platform.GITEA,
        owner: parsed.owner,
        repo: parsed.repo,
        baseUrl: parsed.baseUrl,
        token: finalToken,
        ignoreCertErrors,
      };
    } else {
      // Local repository path
      const resolvedPath = path.isAbsolute(repository)
        ? repository
        : path.resolve(process.cwd(), repository);

      return {
        type: 'local',
        path: resolvedPath,
      };
    }
  }

  // Default: try to use GitHub Actions context
  const githubRepo = process.env.GITHUB_REPOSITORY;
  if (githubRepo) {
    const [owner, repo] = githubRepo.split('/');
    return {
      type: 'remote',
      platform: Platform.GITHUB,
      owner,
      repo,
      token: finalToken,
      ignoreCertErrors,
    };
  }

  throw new Error(
    'Repository not specified. Provide either repository (URL or path), or platform/owner/repo inputs, or run in GitHub Actions context.'
  );
}

