const {log, safeLog, safeError} = require('../winston-logger.js');
const {asyncCache} = require('./cache.js')
const {wp} = require('./connection.js')
const { getVideoById } = require('../vimeo')
const {collect_all_tags} = require('./collect.js')

const {
  filterCategory,
  filterTag,
  hydratePostByType
} = require('./filters.js')


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

const getLivePostById = async(id)=>{
 log.info({function:"getLivePostById", id})
  
  const post = await wp.posts().id(id).status(['draft']).get()
  try {
    return post 
  } catch (e) {
    console.log(e)
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
  getPostById,
  getLivePostById,
  getMediaById,
  getCategoryById,
  getCategoryByName,
  getAllCategories,
  getAllTags,
  getAllTagsRaw,
  getTagByName,
  getAllPosts,
  getPostsBySearch,
  getPostsByTags,
  getPostsByEmail,
  getPostsCountByTags,
  getPostsCount,
  query
}