import { resolveLatestTag } from '../tag-resolver';
import { RepoConfig, Platform } from '../types';
import * as gitClient from '../git-client';
import * as githubClient from '../github-client';
import * as giteaClient from '../gitea-client';
import * as bitbucketClient from '../bitbucket-client';

// Mock the client modules
jest.mock('../git-client');
jest.mock('../github-client');
jest.mock('../gitea-client');
jest.mock('../bitbucket-client');

describe('tag-resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveLatestTag', () => {
    it('should return highest semver tag when semver tags exist', async () => {
      const config: RepoConfig = {
        type: 'remote',
        platform: Platform.GITHUB,
        owner: 'owner',
        repo: 'repo',
      };

      (githubClient.getAllTags as jest.Mock).mockResolvedValue([
        { name: '1.0.0', date: '2024-01-01' },
        { name: '2.0.0', date: '2024-01-02' },
        { name: '1.5.0', date: '2024-01-03' },
      ]);

      const latest = await resolveLatestTag(config);
      expect(latest).toBe('2.0.0');
    });

    it('should fallback to date when no semver tags exist', async () => {
      const config: RepoConfig = {
        type: 'remote',
        platform: Platform.GITHUB,
        owner: 'owner',
        repo: 'repo',
      };

      (githubClient.getAllTags as jest.Mock).mockResolvedValue([
        { name: 'release-1', date: '2024-01-01T00:00:00Z' },
        { name: 'release-2', date: '2024-01-03T00:00:00Z' },
        { name: 'release-3', date: '2024-01-02T00:00:00Z' },
      ]);

      const latest = await resolveLatestTag(config);
      expect(latest).toBe('release-2'); // Most recent by date
    });

    it('should work with local repositories', async () => {
      const config: RepoConfig = {
        type: 'local',
        path: '/path/to/repo',
      };

      (gitClient.getAllTags as jest.Mock).mockReturnValue([
        'v2.0.0',
        'v1.5.0',
        'v1.0.0',
      ]);

      const latest = await resolveLatestTag(config);
      expect(latest).toBe('v2.0.0');
    });

    it('should work with Gitea repositories', async () => {
      const config: RepoConfig = {
        type: 'remote',
        platform: Platform.GITEA,
        owner: 'owner',
        repo: 'repo',
        baseUrl: 'https://gitea.example.com',
      };

      (giteaClient.getAllTags as jest.Mock).mockResolvedValue([
        { name: '1.0.0', date: '2024-01-01' },
        { name: '2.0.0', date: '2024-01-02' },
      ]);

      const latest = await resolveLatestTag(config);
      expect(latest).toBe('2.0.0');
    });

    it('should work with Bitbucket repositories', async () => {
      const config: RepoConfig = {
        type: 'remote',
        platform: Platform.BITBUCKET,
        owner: 'owner',
        repo: 'repo',
      };

      (bitbucketClient.getAllTags as jest.Mock).mockResolvedValue([
        { name: '1.0.0', date: '2024-01-01' },
        { name: '2.0.0', date: '2024-01-02' },
      ]);

      const latest = await resolveLatestTag(config);
      expect(latest).toBe('2.0.0');
    });

    it('should throw error when no tags found', async () => {
      const config: RepoConfig = {
        type: 'remote',
        platform: Platform.GITHUB,
        owner: 'owner',
        repo: 'repo',
      };

      (githubClient.getAllTags as jest.Mock).mockResolvedValue([]);

      await expect(resolveLatestTag(config)).rejects.toThrow('No tags found');
    });

    it('should use alphabetical fallback when no dates available', async () => {
      const config: RepoConfig = {
        type: 'local',
        path: '/path/to/repo',
      };

      (gitClient.getAllTags as jest.Mock).mockReturnValue([
        'tag-a',
        'tag-z',
        'tag-m',
      ]);

      const latest = await resolveLatestTag(config);
      expect(latest).toBe('tag-z'); // Last alphabetically
    });
  });
});

