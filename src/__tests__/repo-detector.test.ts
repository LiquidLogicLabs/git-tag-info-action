import { detectRepository } from '../repo-detector';
import { Platform } from '../types';

// Mock process.env for GitHub Actions context
const originalEnv = process.env;

describe('repo-detector', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('detectRepository', () => {
    describe('URL detection', () => {
      it('should detect GitHub URL', () => {
        const config = detectRepository('https://github.com/owner/repo');
        expect(config.type).toBe('remote');
        expect(config.platform).toBe(Platform.GITHUB);
        expect(config.owner).toBe('owner');
        expect(config.repo).toBe('repo');
      });

      it('should detect GitHub URL with .git suffix', () => {
        const config = detectRepository('https://github.com/owner/repo.git');
        expect(config.type).toBe('remote');
        expect(config.platform).toBe(Platform.GITHUB);
        expect(config.owner).toBe('owner');
        expect(config.repo).toBe('repo');
      });

      it('should detect GitHub SSH URL', () => {
        const config = detectRepository('git@github.com:owner/repo.git');
        expect(config.type).toBe('remote');
        expect(config.platform).toBe(Platform.GITHUB);
        expect(config.owner).toBe('owner');
        expect(config.repo).toBe('repo');
      });

      it('should detect Bitbucket URL', () => {
        const config = detectRepository('https://bitbucket.org/owner/repo');
        expect(config.type).toBe('remote');
        expect(config.platform).toBe(Platform.BITBUCKET);
        expect(config.owner).toBe('owner');
        expect(config.repo).toBe('repo');
      });

      it('should detect Gitea URL', () => {
        const config = detectRepository(
          'https://gitea.example.com/owner/repo',
          undefined,
          undefined,
          undefined,
          undefined,
          'token123'
        );
        expect(config.type).toBe('remote');
        expect(config.platform).toBe(Platform.GITEA);
        expect(config.owner).toBe('owner');
        expect(config.repo).toBe('repo');
        expect(config.token).toBe('token123');
      });

      it('should preserve token when provided', () => {
        const config = detectRepository(
          'https://github.com/owner/repo',
          undefined,
          undefined,
          undefined,
          undefined,
          'my-token'
        );
        expect(config.token).toBe('my-token');
      });
    });

    describe('Local path detection', () => {
      it('should detect relative path as local', () => {
        const config = detectRepository('./my-repo');
        expect(config.type).toBe('local');
        expect(config.path).toBeDefined();
        expect(config.path).toContain('my-repo');
      });

      it('should detect absolute path as local', () => {
        const config = detectRepository('/absolute/path/to/repo');
        expect(config.type).toBe('local');
        expect(config.path).toBe('/absolute/path/to/repo');
      });

      it('should resolve relative paths', () => {
        const config = detectRepository('../parent/repo');
        expect(config.type).toBe('local');
        expect(config.path).toBeDefined();
        expect(config.path).toContain('parent');
        expect(config.path).toContain('repo');
      });
    });

    describe('Separate inputs mode', () => {
      it('should use separate inputs for GitHub', () => {
        const config = detectRepository(
          undefined,
          'github',
          'owner',
          'repo',
          undefined,
          'token123'
        );
        expect(config.type).toBe('remote');
        expect(config.platform).toBe(Platform.GITHUB);
        expect(config.owner).toBe('owner');
        expect(config.repo).toBe('repo');
        expect(config.token).toBe('token123');
      });

      it('should use separate inputs for Gitea with base URL', () => {
        const config = detectRepository(
          undefined,
          'gitea',
          'owner',
          'repo',
          'https://gitea.example.com',
          'token123'
        );
        expect(config.type).toBe('remote');
        expect(config.platform).toBe(Platform.GITEA);
        expect(config.owner).toBe('owner');
        expect(config.repo).toBe('repo');
        expect(config.baseUrl).toBe('https://gitea.example.com');
        expect(config.token).toBe('token123');
      });

      it('should use separate inputs for Bitbucket', () => {
        const config = detectRepository(
          undefined,
          'bitbucket',
          'owner',
          'repo',
          undefined,
          'token123'
        );
        expect(config.type).toBe('remote');
        expect(config.platform).toBe(Platform.BITBUCKET);
        expect(config.owner).toBe('owner');
        expect(config.repo).toBe('repo');
        expect(config.token).toBe('token123');
      });

      it('should throw error for unsupported platform', () => {
        expect(() => {
          detectRepository(undefined, 'gitlab', 'owner', 'repo');
        }).toThrow('Unsupported platform');
      });
    });

    describe('GitHub Actions context fallback', () => {
      it('should use GITHUB_REPOSITORY env var when no inputs provided', () => {
        process.env.GITHUB_REPOSITORY = 'owner/repo';
        process.env.GITHUB_TOKEN = 'env-token';

        const config = detectRepository();
        expect(config.type).toBe('remote');
        expect(config.platform).toBe(Platform.GITHUB);
        expect(config.owner).toBe('owner');
        expect(config.repo).toBe('repo');
        expect(config.token).toBe('env-token');
      });

      it('should use provided token over env token', () => {
        process.env.GITHUB_REPOSITORY = 'owner/repo';
        process.env.GITHUB_TOKEN = 'env-token';

        const config = detectRepository(undefined, undefined, undefined, undefined, undefined, 'provided-token');
        expect(config.token).toBe('provided-token');
      });
    });

    describe('Error cases', () => {
      it('should throw error when no repository specified and not in GitHub Actions', () => {
        delete process.env.GITHUB_REPOSITORY;
        expect(() => {
          detectRepository();
        }).toThrow('Repository not specified');
      });

      it('should throw error for invalid GitHub URL', () => {
        expect(() => {
          detectRepository('https://github.com/invalid');
        }).toThrow('Failed to parse GitHub URL');
      });

      it('should throw error for invalid Bitbucket URL', () => {
        expect(() => {
          detectRepository('https://bitbucket.org/invalid');
        }).toThrow('Failed to parse Bitbucket URL');
      });
    });
  });
});

