const {log, safeLog, safeError} = require('../winston-logger.js');
const {asyncCache} = require('./cache.js')
const {generateSlug} = require('./utils.js')

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


module.exports = {
  getPostsByProject,
  getProjectsSubmissions,
  getProjectsStudents,
  getProjectNameFromSlug
}