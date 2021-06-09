const {log, safeLog, safeError} = require('./winston-logger.js');
const util = require('util');
const {PostsCache} = require('./postCacheSQLite')
const WPAPI = require('wpapi');

//wordpress
const wp = new WPAPI({ 
  endpoint: process.env.API_ENDPOINT,
  username: process.env.API_USER,
  password: process.env.API_PASSWORD,
  auth: true
});
wp.custom_tags = wp.registerRoute( 'acf/v3', '/tags');
wp.custom_tag = wp.registerRoute( 'acf/v3', '/tags/(?P<id>)');

//cache
const timeout = 1000 * 60 * 60 //1hr
// const cache = new PostsCache(timeout)
const asyncCache = PostsCache.build(timeout, false)


//vimeo
const { getVideoById } = require('./vimeo')

const collect_all_tags = async (description_like = false) => {
  
  let all_tags = []
  let done = false
  let page = 1

  
  while(!done) {
    
    const tags = await wp.tags().perPage(100).page(page).get()
    all_tags = all_tags.concat(tags)
    
    if(tags.length === 100) {
      page++  
    } else {
      done = true  
    }
  }
  
  
  return (description_like != false) 
    ? all_tags.filter(tag=>tag.description.includes(description_like)) 
    : all_tags
}

const collect_all_posts = async (tag = false) => {
  const cache = await asyncCache


  //if cache is less than 10 minutes old, return cache
  if(cache.isFresh) {
    log.info("CLASS collected posts are fresh, returning cache")
    return cache.getPosts()
  }

  log.info("CLASS post cache is out of date, refreshing")

  let all_posts = []
  let done = false
  let page = 1
  while(!done) {
    
    const posts = tag !== false
      ? await wp.posts().tags(tag.id).perPage(100).page(page).get()
      : await wp.posts().perPage(100).page(page).get()
    all_posts = all_posts.concat(posts)
    
    if(posts.length === 100) {
      page++  
    } else {
      done = true  
    }
  }

  // if(!tag) {
    //TODO: create a tag-specific cache
    
    cache.posts = all_posts
  // }
  return all_posts
}

const collect_all_draft_posts = async () => {
  const cache = await asyncCache

  log.warn({function:"cache debug", outcome:cache.isFreshDebug()})
  //if cache is less than 10 minutes old, return cache
  if(cache.isFresh) {
    log.info({function:"collect cache", outcome:"CLASS collected posts are fresh, returning cache"})
    return cache.getPosts()
  }
  
  log.info({function:"collect cache", outcome:"CLASS post cache is out of date, refreshing"})

  
  let done = false
  let page = 1
  let perPage = 5
  
  const headers = await wp.posts().status(['draft']).perPage(perPage).page(1).headers()
  const postsCount = headers['x-wp-total']
  const pages = headers['x-wp-totalpages']
  let remainingPosts = postsCount
  
  log.warn({function: 'collect_all_draft_posts', config: {page, perPage, pages, postsCount}})
  
  while(!done) {
    
    const posts = await wp.posts().status(['draft']).perPage(perPage).page(page).get()
    const hydratedPosts = await Promise.all(posts.map(hydratePostByType))
    log.info({function: 'collect_all_draft_posts', status: {fetchedPosts:hydratedPosts.length, page, remainingPosts}})
    
    await cache.setPosts(hydratedPosts)
    
    remainingPosts = remainingPosts - hydratedPosts.length
    if(remainingPosts<=0) {
      done = true
    }
    page++
  }
  cache.timestamp()
  
  return await cache.getPosts()
}

const generate_limited_random = (limit, total) => {
  const results = new Set()
  while (results.size < total) {
    results.add(Math.floor(Math.random()*limit))
  }
  return Array.from(results);
}


const filterCategory = (category)=> {
  
  const to_delete = [
    'count', 
    // 'taxonomy',
    'link',
    'parent',
    'meta',
    'acf',
    '_links'
  ]
  
  to_delete.forEach((deletion)=>{
    delete category[deletion]
  })
  
  if((category.description === 'category') || (category.description === 'students')) {
    category.url = `https://eoys-vue-client-router.glitch.me/category/${category.slug}`
    category.path = `/category/${category.slug}`
  } else if(category.description === 'tags') {
    category.url = `https://eoys-vue-client-router.glitch.me/tags/${category.slug}`
    category.path = `/tags/${category.slug}`
  }
  
  return category
}

