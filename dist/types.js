"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = exports.Platform = void 0;
/**
 * Supported Git hosting platforms
 */
var Platform;
(function (Platform) {
    Platform["GITHUB"] = "github";
    Platform["GITEA"] = "gitea";
    Platform["BITBUCKET"] = "bitbucket";
})(Platform || (exports.Platform = Platform = {}));
/**
 * Tag type enumeration
 */
var TagType;
(function (TagType) {
    TagType["COMMIT"] = "commit";
    TagType["ANNOTATED"] = "annotated";
})(TagType || (exports.TagType = TagType = {}));
//# sourceMappingURL=types.js.map