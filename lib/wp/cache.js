const {log, safeLog, safeError} = require('../winston-logger.js');
const {PostsCache} = require('../postCacheSQLite')

//cache
const timeout = 1000 * 60 * 60 //1hr
// const cache = new PostsCache(timeout)
const asyncCache = PostsCache.build(timeout, false)

module.exports = {
  asyncCache
}