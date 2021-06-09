const fetch = require('node-fetch')

test('fetch post 3704 and verify that it comes back', async()=>{
  const id = 3704
  const url = `${process.env.FORM_API_ENDPOINT}/api/posts/${id}`
  
  const post = await fetch(url).then(r=>r.json())
  expect(post.id).toBe(id)
})

test('a captured post for a single image', async()=>{
  const title = `Jest post #${Math.round(Math.random()*1000)}`
  const post = await fetch(`${process.env.FORM_API_ENDPOINT}/wp/formData`, {
    "headers": {
      "accept": "*/*",
      "content-type": "multipart/form-data; boundary=----WebKitFormBoundary7R75iAtoF7A2zlTA",
    },
    "referrer": `${process.env.FORM_API_ENDPOINT}/form`,
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": `------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"firstname\"\r\n\r\nErin\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"lastname\"\r\n\r\nSparling\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"email\"\r\n\r\nErin.Sparling@cooper.edu\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"academicyear\"\r\n\r\nsenior\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"documentationformat\"\r\n\r\nimages\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"worktitle\"\r\n\r\n${title}\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"typeofwork\"\r\n\r\nimage\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"artworkupload\"; filename=\"\"\r\nContent-Type: application/octet-stream\r\n\r\n\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"workid\"\r\n\r\n4830\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"thumbnailupload\"; filename=\"\"\r\nContent-Type: application/octet-stream\r\n\r\n\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"thumbnailid\"\r\n\r\n4831\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"dimensions\"\r\n\r\n\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"materials\"\r\n\r\nTests\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"description\"\r\n\r\n\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nDesign\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nDrawing\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nInstallation\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nPainting\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nPerformance\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nPhotography\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nPrintmaking\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nSculpture\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nSound Art\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nFilm + Video\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"classproject\"\r\n\r\nproject\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA\r\nContent-Disposition: form-data; name=\"projects\"\r\n\r\nSenior Show\r\n------WebKitFormBoundary7R75iAtoF7A2zlTA--\r\n`,
    "method": "POST",
    "mode": "cors"
  }).then(r=>r.json())
  expect(post.title.raw).toBe(title)
})

