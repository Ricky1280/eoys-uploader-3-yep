const {getLivePostById, hydratePostByType} = require('../lib/wp.js')

test('get a post by id', async()=>{
  
  const id = 4326
  const post = await getLivePostById(id)
  const hydratedPost = await hydratePostByType(post)
  expect(id).toEqual(hydratedPost.id)
  
})

// const fetch = require('node-fetch')

// fetch("https://eoys-uploader-2021-stage.glitch.me/wp/formData", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9",
//     "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryk6MBj5IYMzvqo85o",
//     "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin"
//   },
//   "referrer": "https://eoys-uploader-2021-stage.glitch.me/form/edit/4326",
//   "referrerPolicy": "strict-origin-when-cross-origin",
//   "body": "------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"firstname\"\r\n\r\nErin\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"lastname\"\r\n\r\nSparling\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"email\"\r\n\r\nErin.Sparling@cooper.edu\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"academicyear\"\r\n\r\nsenior\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"documentationformat\"\r\n\r\nimages\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"worktitle\"\r\n\r\ntest post of a huge pdf\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"typeofwork\"\r\n\r\nimage\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"workid\"\r\n\r\n4324\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"thumbnailid\"\r\n\r\n4325\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"dimensions\"\r\n\r\n\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"materials\"\r\n\r\nfood\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"description\"\r\n\r\n\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nInstallation\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"medium\"\r\n\r\nPhotography\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"classproject\"\r\n\r\nproject\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"projects\"\r\n\r\nSenior Show\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"editMode\"\r\n\r\ntrue\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o\r\nContent-Disposition: form-data; name=\"id\"\r\n\r\n4326\r\n------WebKitFormBoundaryk6MBj5IYMzvqo85o--\r\n",
//   "method": "POST",
//   "mode": "cors",
//   "credentials": "include"
// });
