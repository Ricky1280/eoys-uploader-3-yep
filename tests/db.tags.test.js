const {PostsCache} = require('../lib/postCacheSQLite')
const timeout = 1000 * 60 * 60 //1hr
let cache
beforeAll(async () => {
  cache = await PostsCache.build(timeout, false)
});

test('getPostsByTags() should not contain duplicate ids', async()=>{
  const tags = ['design','drawing']
  
  const posts = await cache.getPostsByTags(tags)
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

test('double-check getPostsByTags() by manually counting each result', async()=>{
  const designPosts = await cache.getPostsByTags(['design'])
  const drawingPosts = await cache.getPostsByTags(['drawing'])

  const both = await cache.getPostsByTags(['drawing','design'])
  const bothCounter = {
    design:designPosts.length, 
    drawing: drawingPosts.length
  }
    
  let designCounter = 0
  let drawingCounter = 0
  
  for(const post of both) {
    
    let hasCountedDesign = false
    let hasCountedDrawing = false
    
    for (const tag of post.taxonomy.tags) {
      if(tag.toLowerCase() === 'design' && !hasCountedDesign) {
        designCounter++
        hasCountedDesign = true
      } else if(tag.toLowerCase() === 'drawing' && !hasCountedDrawing) {
        drawingCounter++ 
        hasCountedDrawing = true
      }
    }
  }
  
  const separateCounter = {
    design:designCounter,
    drawing:drawingCounter
  }
      
  expect(bothCounter).toEqual(separateCounter)
  
})

test('getPostsCountByTags() should return a number of posts', async()=>{

  const possibleTags = [
    'design',
    'drawing',
    'film-video',    
    'installation',
    'painting',
    'performance',
    'photography',
    'sculpture',    
    'sound-art'
  ]
  
  const tags = []
    
  for (let i = 0; i<possibleTags.length; i++) {
    if(tags.length===2) {
      break
    }    
    const randomIndex = Math.floor(Math.random() * possibleTags.length)
    
    const possibleTag = possibleTags[randomIndex]
    
    if(!tags.includes(possibleTag)) {
      tags.push(possibleTag)
    }
  }
  
  // console.log({selectedTags:tags})
  
  const both = await cache.getPostsByTags(tags)
  const {count} = await cache.getPostsCountByTags(tags)
  
  expect(both.length).toEqual(count)
  
})