const filterTag = async (tag) => {
    
  // log.info(tag)
  const to_delete = [
    'count', 
    'taxonomy',
    'meta',
    'link',
    '_links'
  ]
  
  to_delete.forEach((deletion)=>{
    
    try{
      delete tag[deletion]
    } catch(e) {
      log.info("could not delete:", deletion)
    }
  })
  
  return tag
}

const filterPost = async (post)=>{
  const to_delete = [
    'date', 
    'guid',
    'date_gmt',
    'modified',
    'modified_gmt',
    'status',
    'type',
    'content',
    'excerpt',
    'author',
    'featured_media',
    'comment_status',
    'ping_status',
    'sticky',
    'template',
    'format',
    'meta',
    'link',
    'tags',
    '_links',
    // 'new ones for. 2021'
    'images',
    'slug',
    'categories'
  ]
  
  const tag_delete = [
    'term_id',
    'term_group',
    'term_taxonomy_id',
    'taxonomy', 
    'parent',
    'count', 
    'filter',
    'description'
  ]
  
  const max_images = 20 
  
  //delete stuff that shouldn't exist
  to_delete.forEach((deletion)=>{
    delete post[deletion]
  })
  
  //promote tags out of acf
  // try{
  //   post.tags = post.acf.taxonomy.tags.tags
  // } catch(e) {
  //   log.info("Why doesn't post.acf contain taxonomy?", e)
  // }
  //construct a better image representation
  
  // post.images = []
  // try {
  //   for(let i = 1; i<=max_images; i++) {
  //     if(`image_${i}` in post.acf) {
  //       post.images.push(post.acf[`image_${i}`])
  //     }
  //   }
  // } catch(e) {
  //   log.info("Legacy image workflow should probably be deleted in favor of Media")
  // }
  
  try {
    for (let item of Object.keys(post.acf)) {
      post[item] = post.acf[item]
    }
  } catch(e){
    log.info("Ok, so now there's no ACF???")
  } 
  
  //promote the url
  // try {
  //   post.url = post.acf.meta.optional.url || null
  // } catch (e) {
  //   log.info("No url")
  // }
  try {
    post.title = post.title.rendered
  } catch(e) {
    log.info("How can there be no title?!?")
  }
//   try {
//     post.instructor = post.acf.taxonomy.author.instructor
//   } catch(e) {
//     log.info("No instructor data...")
//   }
//   post.link = `/work/${post.slug}`
  
  

  //delete acf info
  delete post.acf

  //promote various things
  // try {
  //   post.artists = post.taxonomy.author.artist.map((artist)=>{
  //     artist.name_formatted = artist.name.split(', ').reverse().join(' ')
  //     artist.link = `/student/${artist.slug}`
  //     return artist
  //   })
  // } catch(e) {
  //   log.info("No valid artist taxonomy")
  // }

  // try {
  //   post.categories = post.taxonomy.tags.category
  // } catch(e) {
  //   log.info("No category, or taxonomy")
  // }
  
  try {
    // delete post.taxonomy.author
    // delete post.taxonomy.tags.tags
    delete post.taxonomy.category
  } catch(e) {
    log.info("Tried to delete something that wasn't there")
  }
  
  
  
  
//   let tag_indexes_to_delete = []
//   post.tags.forEach((tag, i)=>{
//     if(tag.description === 'student') {
//       post.artists.push(tag.name)
//       tag_indexes_to_delete.push(i)
//     }

//     tag_delete.forEach((deletion)=>{
//       delete tag[deletion]
//     })

//   })

//   tag_indexes_to_delete.forEach((i)=>{
//     delete post.tags[i]
//   })

//   post.tags = post.tags.filter((tag)=>{
//     if(tag !== null) return true
//   })
  
//   post.categories = await Promise.all(post.categories.map(await getCategoryById))

  //elements to turn back into JSON
  //class.instructor
  //class.course
  //project
  //tags
  try{
    post.class.instructor = JSON.parse(post.class.instructor)
  } catch(e) {
    log.debug("non-parsable instructor:", post.class.instructor)
  }
  
  try{
    post.class.course = JSON.parse(post.class.course)
  } catch(e) {
    log.debug("non-parsable course:", post.class.course)
  }
  try{
    post.class.project = JSON.parse(post.class.project)
  } catch(e) {
    log.debug("non-parsable project:", post.class.project)
  }
  
  try{
    post.taxonomy.tags = JSON.parse(post.taxonomy.tags)
  } catch(e) {
    log.debug("non-parsable tags:", post.taxonomy)
  }
  
  try{
    post.assets.media = JSON.parse(post.assets.media)
  } catch(e) {
    log.debug("non-parsable media:", post.assets.media)
  }
  
  try{
    console.log(post.class.collaborators)
    post.class.collaborators = JSON.parse(post.class.collaborators)
        console.log(post.class.collaborators)

  } catch(e) {
    log.debug("non-parsable media:", post.class.collaborators)
  }
  
  return post
  
}


