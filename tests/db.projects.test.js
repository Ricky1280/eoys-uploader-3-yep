const {PostsCache} = require('../lib/postCacheSQLite')
const timeout = 1000 * 60 * 60 //1hr
let cache
beforeAll(async () => {
  cache = await PostsCache.build(timeout, false)
});

//projects
test('fetching all projects should return all projects', async()=>{
  const submissions = await cache.getProjectsSubmissions()
  expect(submissions[0].value).toBeTruthy()
})

test('fetching students of a project should return students', async()=>{
  const project = '3DD cubes'

  const students = await cache.getProjectsStudents(project)
  expect(students[0].value).toBeTruthy()
})

test('fetching posts for a project should return posts', async()=>{
  const project = '3DD cubes'

  const posts = await cache.getPostsByProject(project)
  expect(posts[0].id).toBeGreaterThan(0)
})

test('posts for a one-item project should not contain duplicate ids', async()=>{
  const project = 'Advanced product development with professor bambino'

  const posts = await cache.getPostsByProject(project)
  const postsDistinct = []
  for (const post of posts) {
    
    if(postsDistinct.length>0) {
      const postsDistinctIds = postsDistinct.map((post)=>{return post.id})
      if(!postsDistinctIds.includes(post.id)) {
        postsDistinct.push(post)
      }
    } else {
      //first time through the loop
      postsDistinct.push(post)
    }
  }
  
  expect(posts.length).toEqual(postsDistinct.length)
})

test('posts for a many-item project should not contain duplicate ids', async()=>{
  const project = 'Senior Show'

  const posts = await cache.getPostsByProject(project)
  const postsDistinct = []
  for (const post of posts) {
    
    if(postsDistinct.length>0) {
      const postsDistinctIds = postsDistinct.map((post)=>{return post.id})
      if(!postsDistinctIds.includes(post.id)) {
        postsDistinct.push(post)
      }
    } else {
      //first time through the loop
      postsDistinct.push(post)
    }
  }
  
  expect(posts.length).toEqual(postsDistinct.length)
})