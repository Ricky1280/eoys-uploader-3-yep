const { 
  generateSlug,
  getPostsByProject,
  getProjectsSubmissions,
  getProjectsStudents,
  getProjectNameFromSlug
} = require('../lib/wp')

test('generateSlug() should converat a string to a slug', async()=>{
  const name = "A test project name with it's own title!"
  const expectedSlug = "a-test-project-name-with-its-own-title"
  
  const slug = await generateSlug(name)
  expect(slug).toEqual(expectedSlug)
})

test('getProjectsSubmissions() should return projects', async()=>{
  const projects = await getProjectsSubmissions()
  expect(projects).toBeTruthy()
})

test('getProjectsSubmissions() should return projects with data', async()=>{
  const projects = await getProjectsSubmissions()
  expect(projects[0].name.length).toBeGreaterThan(0)
})

test('getProjectsStudents() should return a list', async()=>{
  const slug = generateSlug('Senior Show')
  const students = await getProjectsStudents(slug)
  expect(students).toBeTruthy()
})

test('getProjectsStudents() should return a valid list of students', async()=>{
  const slug = generateSlug('Senior Show')
  const students = await getProjectsStudents(slug)
  expect(students.length).toBeGreaterThan(0)
})

test('getProjectNameFromSlug() should return a real project name', async()=>{
  const name = 'Senior Show'
  const slug = generateSlug(name)
  const slugToName = await getProjectNameFromSlug(slug)
  expect(name).toEqual(slugToName.name)
})

test('getPostsByProject() should return posts', async()=>{
  const name = 'Senior Show'
  const slug = generateSlug(name)
  const posts = await getPostsByProject(slug)
  expect(posts.length).toBeGreaterThan(0)
})

test('getPostsByProject() should return posts for that project', async()=>{
  const name = 'Senior Show'
  const slug = generateSlug(name)
  const posts = await getPostsByProject(slug)
  let instancesOfProject = 0
  for(const post of posts) {
    if(post.class.project.includes(name)) instancesOfProject++
  }
  expect(instancesOfProject).toEqual(posts.length)
})