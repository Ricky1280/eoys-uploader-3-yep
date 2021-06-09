const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({extended:true})
const push = require('../lib/push');
const fetch = require('node-fetch');
const FormData = require('form-data');
const {log, safeLog, safeError} = require('../lib/winston-logger.js');
//multer configuration
const multer = require('multer');
var memoryStorage = multer.memoryStorage()
var upload = multer({ storage: memoryStorage })

const apiUrl = process.env.apiUrl || 'https://eoys-uploader-2021.glitch.me'

const pluck = (data)=>{
  return data.filter((item)=>{return item != ''})
}

const multiple = (data)=>{
  
  if(Array.isArray(data)) {
    log.info('already an array, converting to a string', data)
    return JSON.stringify(data)
  }  
  if (data == undefined) {return undefined}
  
  log.info('converting string to array to string', data)
  return JSON.stringify([data])
}

const singular = (data)=>{
  try{
    return multiple(data).shift()
  } catch(e){
    log.info("Could not find a singular elemenet:", data)
    return undefined
  }  
}

const parse = (data)=>{
  try{
    return JSON.parse(data)
  } catch(e){
    log.info("Could not parse:", data)
    return undefined
  }  
}

const {
  getAllTags, 
  getAllCategories,
  ...wp
} = require('../lib/wp');

const wpLogger = (req, res, next) =>{
  log.info('hit /wp', req.path)
  next()
}

router.get('/', wpLogger, async (req, res, next)=>{
  
  return res.json({ok: true})
  
  log.info('running test')
  let test = await wp.create()
  res.json({ok:true, test})
})

router.post('/', wpLogger, upload.none(), async (req, res, next)=>{
  log.info('creating a post')
  log.info(req.body)
  try {
    let post = await wp.create(req.body)
    res.json("ok")
  } catch (e) {
    res.status(500).json({error:e})
  }

})

router.post('/json', wpLogger, jsonParser, async (req, res, next)=>{
  log.info('creating a post for real')
  log.info(req.body)
  try {
    let post = await wp.create(req.body)
    res.json(post)
  } catch (e) {
    res.status(500).json({error:e})
  }

})

//testing
router.post('/formData', wpLogger, upload.none(), async (req, res, next)=>{
  safeLog('formData post', {body:req.body, type:'create'})  
  let {
    worktitle,
    firstname,
    lastname,
    faculty,
    medium,
    description,
    dimensions,
    materials,
    email,
    project,
    media,
    artworkid,
    videoworkid,
    videoworktitle,
    workid,
    academicyear,
    documentationformat,
    thumbnailid,
    classproject,
    whichproject,
    typeofwork,
    url,
    workurl,
    projects,
    recommended,
    classes
  } = req.body
  
  //log.info("special debug", firstname, lastname, projects)
  //handle optional many items 
  let tags = multiple(medium)
  media = multiple(workid)
  thumbnailid = multiple(thumbnailid)
  let course = multiple(classes)
  let instructor = multiple(faculty)
  projects = multiple(projects)
  const body = {
    title: worktitle,
    fields: {
      type: documentationformat,  
      metatype: typeofwork,
      author: {
        first: firstname,
        last: lastname,
        formatted: `${firstname} ${lastname}`,
        academicyear,
        email
      },
      taxonomy: {
        tags: tags || null,
      },
      meta: {
        description,
        dimensions,
        materials
      },
      assets:{
        media,
        preview: thumbnailid,
        url: url || workurl || null       
      },
      class:{
        course,
        instructor: instructor || null,
        recommended,
        project: projects || null
      }
    }
  }
  
  try {
    if(Array.isArray(projects)) {
      let projectsForm = new FormData();
      for (const project of projects){
        projectsForm.append("projects", project)
      }

      await fetch(apiUrl + '/api/projects',{
        method:'POST',
        body:projectsForm
      })
    } else {
      throw new Error('projects was not an array')
    }
  } catch(e) {
    log.info({
      function: 'formData wp.create post project', 
      outcome: 'projects were omitted, so ignored', 
      e
    })
  }
  
  try {
    safeLog('formData post create', body)
    let post = await wp.create(body)
    push(post.id, "A new post was created!")
    safeLog('formData wp.create', post) 
 
//     const refresh = await fetch(apiUrl + '/api/refresh')
//       .then(res=>res.json())
//       .catch((e)=>{
//         log.error({function: 'formData wp.create refresh', e})
//       })
    
    res.json(post)
  } catch (e) {
    safeError('formData post create', e)    
    res.status(500).json({error:e})
  }

})

