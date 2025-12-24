"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTagInfo = getTagInfo;
exports.getAllTags = getAllTags;
const https = __importStar(require("https"));
const types_1 = require("./types");
/**
 * Make HTTP request
 */
function httpRequest(url, token, method = 'GET', ignoreCertErrors = false) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const headers = {
            'User-Agent': 'git-tag-info-action',
            Accept: 'application/json',
        };
        if (token) {
            // Bitbucket uses Basic Auth with app password or token
            const auth = Buffer.from(`:${token}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }
        const options = {
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
async function getTagInfo(tagName, owner, repo, token, ignoreCertErrors = false) {
    // Bitbucket API endpoint for tag refs
    const url = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/refs/tags/${tagName}`;
    try {
        const response = await httpRequest(url, token, 'GET', ignoreCertErrors);
        if (response.statusCode === 404) {
            return {
                exists: false,
                tag_name: tagName,
                tag_sha: '',
                tag_type: types_1.TagType.COMMIT,
                commit_sha: '',
                tag_message: '',
                verified: false,
            };
        }
        if (response.statusCode !== 200) {
            throw new Error(`Bitbucket API error: ${response.statusCode} - ${response.body}`);
        }
        const tagData = JSON.parse(response.body);
        // Bitbucket returns tag information directly
        const tagSha = tagData.target?.hash || '';
        const commitSha = tagData.target?.hash || ''; // Bitbucket tags point directly to commits
        const tagMessage = tagData.message || '';
        const tagType = tagData.type === 'tag' ? types_1.TagType.ANNOTATED : types_1.TagType.COMMIT;
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
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get tag info from Bitbucket: ${error.message}`);
        }
        throw error;
    }
}
/**
 * Get all tags from Bitbucket repository
 */
async function getAllTags(owner, repo, token, ignoreCertErrors = false) {
    const url = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/refs/tags?pagelen=100`;
    try {
        const allTags = [];
        let nextUrl = url;
        while (nextUrl) {
            const response = await httpRequest(nextUrl, token, 'GET', ignoreCertErrors);
            if (response.statusCode !== 200) {
                throw new Error(`Bitbucket API error: ${response.statusCode} - ${response.body}`);
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
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get tags from Bitbucket: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=bitbucket-client.js.map