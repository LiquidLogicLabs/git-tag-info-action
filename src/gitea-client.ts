import * as https from 'https';
import * as http from 'http';
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
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const headers: Record<string, string> = {
      'User-Agent': 'git-tag-info-action',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const options: https.RequestOptions | http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers,
    };

    // Ignore certificate errors if requested (HTTPS only)
    if (isHttps && ignoreCertErrors) {
      (options as https.RequestOptions).rejectUnauthorized = false;
    }

    const req = client.request(options, (res) => {
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
 * Get tag information from Gitea API
 */
export async function getTagInfo(
  tagName: string,
  owner: string,
  repo: string,
  baseUrl: string,
  token?: string,
  ignoreCertErrors: boolean = false
): Promise<TagInfo> {
  // Gitea API endpoint for tag refs
  const apiBase = baseUrl.replace(/\/$/, '');
  const url = `${apiBase}/api/v1/repos/${owner}/${repo}/git/refs/tags/${tagName}`;

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
        `Gitea API error: ${response.statusCode} - ${response.body}`
      );
    }

    const refData = JSON.parse(response.body);

    // Get the object SHA (could be tag or commit)
    const objectSha = refData.object?.sha || '';
    const objectType = refData.object?.type || '';

    // If it's a tag object, we need to fetch the tag object to get the commit
    let commitSha = objectSha;
    let tagMessage = '';
    let tagType = TagType.COMMIT;
    let verified = false;

    if (objectType === 'tag') {
      // Fetch the tag object
      const tagUrl = `${apiBase}/api/v1/repos/${owner}/${repo}/git/tags/${objectSha}`;
      const tagResponse = await httpRequest(tagUrl, token, 'GET', ignoreCertErrors);

      if (tagResponse.statusCode === 200) {
        const tagData = JSON.parse(tagResponse.body);
        commitSha = tagData.object?.sha || objectSha;
        tagMessage = tagData.message || '';
        tagType = TagType.ANNOTATED;
        // Gitea doesn't provide verification status in the same way
        verified = false;
      }
    }

    return {
      exists: true,
      tag_name: tagName,
      tag_sha: objectSha,
      tag_type: tagType,
      commit_sha: commitSha,
      tag_message: tagMessage,
      verified,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tag info from Gitea: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get all tags from Gitea repository
 */
export async function getAllTags(
  owner: string,
  repo: string,
  baseUrl: string,
  token?: string,
  ignoreCertErrors: boolean = false
): Promise<Array<{ name: string; date: string }>> {
  const apiBase = baseUrl.replace(/\/$/, '');
  const url = `${apiBase}/api/v1/repos/${owner}/${repo}/tags?limit=100`;

  try {
    const allTags: Array<{ name: string; date: string }> = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const pageUrl = `${url}&page=${page}`;
      const response = await httpRequest(pageUrl, token, 'GET', ignoreCertErrors);

      if (response.statusCode !== 200) {
        throw new Error(
          `Gitea API error: ${response.statusCode} - ${response.body}`
        );
      }

      const tags = JSON.parse(response.body);
      if (!Array.isArray(tags) || tags.length === 0) {
        hasMore = false;
        break;
      }

      // Extract tag names and commit dates
      for (const tag of tags) {
        const tagName = tag.name || '';
        const date = tag.commit?.created || tag.commit?.timestamp || '';

        allTags.push({ name: tagName, date });
      }

      // Check if there are more pages
      if (tags.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return allTags;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tags from Gitea: ${error.message}`);
    }
    throw error;
  }
}