router.post('/formData/edit/:id', wpLogger, upload.none(), async (req, res, next)=>{
  safeLog('formData post edit', {body:req.body, type:'edit'})  
  let {
    id,
    worktitle,
    firstname,
    lastname,
    faculty,
    medium,
    description,
    dimensions,
    materials,
    email,
    project,
    media,
    artworkid,
    videoworkid,
    videoworktitle,
    workid,
    academicyear,
    documentationformat,
    thumbnailid,
    classproject,
    whichproject,
    typeofwork,
    url,
    workurl,
    projects,
    recommended,
    classes
  } = req.body
  
  //log.info("special debug", firstname, lastname, projects)
  //handle optional many items 
  let tags = multiple(medium)
  media = multiple(workid)
  thumbnailid = multiple(thumbnailid)
  let course = multiple(classes)
  let instructor = multiple(faculty)
  projects = multiple(projects)
  const body = {
    title: worktitle,
    fields: {
      type: documentationformat,  
      metatype: typeofwork,
      author: {
        first: firstname,
        last: lastname,
        formatted: `${firstname} ${lastname}`,
        academicyear,
        email
      },
      taxonomy: {
        tags: tags || null,
      },
      meta: {
        description,
        dimensions,
        materials
      },
      assets:{
        media,
        preview: thumbnailid,
        url: url || workurl || null       
      },
      class:{
        course,
        instructor: instructor || null,
        recommended,
        project: projects || null
      }
    }
  }
  
  try {
    if(Array.isArray(projects)) {
      let projectsForm = new FormData();
      for (const project of projects){
        projectsForm.append("projects", project)
      }

      await fetch(apiUrl + '/api/projects',{
        method:'POST',
        body:projectsForm
      })
    } else {
      throw new Error('projects was not an array')
    }
  } catch(e) {
    log.info({
      function: 'formData wp.create post project', 
      outcome: 'projects were omitted, so ignored', 
      e
    })
  }
  
  try {
    safeLog('formData post edit submission', body)
    let post = await wp.edit(id, body)
    push(post.id, "A post was edited!")
    safeLog('formData post edit response', post) 
 
    res.json(post)
  } catch (e) {
    safeError('formData post edit error', e)    
    res.status(500).json({error:e})
  }

})
  
router.post('/image', wpLogger, upload.any(), async (req, res, next)=>{

    
  safeLog('image', req.body) 

  try {
    let media = await wp.createMedia(req.files[0], req.body)
    safeLog('image media', media) 

    const {id, media_details, caption, source_url, originalname} = media
    const {thumbnail} = media_details.sizes
    res.json({
      id, 
      caption: caption.raw, 
      thumbnail, 
      source_url,
      originalname
    })
  } catch(e) {
    log.error(e)
    res.status(500).json({error:e})
  }
  
})

router.post('/imageArray', wpLogger, upload.any(), async (req, res, next)=>{

  safeLog('imageArray', req.body) 
  
  const medias = req.files.map((file, i)=>{
    try {
      const meta = {description: `Uploaded by ${req.session.user.email}`}
      for (const key of Object.keys(req.body)) {
        log.info({key})
        const parsedItem = JSON.parse(req.body[key])[i]
        meta[key] = parsedItem
      }
      safeLog('imageArray createMedia', meta) 

      return wp.createMedia(req.files[i], meta)
    } catch (e){
      const errorMessage = `Error submitting file ${file.originalname}`
      log.error(errorMessage, e)
      throw new Error(e)
    }
  })
  
  const submitted = await Promise.all(medias)
  
  const formattedSubmissions = submitted.map((media)=>{
    safeLog('imageArray formattedSubmissions', media) 

    const {id, media_details, caption, source_url, originalname} = media
    const {thumbnail} = media_details.sizes
    
    return {
      id, 
      caption: caption.raw, 
      thumbnail, 
      source_url,
      originalname
    }
  })
  
  try{ 
    res.json(formattedSubmissions)
  } catch(e) {
    log.error(e)
    res.status(500).json({error:e})
  }
   
})

router.get('/tags', wpLogger, async (req, res) => {
  const tags = await getAllCategories()  
  res.json(tags)
})

router.get('/post/:id', wpLogger, async (req,res)=>{
  const post = await wp.getPostById(req.params.id)
  res.json(post)  
})


router.get('/media/:id', wpLogger, async (req,res)=>{
  const media = await wp.getMediaById(req.params.id)
  res.json(media)
  
})

router.get('/posts/:email', wpLogger, async (req, res)=>{
  const posts = await wp.getPostsByEmail(req.params.email)
  res.json(posts)
})

module.exports = router