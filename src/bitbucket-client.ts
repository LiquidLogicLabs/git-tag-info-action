import * as https from 'https';
import { TagInfo, TagType, HttpResponse } from './types';

/**
 * Make HTTP request
 */
function httpRequest(
  url: string,
  token?: string,
  method: string = 'GET',
  ignoreCertErrors: boolean = false
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const headers: Record<string, string> = {
      'User-Agent': 'git-tag-info-action',
      Accept: 'application/json',
    };

    if (token) {
      // Bitbucket uses Basic Auth with app password or token
      const auth = Buffer.from(`:${token}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers,
    };

    // Ignore certificate errors if requested
    if (ignoreCertErrors) {
      options.rejectUnauthorized = false;
    }

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Get tag information from Bitbucket API
 */
export async function getTagInfo(
  tagName: string,
  owner: string,
  repo: string,
  token?: string,
  ignoreCertErrors: boolean = false
): Promise<TagInfo> {
  // Bitbucket API endpoint for tag refs
  const url = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/refs/tags/${tagName}`;

  try {
    const response = await httpRequest(url, token, 'GET', ignoreCertErrors);

    if (response.statusCode === 404) {
      return {
        exists: false,
        tag_name: tagName,
        tag_sha: '',
        tag_type: TagType.COMMIT,
        commit_sha: '',
        tag_message: '',
        verified: false,
      };
    }

    if (response.statusCode !== 200) {
      throw new Error(
        `Bitbucket API error: ${response.statusCode} - ${response.body}`
      );
    }

    const tagData = JSON.parse(response.body);

    // Bitbucket returns tag information directly
    const tagSha = tagData.target?.hash || '';
    const commitSha = tagData.target?.hash || ''; // Bitbucket tags point directly to commits
    const tagMessage = tagData.message || '';
    const tagType = tagData.type === 'tag' ? TagType.ANNOTATED : TagType.COMMIT;
    const verified = false; // Bitbucket doesn't provide GPG verification status via API

    return {
      exists: true,
      tag_name: tagName,
      tag_sha: tagSha,
      tag_type: tagType,
      commit_sha: commitSha,
      tag_message: tagMessage,
      verified,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tag info from Bitbucket: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get all tags from Bitbucket repository
 */
export async function getAllTags(
  owner: string,
  repo: string,
  token?: string,
  ignoreCertErrors: boolean = false
): Promise<Array<{ name: string; date: string }>> {
  const url = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/refs/tags?pagelen=100`;

  try {
    const allTags: Array<{ name: string; date: string }> = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const response = await httpRequest(nextUrl, token, 'GET', ignoreCertErrors);

      if (response.statusCode !== 200) {
        throw new Error(
          `Bitbucket API error: ${response.statusCode} - ${response.body}`
        );
      }

      const data = JSON.parse(response.body);
      const tags = data.values || [];

      if (tags.length === 0) {
        break;
      }

      // Extract tag names and dates
      for (const tag of tags) {
        const tagName = tag.name || '';
        const date = tag.target?.date || tag.date || '';

        allTags.push({ name: tagName, date });
      }

      // Check for next page
      nextUrl = data.next || null;
    }

    return allTags;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tags from Bitbucket: ${error.message}`);
    }
    throw error;
  }
}

