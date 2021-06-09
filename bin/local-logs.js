//to be run locally against files downloaded from s3
const  { readFile, writeFile } =require('fs/promises')
const { inspect } = require('util')

const run = async () => {

  const f = await readFile('000000 (1).txt')
    .then(f=>f.toString())
    
  const lines = f.split('\n')
  lines.pop()

  const json = lines.map((line, i)=>{
      if(i===0) return '[{'
      if(i===lines.length-1) return '}]'
      return line.substring(0,8) === '2021-05-' ? ',{' : line
    }).join('')

  const output = JSON.parse(json)
  // await writeFile('output.json', JSON.stringify(output));

  // console.log(output.length)

  const few = output.slice(0,1000)

  //form submission is formData post
  //formatted form submission is formData post create
  //wp response is formData wp.create

  for (const [i, log] of few.entries()) {
    
    if(typeof log.message === "object") {
      if(Object.keys(log.message).includes('function')){
        if(log.message.function === 'formData post create') {
          console.log(inspect(log.message, false, null))
        }
        if(log.message.function === 'formData wp.create') {
          console.log(inspect(log.message, false, null))
        }
      }
    }

  }
  return true
}


run().then(console.log)