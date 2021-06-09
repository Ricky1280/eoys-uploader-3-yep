const {log, safeLog, safeError} = require('./winston-logger.js');
const dlv = require('dlv')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

const {initialize, schema} = require('./sqlite')


const sqldb = initialize().then(db=>db)


db.defaults({ posts: [], timestamp: 0 }).write()

class PostsCacheLowDb {
  constructor(expiry = 600000) {
    this.age = 0
    this.expiry = expiry
    this.db = db
    log.info("PostsCacheLowDb instantiated with IGNORED expiry:", this.expiry)
  }
  
  reset(){
    log.debug("Reset disabled in LowDB")
    return true
  }
  
  get isFresh(){
    log.debug("isFresh disabled in LowDB")
    return false
  }
  
  get isExpired(){
    log.debug("isExpired disabled in LowDB")
    return true
  }
  
  get posts(){
    log.info({function: 'PostsCacheLowDb get posts()'})
    return this.db.get('posts').value()
  }
  
  set posts(posts) {
    log.info({function: 'PostsCacheLowDb set posts()'})
    
    if(Array.isArray(posts)) {
      for(const post of posts) {
        this.post = post
      } 
      return this.db.get('posts').value()
    } 
    
    return "not an array"
  }
  
  set post(post) {
    log.info({function: 'PostsCacheLowDb set post()'})    
    if(this.db.get('posts').find({ id: post.id }).value()) {
      return "dupe"
    }
    return this.db.get('posts').push(post).write()
  }
  
  timestamp(){
    
  }
  
  contains(id) {
    
  }
  
  //return a specific post
  get(id) {
    log.info({function: 'PostsCacheLowDb get()', id})
    return this.db.get('posts').find({ id: parseInt(id) }).value()
  }
  
  multiple(ids) {
    return this.db.get('posts').filter((post)=>{
      return ids.includes(post.id)
    }).value()
  }
  
  tag(tag) {
    log.info({function: 'PostsCacheLowDb tag()', tag})
    return this.db.get('posts').filter((post)=>{
      
      if(dlv(post, 'taxonomy.tags')) {
        tag = tag.replace(/\-/g , ' ').toLowerCase()
        const tags = post.taxonomy.tags.map(tag=>tag.toLowerCase())
        return tags.includes(tag)
      } 
      
      return false
    }).value()    
  }
  
  tags(tags) {
    log.info({function: 'PostsCacheLowDb tags()', tags})
    tags = tags.map(tag=>tag.replace(/\-/g , ' ').toLowerCase())
    
    return this.db.get('posts').filter((post)=>{
      
      if(dlv(post, 'taxonomy.tags')) {
      
        const postTags = post.taxonomy.tags.map(tag=>tag.toLowerCase())
        
        return postTags.some((tag)=>{
          return tags.includes(tag.toLowerCase())
        })
      }
      
      return false
    }).value()    
  }

}

module.exports = {PostsCacheLowDb}