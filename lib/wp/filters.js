const {log, safeLog, safeError} = require('../winston-logger.js');
const { getVideoById } = require('../vimeo')
const { getMediaById } = require('./get.js')

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


module.exports = {
  filterCategory,
  filterTag,
  filterPost,
  hydratePostByType
}