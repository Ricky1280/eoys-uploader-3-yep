const Vimeo = require('vimeo').Vimeo;
const {log, safeLog, safeError} = require('./winston-logger.js');

const client = new Vimeo(
  process.env.VIMEO_CLIENT_ID, 
  process.env.VIMEO_CLIENT_SECRET, 
  process.env.VIMEO_ACCESS_TOKEN
);

const getVideoById = async (id) => {
  return new Promise((resolve, reject)=>{
    client.request({
      path: `/videos/${id}`,
    }, (error, body, status_code, headers) => {
      if (error) reject(error)
      try{
        body.id = parseInt(body.uri.split('/').pop())
      } catch(e) {
        log.error({function:'getVideoById', outcome: "Unable to source id", error:e})
      }
      resolve(body)
    });
  })
}

module.exports = {getVideoById}
