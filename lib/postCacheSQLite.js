const {log, safeLog, safeError} = require('./winston-logger.js');
const dlv = require('dlv')
const path = require('path')
const { fork } = require('child_process');

//sqlite
const sqlite3 = require('sqlite3').verbose()
const {open} = require('sqlite')
const {schema, initialize} = require('./sqlite')


class PostsCache {
  constructor(expiry = 600000, verbose = false, db = undefined) {
    this.age = 0
    this.expiry = expiry
    this.verbose = verbose
    this.db = (db === undefined) ? this.init() : db
  }
  
  static async build(expiry = 600000, verbose = true) {
    await initialize(undefined, verbose)
    if(verbose === true) {
      log.info({function: 'PostsCache build', outcome: `initialized ${schema.name}`})
    }    
    const db = await open({
      filename: './.data/sqlite.db',
      driver: sqlite3.cached.Database
    })
    return new PostsCache(expiry, verbose, db)    
  }
  
  async init() {
    await initialize()
    safeLog({function: 'init', outcome: "PostsCacheSQLite promise initialized"})
    this.db = await open({
      filename: './.data/sqlite.db',
      driver: sqlite3.cached.Database
    })
  }
  
  get isFresh(){
    const currentTime = new Date().getTime()
    return currentTime - this.age < this.expiry
  }
  
  isFreshDebug(){
    const currentTime = new Date().getTime()
    return{
      age:this.age,
      expiry: this.expiry,
      now: currentTime,
      fresh: currentTime - this.age < this.expiry
    }
  }
  
  timestamp(){
    // log.info({function:'timestamp'})
    const currentTime = new Date().getTime()
    this.age = currentTime
    return this.age
  }
  
  parsePost(row){
    if(!row) return false
    row.post = JSON.parse(row.post)
    return row
  }
  
  parsePosts(rows) {
    
    log.debug({function: "parsePosts", outcome: "parsePosts(rows)"}, Array.isArray(rows))
    
    return rows.map((row)=>{
      if(!row) return false
      return JSON.parse(row.post)
    })
  }
  
  async getPosts(){
    const query = `
      SELECT 
      DISTINCT
        json_extract(post, '$.id') as id, 
        json_extract(post, '$') as post 
      FROM '${schema.name}'
      ORDER BY id DESC`      
    return await this.db.all(query).then(this.parsePosts)
  }
  
  async setPosts(posts) {
    return await Promise.all(posts.map(async (post)=>{      
      return this.setPost(post)
    }))
  }
  
  async setPost(post){
    try {
      const exists = await this.exists(post.id)
      if(exists) {
        log.info({function: 'setPost', outcome: 'duplicate', duplicate: post.id})
        return true
      }
    } catch (e) {
      const error = {function: 'setPost', outcome: 'failed to query duplicate', duplicate: post.id}
      log.error(error)
      throw new Error (error)
    }
      
    
    try{
      log.warn({function: 'setPost', outcome: 'create', id: post.id})
      const query = `INSERT INTO ${schema.name} (post) VALUES (json(?))`
      return await this.db.all(query, JSON.stringify(post))  
    } catch(e) {
      console.log(e)
    }
  }
  
  async exists(id) {
    const query = `
      SELECT 
        json_extract(post, '$.id') as id 
      FROM '${schema.name}' 
      WHERE 
        json_extract(post, '$.id') = $id
      LIMIT 1`
    const result = await this.db.get(query, parseInt(id))
    return (
      (result !== undefined) && 
      (Object.keys(result).includes('id'))
    )
  }
  
  async getTagsByStudentName(formatted) {
    formatted = formatted.toLowerCase()
    const query = `
    SELECT
    DISTINCT
      json_group_array(value) as tag 
    FROM (
      SELECT
      DISTINCT
      json_extract(${schema.name}.post, '$.taxonomy.tags') as tags
      FROM 
        ${schema.name}
      WHERE
        lower(json_extract(${schema.name}.post, '$.author.formatted')) = ?
    ), json_each(tags)`
    
    return await this.db.get(query, [formatted]).then((result)=>{
      //this is stupid and should be fixed in the query
      return Array.from(new Set(JSON.parse(result.tag)))
    })
  }
  
  async getPostsByStudentName(formatted) {
    formatted = formatted.toLowerCase()    
    const query = `
    SELECT 
    DISTINCT
      json_extract(post, '$.id') as id, 
      json_extract(post, '$') as post 
    FROM '${schema.name}'
    WHERE
     lower(json_extract(post, '$.author.formatted')) = ?
    ORDER BY id DESC`
    
    return await this.db.all(query, [formatted]).then(this.parsePosts)
  }
  
  async getPostsByAcademicYear(year) {
    const query = `
    SELECT 
    DISTINCT
      json_extract(post, '$.id') as id, 
      json_extract(post, '$') as post 
    FROM '${schema.name}'
    WHERE
     lower(json_extract(post, '$.author.academicyear')) = ?
    ORDER BY id DESC`
    
    return await this.db.all(query, [year]).then(this.parsePosts)
  }  
  
  async getPostById(id) {
    const query = `
      SELECT 
        json_extract(post, '$.id') as id, 
        json_extract(post, '$') as post 
      FROM '${schema.name}' 
      WHERE 
        json_extract(post, '$.id') = $id
      LIMIT 1`    
    return await this.db.get(query, parseInt(id))
      .then(this.parsePost)
      .then((row)=>{return row.post})
  }
  
