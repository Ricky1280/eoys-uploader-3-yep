const {PostsCache} = require('../lib/postCacheSQLite')
const timeout = 1000 * 60 * 60 //1hr
let cache
beforeAll(async () => {
  cache = await PostsCache.build(timeout, false)
});

test('getTagsByStudentName() should return an array of tags', async()=>{
  const student = "Erin Sparling"

  const tags = await cache.getTagsByStudentName(student)  
  expect(tags.length).toBeGreaterThan(0)
})

test('getTagsByStudentName() should return an accurate, deduped list for a student', async()=>{
  const student = "Erin Sparling"

  const tags = await cache.getTagsByStudentName(student)  
  const posts = await cache.getPosts()
  
  // const studentPostsTags = Array.from(
  //   new Set(
  //     posts.filter((post)=>{
  //       try{
  //         return post.author.formatted.toLowerCase() === student.toLowerCase()
  //       } catch(e) {
  //         console.log("no formatted", post)
  //         return false
  //       }
  //     }).map((post)=>{
  //       return post.taxonomy.tags
  //     }).reduce((tags, post)=>{
  //       return tags.concat(post)
  //     })
  //   )
  // ).sort()
  
    // const studentPostsTags = posts.filter((post)=>{
    //   try{
    //     return post.author.formatted.toLowerCase() === student.toLowerCase()
    //   } catch(e) {
    //     console.log("no formatted", post)
    //     return false
    //   }
    // }).map((post)=>{
    //   return post.taxonomy.tags
    // }).reduce((tags, post)=>{
    //   return tags.concat(post)
    // }).reduce((tags, tag)=>{
    //   return tags.includes(tag) ? tags : [...tags, tag]
    // }, []).sort()
    
    // const studentPostsTags = posts.filter((post)=>{
    //   try{ return post.author.formatted.toLowerCase() === student.toLowerCase() }
    //   catch(e) { return false }
    // }).map((post)=>{
    //   return post.taxonomy.tags
    // }).reduce((allTags, postTags)=>{
    //   return allTags.concat(postTags.reduce((tags, tag)=>{
    //     return allTags.includes(tag) ? tags : [...tags, tag]  
    //   }, []))
    // }, []).sort()    

  const studentPostsTags = posts.filter((post)=>{
    try{ return post.author.formatted.toLowerCase() === student.toLowerCase() }
    catch(e) { return false }
  }).reduce((allTags, postTags)=>{
    return allTags.concat(postTags.taxonomy.tags.reduce((tags, tag)=>{
      return allTags.includes(tag) ? tags : [...tags, tag]  
    }, []))
  }, []).sort()    
 
  expect(tags.sort()).toEqual(studentPostsTags)
})


test('getPostsByStudentName() should return a list of student posts', async()=>{
  const formatted = 'Erin Sparling'
  const posts = await cache.getPostsByStudentName(formatted)
  
  expect(posts[0].id).toBeGreaterThan(0)
})

test('getPostsByStudentName() should return post with a single author', async()=>{
  const formatted = 'Erin Sparling'
  const posts = await cache.getPostsByStudentName(formatted)
  const authors = new Set(posts.map((post)=>{
    return post.author.formatted
  }))
  
  expect(authors.size).toEqual(1)
})