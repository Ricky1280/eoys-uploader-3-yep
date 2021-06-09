const express = require('express');
const router = express.Router();
const Special = require('../lib/projects');
const special = new Special();
const {log, safeLog, safeError} = require('../lib/winston-logger.js');
const { fork } = require('child_process');
const path = require('path')

const multer = require('multer');
const memoryStorage = multer.memoryStorage()
const upload = multer({ storage: memoryStorage })

const cors = require('cors');

router.use(cors())

const {
  ...wp
} = require('../lib/wp');

const apiLogger = (req, res, next) =>{
  log.info('hit /api', req.path)
  next()
}

// router.use(cors())

router.get('/posts', apiLogger, async (req, res, next)=>{
  const posts = await wp.getAllPosts()
  res.json(posts)
})

router.get('/posts/:id', apiLogger, async (req, res, next)=>{
  const post = await wp.getPostById(req.params.id)
  res.json(post)
})

router.get('/posts/tags/:tags', apiLogger, async (req, res, next)=>{
  const posts = await wp.getPostsByTags(req.params.tags)
  res.json(posts)
})

router.get('/posts/project/:project', apiLogger, async (req, res, next)=>{
  const posts = await wp.getPostsByProject(req.params.project)
  res.json(posts)
})

router.get('/projects/submissions', apiLogger, async (req, res, next)=>{
  const projects = await wp.getProjectsSubmissions()
  res.json(projects)
})

router.get('/projects/students/:project', apiLogger, async (req, res, next)=>{
  const students = await wp.getProjectsStudents(req.params.project)
  res.json(students)
})

router.get('/projects', apiLogger, async (req, res, next)=>{
  return res.json(special.projects)
})

router.post('/projects', apiLogger, upload.none(), async (req, res, next)=>{
  special.projects = req.body.projects.join("")
  return res.json(req.body.projects)
})

router.get('/refresh', apiLogger, async(req, res, next)=>{
  const refresh = path.resolve(__dirname, '../bin/refresh.js')

  const forked = fork(refresh);
  const response = {function: '/api/refresh', refreshed: true, timestamp: Date.now()}
  log.warn(response)
  res.json(response)

})

router.get('/lastUpdateTime', apiLogger, async(req, res)=>{
  const updateTime = await wp.lastUpdateTime()
  res.json({lastUpdateTime:updateTime})
})

router.post('/query', apiLogger, upload.none(), async(req, res)=>{
  const result = await wp.query(req.body.query)
  res.json(result)
})

router.get('/count/posts/tags/:tags', apiLogger, async (req, res, next)=>{
  const posts = await wp.getPostsCountByTags(req.params.tags)
  res.json(posts)
})

router.get('/count/posts', apiLogger, async (req, res, next)=>{
  const posts = await wp.getPostsCount()
  res.json(posts)
})

module.exports = router