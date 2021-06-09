const express = require('express');
const router = express.Router();
const msalAuth = require('../lib/msal-auth');
const data = require('../lib/data');
const fetch = require('node-fetch');
const {log, safeLog, safeError} = require('../lib/winston-logger.js');
const FORM_API_ENDPOINT = process.env.FORM_API_ENDPOINT || 'https://eoys-uploader-2021.glitch.me'
const {getLivePostById, hydratePostByType} = require("../lib/wp.js")
//multer configuration
const multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})
var upload = multer({ storage: storage })

const handlebarsHelpers = { 
  json: function (context) { 
    return JSON.stringify(context, null, '\t')
  },
  checkedIf: function (val, str) {
    let match = false;
    const arr = Array.isArray(val) ? val : [val];
    arr.forEach(function(item) {
      match = item === str ? true : match;
    });
    return (match) ? "checked" : "";
  },
  ifPostAuthorized: function (data, options) {
    const editMode = data.editMode;
    if (data.editMode != true) { 
      return options.fn(this);
    }
    
    const arr = data.previousPosts
    const post = data.post
    
    let match = false;
    arr.forEach(function(item) {
      match = item.id === post.id ? true : match;
    });
    return (match) ? options.fn(this) : options.inverse(this);
  }  
}

const formLogger = (req, res, next) =>{
  log.info({msg:'hit /form', path:req.path, type:'navigation', user:req.session.user})
  next()
}

const fetchData = async (req, res, next) => {

  let user = req.session.user //logic to override moved to msal-auth.validate
  
  let students = await data.students()
  let teachers = await data.faculty()
  let courses = await data.courses()
  let projects = await fetch('https://eoys-uploader-2021.glitch.me/api/projects').then(res=>res.json())
  
  let previousPosts = await fetch(`${FORM_API_ENDPOINT}/wp/posts/${user.email}`).then(res=>res.json())
  
  const post_url = req.params.post ? `${FORM_API_ENDPOINT}/wp/post/${req.params.post}` : undefined
  const post = req.params.post ? await fetch(post_url).then(res=>res.json()) : undefined

  //if email matches, pull data
  let studentDataForUser = students.filter((student)=>{
    return student['Cooper Email'].toLowerCase() === user.email.toLowerCase()
  })
  
  log.info({studentDataForUser})
  
  if(studentDataForUser.length>0) {
    const userOverride = studentDataForUser.shift()
    user = {
      name: {
        full:`${userOverride['First Name']} ${userOverride['Last Name']}`, 
        first: userOverride['First Name'], 
        last: userOverride['Last Name']
      },
      email: user.email,
      academicyear: {

      }
    }
    if(userOverride['Class standing/Status, Spring 2021']) {
      const year = userOverride['Class standing/Status, Spring 2021'].split(' ').shift().toLowerCase()
      user.academicyear[year] = true
    }
  }

  log.info({user})  
  
  const csvData = {
    students,
    teachers,
    courses,
    user,
    projects,
    previousPosts
  }
  
  if(post) csvData.post = post

  try{
    if(process.env.DEBUG=="true" || req.query.debug) {
      csvData.debug = true
    }
  } catch(e){
    console.log({function: 'fetchData', outcome:"no debug data"})
  }

  try {
    csvData.importantMessage = await fetch('https://eoys-uploader-2021-important-static.glitch.me').then(res=>res.text())
  } catch(e) {
    log.info({function:"important message", outcome:"no important message available"})
  }
  
  req.csvData = csvData

  next()
}
const fetchLiveData = async (req, res, next) => {

  let user = req.session.user //logic to override moved to msal-auth.validate
  
  let students = await data.students()
  let teachers = await data.faculty()
  let courses = await data.courses()
  let projects = await fetch('https://eoys-uploader-2021.glitch.me/api/projects').then(res=>res.json())
  
  let previousPosts = await fetch(`${FORM_API_ENDPOINT}/wp/posts/${user.email}`).then(res=>res.json())
  
  const originalPost = await getLivePostById(req.params.post)
  const post = await hydratePostByType(originalPost)

  //if email matches, pull data
  let studentDataForUser = students.filter((student)=>{
    return student['Cooper Email'].toLowerCase() === user.email.toLowerCase()
  })
  
  log.info({studentDataForUser})
  
  if(studentDataForUser.length>0) {
    const userOverride = studentDataForUser.shift()
    user = {
      name: {
        full:`${userOverride['First Name']} ${userOverride['Last Name']}`, 
        first: userOverride['First Name'], 
        last: userOverride['Last Name']
      },
      email: user.email,
      academicyear: {

      }
    }
    if(userOverride['Class standing/Status, Spring 2021']) {
      const year = userOverride['Class standing/Status, Spring 2021'].split(' ').shift().toLowerCase()
      user.academicyear[year] = true
    }
  }

  log.info({user})  
  
  const csvData = {
    students,
    teachers,
    courses,
    user,
    projects,
    previousPosts
  }
  
  if(post) csvData.post = post

  try{
    if(process.env.DEBUG=="true" || req.query.debug) {
      csvData.debug = true
    }
  } catch(e){
    console.log({function: 'fetchData', outcome:"no debug data"})
  }

  try {
    csvData.importantMessage = await fetch('https://eoys-uploader-2021-important-static.glitch.me').then(res=>res.text())
  } catch(e) {
    log.info({function:"important message", outcome:"no important message available"})
  }
  
  req.csvData = csvData

  next()
}


router.get('/', formLogger, msalAuth.validate, fetchData, async(req, res)=>{
  
  const renderOptions = {
    data: req.csvData,
    layout: false,
    helpers: handlebarsHelpers
  }
  return res.render('form', renderOptions)
})

router.post('/form', formLogger, upload.any(), async(req, res)=>{

  log.info({body:req.body, files: req.files})

  req.files = req.files.map((file)=>{
    
    file.fullpath = 'https://eoys-uploader-2021.glitch.me/file/' + file.filename
    return file
    
  })
  res.json(req.files)
})

router.get("/token", formLogger, async (req, res) => {
  res.json({ token: process.env.VIMEO_ACCESS_TOKEN });
});

router.get('/edit/:post', formLogger, msalAuth.validate, fetchLiveData, async (req, res)=>{
  
  req.csvData.editMode = true
  
  const renderOptions = {
    data: req.csvData,
    layout: false,
    helpers: handlebarsHelpers
  } 
  return res.render('form', renderOptions)
  
})


module.exports = router