const getCategoryById = async (id) => {
    const category = await wp.categories().id(id).get()
    return filterCategory(category)
}

const getCategoryByName = async (name) => {
  const categories = await wp.categories().get()
  const category = categories.filter((category)=>{
    if(category.name === name) return true
  }).pop()
  return filterCategory(category) 
}

const getAllCategories = async () => {
  const categories = await wp.categories().get()
  return categories.map((category)=>{
    return filterCategory(category)
  }).filter((category)=>{
    return (category.slug != 'uncategorized')
  })
}

const getAllTags = async() => {
  const tags = await collect_all_tags()
  return tags.map((tag)=>{
    return filterCategory(tag)
  })
}

const getAllTagsRaw = async() => {
  return await collect_all_tags()
}

const getTagByName = async(name) => {
  const tag = await wp.tags().search(name).perPage(1).get()
  log.info("getTagByName", tag)
  return filterTag(tag.pop())
}

const hydratePostByType = async(post) => {
  try{
    return await filterPost(post).then(async (post)=>{
      // log.info(post)
      if(post.type === 'video') {
        //TODO: do something special for vimeo here...
        //https://vimeo.com/manage/videos/540938383
        const videoId = post.assets.media.shift()
        post.assets.media = [{
          url:`https://vimeo.com/manage/videos/${videoId}`,
          videoId,
          vimeo: await getVideoById(videoId)
        }]
      } else if (post.assets.media) {
        post.assets.media = post.assets.media ? await Promise.all(post.assets.media.map(getMediaById)) : null
      }
      let previewId = JSON.parse(post.assets.preview).shift()
      post.assets.preview = await getMediaById(previewId)
      post.route = `/app/post/${post.id}`
      return post
    })
  } catch(e) {
    log.info("no", e)
    return {}
  }
}

const getPostById = async(id)=>{
  const cache = await asyncCache

  try {
    return await cache.getPostById(id)
  } catch(e) {
    log.error({
      function: 'getPostById', 
      id, 
      outcome: 'Unable to retrieve post'
    })
    return false
  }

}

const getMediaById = async(id)=>{
  const media =  await wp.media().id(id).get()  
  log.debug(media)
  try {
    const {media_details, caption, source_url, originalname} = media
    const {thumbnail} = media_details.sizes
    const sizes = media_details.sizes
    delete sizes.thumbnail
    return {
      id, 
      caption: caption.raw, 
      thumbnail,
      sizes,
      source_url,
      originalname
    }
  } catch(e){
    log.info(e)
    return null
  }
}


const createTest = async () =>{
  // wp.artworkAPI = wp.registerRoute("acf/v3", "/test");
 
  log.info("createTest running in wp.js")
  let post = {
    "title": `Testing, testing, 1, 2, 3, ${Math.round(Math.random()*100)}`,
    "fields": {
      "taxonomy": {
        "author": {
          "artist": "Mike Stamm",
          "instructor": "Erin Sparling"
        },
        "tags": {
          "tags": "animation,awesomeness",
          "category": "fine art,nerdery"
        }
      },
      "external":{
        "vimeo_url": "vimeo://",
        "youtube_url": "youtube://",
        "soundcloud_url": "soundcloud://",
        "dropbox_url": "dropbox://"
      },
      "meta": {
        "description": `Testing, testing, 1, 2, 3, ${Math.round(Math.random()*10)}`,
        "optional": {
          "dimensions": "4x5 index card, pixels",
          "url": "https://my website"
        },
        "email": "ldap-email@cooper.edu"
      }
    }
  }
  
    
  try{
    return true
    let create = await wp.posts().create(post)
    log.info(create)
    return create
  } catch(e) {
    log.info(e)
    return e 
  }
  
}

