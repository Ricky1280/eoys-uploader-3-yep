const AWS = require('aws-sdk')

const {log, safeLog, safeError} = require('../lib/winston-logger.js');

var cloudwatchlogs = new AWS.CloudWatchLogs();

(async()=>{

  var params = {
  logGroupName: 'eoys-uploader-2021', /* required */
    logStreamName: 'express-server-2021-05-28',
  // endTime: 'NUMBER_VALUE',
  limit: '100',
    // nextToken: 'STRING_VALUE',
  startFromHead: false ,
  // startTime: 'NUMBER_VALUE'
  };
  let response = await cloudwatchlogs.getLogEvents(params).promise()

  // console.log(response)

  const events = response.events.map((event)=>{
    event.message = JSON.parse(event.message)
    // if(event.message.function === 'setPost') return false
    return event
  })

  console.log(events.map((event)=>{
    return event.message
  }))
  
})()
