const {log, safeLog, safeError} = require('../winston-logger.js');
const {wp} = require('./connection.js')

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

const edit = async (id, post) =>{
   try{
    let edit = await wp.posts().id(id).update(post)
    log.info({function: 'wp/create.js edit', outcome:edit})
    return edit
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


module.exports = {
  create,
  edit,
  createMedia
}