  async getPostsByTag(tag) {
    
    tag = tag.replace(/\-/g , ' ').toLowerCase()
    const query = `
      SELECT
      DISTINCT
        ${schema.name}.*
      FROM ${schema.name}, json_each(${schema.name}.post, '$.taxonomy.tags')
      WHERE
        lower(json_each.value) = '?'
      ORDER BY ${schema.name}.id DESC`     
    return await this.db.all(query, [tag]).then(this.parsePosts)  
  }
  
  async getPostsByTags(tags) {
    
    tags = tags.map(tag=>tag.replace(/\-/g , ' ').toLowerCase())
    
    //constuct a string like ('painting','drawing')
    const tagsString = '('+tags.map((tag)=>{
      return `'${tag.toLowerCase()}'`
    }).join(',')+')'
    
    //construct a string like ?,?,?
    const tagsSub = tags.map((tag)=>{return `?`}).join(',')
    
    const query = `
      SELECT
      DISTINCT
        ${schema.name}.*
      FROM ${schema.name}, json_each(${schema.name}.post, '$.taxonomy.tags')
      WHERE
        lower(json_each.value) IN (${tagsSub})
      ORDER BY ${schema.name}.id DESC`
    // log.info({query, tags, tagsSub})
    return await this.db.all(query, [...tags]).then(this.parsePosts)  
  }
  
  async getPostsCountByTags(tags) {
    tags = tags.map(tag=>tag.replace(/\-/g , ' ').toLowerCase())
    const tagsSub = tags.map((tag)=>{return `?`}).join(',')
    
    const query = `    
      SELECT 
        count(*) as count
      FROM (
        SELECT
        DISTINCT
          ${schema.name}.id
        FROM ${schema.name}, json_each(${schema.name}.post, '$.taxonomy.tags') as tags
        WHERE
          lower(tags.value) IN (${tagsSub})
        ORDER BY ${schema.name}.id DESC
      )`
    
    return await this.db.get(query, [...tags])
  }
  
  async getPostsCount() {
    

    
    const query = `    
      SELECT
        count(*) as count
      FROM (
        SELECT 
        DISTINCT
          json_extract(post, '$.id') as id, 
          json_extract(post, '$') as post 
        FROM '${schema.name}'
        ORDER BY id DESC
      )
    `
    
    return await this.db.get(query)
  }  
  
  async getPostsByProject(project) {
        
    project = project.toLowerCase()
    
    const query = `
      SELECT 
        json_object(
          'id', id,
          'title', title,
          'type', type, 
          'author', author,
          'taxonomy', taxonomy,
          'meta', meta,
          'assets', assets,
          'route', route,
          'class', class
        ) as post
      FROM (
        SELECT
        DISTINCT
          json_extract(${schema.name}.post, '$.id') as id,
          json_extract(${schema.name}.post, '$.title') as title,
          json_extract(${schema.name}.post, '$.type') as type,
          json_extract(${schema.name}.post, '$.author') as author,
          json_extract(${schema.name}.post, '$.taxonomy') as taxonomy,
          json_extract(${schema.name}.post, '$.meta') as meta,
          json_extract(${schema.name}.post, '$.assets') as assets,          
          json_extract(${schema.name}.post, '$.route') as route,
          json_extract(${schema.name}.post, '$.class') as class
        FROM ${schema.name}, json_each(${schema.name}.post, '$.class.project') as project
      WHERE 
        lower(project.value) = ?)
    `
    
    return await this.db.all(query, [project]).then(this.parsePosts)  
  }  
  
  async getProjectsSubmissions () {
        
      const query = `
      SELECT
      DISTINCT
        value
      FROM 
        ${schema.name}, json_each(${schema.name}.post, '$.class.project')
      WHERE 
        json_each.value != ''
      ORDER BY 
        lower(value) 
      ASC`
    
    return await this.db.all(query)
      
  }
  
  async getProjectsStudents(project) {
    
    project = project.toLowerCase()
    
    const query = `
      SELECT
      DISTINCT
        formatted.value
      FROM 
        ${schema.name}, 
        json_each(${schema.name}.post, '$.author.formatted') as formatted,
        json_each(${schema.name}.post, '$.class.project') as project
      WHERE
        lower(project.value) = ?
      ORDER BY ${schema.name}.id DESC`
    
    return await this.db.all(query, [project])
  }    
  
  async getPostsByEmail(email) {
    
    email = email.toLowerCase()

    const query = `
      SELECT
      DISTINCT
        ${schema.name}.*
      FROM ${schema.name}, json_each(${schema.name}.post, '$.author')
      WHERE
        lower(json_each.value) = ?
      ORDER BY ${schema.name}.id DESC`
      // log.info({query, tags, tagsSub})
    return await this.db.all(query, [email]).then(this.parsePosts)  
  }      
  
  
  
  async getLastUpdateTime(){
    const query = `
      SELECT
        timestamp
      FROM ${schema.name}
      ORDER BY 
        timestamp
      DESC
      LIMIT 1`
    return await this.db.all(query)
  }
  
  async refresh() {
    this.timestamp()
    try{
      const refresh = path.resolve(__dirname, '../bin/refresh.js')
      const forked = fork(refresh);
      return {function: 'postCacheSQLite refresh', refreshed: true, timestamp: Date.now()}
    } catch(e) {
      log.error({function:'postCacheSQLite refresh', e})
      return false
    }
  }
  
  async query(query) {
    try{
      return await this.db.all(query)     
    } catch(e) {
      log.error({function:'postCacheSQLite query', e, query})
      return false
    }
  }
}



  

module.exports = {PostsCache}