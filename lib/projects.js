const {log, safeLog, safeError} = require('./winston-logger.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')

class Special {
  constructor(){
    this.adapter = new FileSync(__dirname + '/../.data/db.json')
    this.db = low(this.adapter)
    this.db.defaults({ projects: []}).write()
    
    this.projectsSet = new Set(this.db.get('projects').value())
  }
  
  // refresh() {
  //   this.projectsSet = new Set(this.db.get('projects').value())    
  // }
  
  get projects() {
    log.info("getting projects from map")
    // this.refresh()
    return Array.from(this.projectsSet) //
    // return this.db.get('projects').value()
  }
  
  set projects(projects) {
    log.info("received for real, adding to the map", projects)

    projects = JSON.parse(projects) 
    projects.map(project=>this.projectsSet.add(project))
    
    this.db.setState({projects:this.projects})
    this.db.write()
    this.projectsSet = new Set(this.db.get('projects').value())
  }
  
}

module.exports = Special