const WPAPI = require('wpapi');

const {log, safeLog, safeError} = require('../winston-logger.js');

const wp = new WPAPI({ 
  endpoint: process.env.API_ENDPOINT,
  username: process.env.API_USER,
  password: process.env.API_PASSWORD,
  auth: true
});
wp.custom_tags = wp.registerRoute( 'acf/v3', '/tags');
wp.custom_tag = wp.registerRoute( 'acf/v3', '/tags/(?P<id>)');

module.exports = {wp}