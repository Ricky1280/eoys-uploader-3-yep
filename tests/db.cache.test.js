const {PostsCache} = require('../lib/postCacheSQLite')
const timeout = 1000 * 5 //5 seconds
let cache
beforeAll(async () => {
  cache = await PostsCache.build(timeout, false)
});

test('isFreshDebug() is true when quick', async()=>{
  cache.timestamp()
  const isFresh = cache.isFreshDebug()
  expect(isFresh.fresh).toEqual(true)  
})

test('isFreshDebug() is false when slow', async()=>{
  cache.timestamp()
  setTimeout(()=>{
    const isFresh = cache.isFreshDebug()
    expect(isFresh.fresh).toEqual(false)      
  }, timeout)
})

test('fresh() is true when quick', async()=>{
  cache.timestamp()
  const isFresh = cache.isFresh
  expect(isFresh).toEqual(true)  
})

test('fresh() is false when slow', async()=>{
  cache.timestamp()
  setTimeout(()=>{
    const isFresh = cache.isFresh
    expect(isFresh).toEqual(false)      
  }, timeout)
})