const {getVideoById} = require('../lib/vimeo')

test('getVideoById() should give back data for that video', async()=>{
  const id = 554564882
  
  const video = await getVideoById(id)
  expect(video.id).toEqual(id)
})

