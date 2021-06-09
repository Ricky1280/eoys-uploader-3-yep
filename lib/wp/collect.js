const WPAPI = require('wpapi');

const {log, safeLog, safeError} = require('../winston-logger.js');
const {asyncCache} = require('./cache.js')
const {hydratePostByType} = require('./filters.js')
const {wp} = require('./connection.js')

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

const getMediaById = async(id)=>{
  const media = await wp.media().id(id).get()  
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

module.exports = {
  collect_all_tags,
  collect_all_posts,
  collect_all_draft_posts,
  getMediaById
}