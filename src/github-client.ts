import * as https from 'https';
import { TagInfo, TagType, HttpResponse } from './types';

/**
 * Make HTTP request
 */
function httpRequest(
  url: string,
  token?: string,
  method: string = 'GET'
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const headers: Record<string, string> = {
      'User-Agent': 'git-tag-info-action',
      Accept: 'application/vnd.github.v3+json',
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers,
    };

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
 * Get tag information from GitHub API
 */
export async function getTagInfo(
  tagName: string,
  owner: string,
  repo: string,
  token?: string
): Promise<TagInfo> {
  // GitHub API endpoint for tag refs
  const url = `https://api.github.com/repos/${owner}/${repo}/git/refs/tags/${tagName}`;

  try {
    const response = await httpRequest(url, token);

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
        `GitHub API error: ${response.statusCode} - ${response.body}`
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
      const tagUrl = `https://api.github.com/repos/${owner}/${repo}/git/tags/${objectSha}`;
      const tagResponse = await httpRequest(tagUrl, token);

      if (tagResponse.statusCode === 200) {
        const tagData = JSON.parse(tagResponse.body);
        commitSha = tagData.object?.sha || objectSha;
        tagMessage = tagData.message || '';
        tagType = TagType.ANNOTATED;
        verified = tagData.verification?.verified || false;
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
      throw new Error(`Failed to get tag info from GitHub: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get all tags from GitHub repository
 */
export async function getAllTags(
  owner: string,
  repo: string,
  token?: string
): Promise<Array<{ name: string; date: string }>> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/refs/tags?per_page=100`;

  try {
    const allTags: Array<{ name: string; date: string }> = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const pageUrl = `${url}&page=${page}`;
      const response = await httpRequest(pageUrl, token);

      if (response.statusCode !== 200) {
        throw new Error(
          `GitHub API error: ${response.statusCode} - ${response.body}`
        );
      }

      const refs = JSON.parse(response.body);
      if (refs.length === 0) {
        hasMore = false;
        break;
      }

      // Extract tag names and fetch commit dates
      for (const ref of refs) {
        const tagName = ref.ref.replace('refs/tags/', '');
        let date = '';

        // Get commit date from the tag's commit
        try {
          const objectSha = ref.object?.sha || '';
          if (ref.object?.type === 'tag') {
            // For annotated tags, get the commit SHA from the tag object
            const tagUrl = `https://api.github.com/repos/${owner}/${repo}/git/tags/${objectSha}`;
            const tagResponse = await httpRequest(tagUrl, token);
            if (tagResponse.statusCode === 200) {
              const tagData = JSON.parse(tagResponse.body);
              const commitSha = tagData.object?.sha || '';
              if (commitSha) {
                const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`;
                const commitResponse = await httpRequest(commitUrl, token);
                if (commitResponse.statusCode === 200) {
                  const commitData = JSON.parse(commitResponse.body);
                  date = commitData.committer?.date || '';
                }
              }
            }
          } else {
            // For lightweight tags, get commit date directly
            const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${objectSha}`;
            const commitResponse = await httpRequest(commitUrl, token);
            if (commitResponse.statusCode === 200) {
              const commitData = JSON.parse(commitResponse.body);
              date = commitData.committer?.date || '';
            }
          }
        } catch {
          // If we can't get the date, continue without it
        }

        allTags.push({ name: tagName, date });
      }

      // Check if there are more pages
      if (refs.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return allTags;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tags from GitHub: ${error.message}`);
    }
    throw error;
  }
}

