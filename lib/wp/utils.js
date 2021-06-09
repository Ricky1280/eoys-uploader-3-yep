const {log, safeLog, safeError} = require('../winston-logger.js');
const {asyncCache} = require('./cache.js')
const{ collect_all_draft_posts} = require('./collect.js')

const generate_limited_random = (limit, total) => {
  const results = new Set()
  while (results.size < total) {
    results.add(Math.floor(Math.random()*limit))
  }
  return Array.from(results);
}

const generateSlug = (name) => {
  return name.trim().toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-')
}

const refresh = async () => {
  return await collect_all_draft_posts()
}

const lastUpdateTime = async () =>{
  const cache = await asyncCache  
  return await cache.getLastUpdateTime()
}



module.exports = {
  generate_limited_random,
  generateSlug,
  refresh,
  lastUpdateTime
}