const create = async (post) =>{
 
  // log.info("create running in wp.js")
  // log.info("data being submitted:", util.inspect(post, false, null))
  try{
    // return true
    let create = await wp.posts().create(post)
    log.info({function: 'wp.js create', outcome:create})
    // cache.refresh()
    return create
  } catch(e) {
    log.info(e)
    return e 
  }
  
}

const createMedia = async (media, meta)=>{
  log.info("createMedia is running in wp.js")
    
  try{
    let response = await wp.media().file(media.buffer, media.originalname).create(meta)
    response.originalname = media.originalname
    return response
  } catch(e) {
    log.info(e)
    return e
  }

}

const getAllPosts = async ()=>{
  const cache = await asyncCache
  return cache.getPosts()
}

const getPostsBySearch = async(search)=>{
  // if(cache.isFresh && cache.contains(id)) {
  //   log.info("returning from cache")
  //   return cache.post(id)
  // }
  
  const patchedSearch = search.replace(/\-/gi, ' ')
  log.info({search, patchedSearch})
  
  const posts = await wp.posts().status(['draft']).search(patchedSearch).get()  
  return await Promise.all(posts.map(hydratePostByType))
}

const getPostsByEmail = async (email)=>{
  const cache = await asyncCache  
  return await cache.getPostsByEmail(email)
}

const getPostsByTags = async(tags) => {
  const cache = await asyncCache  
  try{
    return await cache.getPostsByTags(tags.split(','))
  } catch(e) {
    log.error({
      function: 'getPostsByTags', 
      outcome: 'failed to get posts by tag', 
      tags
    })
    return false
  }
}

const generateSlug = (name) => {
  return name.trim().toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-')
}

const getProjectNameFromSlug = async(slug)=>{
  const projects = await getProjectsSubmissions()

  const projectConfig = projects.filter((mapping)=>{
    return mapping.slug === slug
  }).shift()
  
  return projectConfig
}

const getPostsByProject = async(slug) => {
  const cache = await asyncCache
  const project = await getProjectNameFromSlug(slug)

  try{
    return await cache.getPostsByProject(project.name)
  } catch(e) {
    log.error({
      function: 'getPostsByProject', 
      outcome: 'failed to get posts by project', 
      project,
      e
    })
    return false
  }
}

const getProjectsSubmissions = async() => {
  const cache = await asyncCache
  try{
    const submissions = await cache.getProjectsSubmissions()
    return submissions.map((submission)=>{
      const slug = generateSlug(submission.value)
      return {
        name: submission.value,
        slug, 
        url: '/projects/' + slug
      }
    })
  } catch(e) {
    log.error({
      function: 'getProjectsSubmissions', 
      outcome: 'failed to get list of posts projects', 
      e
    })
    return false
  }
}

const getProjectsStudents = async(slug) =>{
  const cache = await asyncCache  
  const project = await getProjectNameFromSlug(slug)
  
  try{
    const students = await cache.getProjectsStudents(project.name).catch((e)=>{
      console.log(e)
    })
    return students.map((student)=>{
      return student.value
    })
  } catch(e) {
    log.error({
      function: 'getProjectsStudents', 
      outcome: 'failed to get list of project students', 
      e
    })
    return false
  }
}

const refresh = async () => {
  return await collect_all_draft_posts()
}

const lastUpdateTime = async () =>{
  const cache = await asyncCache  
  return await cache.getLastUpdateTime()
}

const query = async(query)=>{
  const cache = await asyncCache  
  return await cache.query(query)
}

const getPostsCountByTags = async (tags)=>{
  const cache = await asyncCache  
  return await cache.getPostsCountByTags(tags.split(','))
}

const getPostsCount = async ()=>{
  const cache = await asyncCache  
  return await cache.getPostsCount()
}

module.exports = {
  collect_all_tags,
  collect_all_posts,
  generate_limited_random,
  filterCategory,
  filterTag,
  filterPost,
  getPostById,
  getMediaById,
  getCategoryById,
  getCategoryByName,
  getAllCategories,
  getAllTags,
  getAllTagsRaw,
  getTagByName,
  create,
  createMedia,
  createTest,
  getAllPosts,
  getPostsBySearch,
  getPostsByTags,
  refresh,
  lastUpdateTime,
  query,
  getPostsByProject,
  getProjectsSubmissions,
  getProjectsStudents,
  getProjectNameFromSlug,
  generateSlug,
  getPostsByEmail,
  getPostsCountByTags,
  getPostsCount
}