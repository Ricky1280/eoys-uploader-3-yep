const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

//https://github.com/lazywithclass/winston-cloudwatch/blob/master/examples/function-config.js
const log = winston.createLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true,
      level: 'info'
    }),
    new WinstonCloudWatch({
      logGroupName: process.env.AWS_WINSTON_LOG_GROUP || 'eoys-uploader-2021',
      logStreamName: function() {
        // Spread log streams across dates as the server stays up
        let date = new Date().toISOString().split('T')[0];
        return 'express-server-' + date
      },
      awsRegion: 'us-east-1',
      jsonMessage: true,
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.envAWS_SECRET_ACCESS_KEY      
    }),
    new WinstonCloudWatch({
      logGroupName: `${process.env.AWS_WINSTON_LOG_GROUP || 'eoys-uploader-2021'}-warn`,
      logStreamName: function() {
        // Spread log streams across dates as the server stays up
        let date = new Date().toISOString().split('T')[0];
        return 'express-server-' + date
      },
      awsRegion: 'us-east-1',
      jsonMessage: true,
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.envAWS_SECRET_ACCESS_KEY,
      level: 'warn'
    })
  ]
});

const safeLog = (func, payload)=>{
  try{
    log.info({function: func, payload})
  } catch(e) {
    log.error({function: func, e})
    console.error({function: func, e, payload})
  }  
}
const safeError = (func, payload)=>{
  try{
    log.error({function: func, payload})
  } catch(e) {
    log.error({function: func, e})
    console.error({function: func, e, payload})
  }  
}

module.exports = {log, safeLog, safeError}