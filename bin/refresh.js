const {refresh, timestamp} = require('../lib/wp')
const {log, safeLog, safeError} = require('../lib/winston-logger.js');

(async()=>{
  try {
    const results = await refresh()
    // console.log(results)
    log.warn({
      function: 'bin/refresh', 
      outcome: "done, exiting properly", 
      processedPosts: results.length
    })
    process.exit(0)
  } catch(e) {
    log.error({
      function: 'bin/refresh', 
      outcome:"failed, exiting improperly",
      error: e
    })
    process.exit(1)
  }
})()
