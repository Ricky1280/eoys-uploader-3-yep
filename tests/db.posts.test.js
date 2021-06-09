const {PostsCache} = require('../lib/postCacheSQLite')
const timeout = 1000 * 60 * 60 //1hr
let cache
beforeAll(async () => {
  cache = await PostsCache.build(timeout, false)
});


//fetch posts
test('fetching a post should give back data for that post', async()=>{
  const id = 3575

  const post = await cache.getPostById(id)  
  expect(post.id).toEqual(id)
})

test('a post that exists should exist', async()=>{
  const id = 3575

  const post = await cache.exists(id)  
  expect(post).toBeTruthy()
})

test('a post that does not exist should not exist', async()=>{
  const id = -1

  const post = await cache.exists(id)  
  expect(post).toBeFalsy()
})

test('getPostsCount() should count posts accurately', async()=>{
  
  const posts = await cache.getPosts()
  const {count} = await cache.getPostsCount()
  
  expect(posts.length).toEqual(count)
})

test('filtering posts by a year should return only posts from that year', async()=>{
  const years = [
    'freshman',
    'sophmore',
    'junior',
    'senior'
  ]
  const year = years[Math.floor(Math.random()*4)]
  const posts = await cache.getPosts()
  const filteredPosts = posts.filter((post)=>{
    try{
      return post.author.academicyear === year
    } catch(e) {
      return false
    }
  })
  
  expect(filteredPosts[0].author.academicyear).toEqual(year)
})

test('getPostsByAcademicYear() should return only posts from freshmen', async()=>{
  const year = 'freshman'
  const posts = await cache.getPostsByAcademicYear(year)
  
  expect(posts[0].author.academicyear).toEqual(year)
})

test('getPostsByAcademicYear() should match manually filtered posts', async()=>{
  const year = 'freshman'
  const posts = await cache.getPostsByAcademicYear(year)
  
  const manualPosts = await cache.getPosts()
  const filteredPosts = manualPosts.filter((post)=>{
    try{
      return post.author.academicyear === year
    } catch(e) {
      return false
    }
  })
  
  console.log(posts.length, manualPosts.length)
  
  expect(posts.length).toEqual(manualPosts.length)
})

