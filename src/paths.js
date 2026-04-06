const path = require('path');

/**
 * True if `child` is `root` or a path inside `root` (no `..` escape).
 */
function isPathInside(child, root) {
    const relative = path.relative(root, child);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function galleryRoot(staticFiles) {
    return path.resolve(process.cwd(), staticFiles);
}

/**
 * Resolve a URL-relative path (no leading slash) under staticFiles against cwd.
 * Returns absolute path or null if traversal is attempted.
 */
function resolveUnderStatic(staticFiles, relativeUrlPath) {
    if (relativeUrlPath == null) {
        return null;
    }
    let rel = String(relativeUrlPath);
    try {
        rel = decodeURIComponent(rel);
    }
    catch {
        return null;
    }
    if (rel.includes('\0')) {
        return null;
    }
    rel = rel.replace(/^\/+/, '');
    const normalized = path.normalize(rel);
    if (normalized.startsWith('..')) {
        return null;
    }
    const root = galleryRoot(staticFiles);
    const candidate = path.resolve(root, normalized);
    if (!isPathInside(candidate, root)) {
        return null;
    }
    return candidate;
}

/**
 * Resolve req.path from mounted gallery router (leading slash) under staticFiles.
 */
function resolveRequestPath(staticFiles, reqPath) {
    if (reqPath == null) {
        return null;
    }
    let rel = String(reqPath);
    try {
        rel = decodeURIComponent(rel);
    }
    catch {
        return null;
    }
    rel = rel.replace(/^\/+/, '');
    return resolveUnderStatic(staticFiles, rel);
}

module.exports = {
    galleryRoot,
    isPathInside,
    resolveUnderStatic,
    resolveRequestPath,
};
