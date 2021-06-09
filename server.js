//app setup and auth
const express = require("express");
const app = express();
const msal = require('@azure/msal-node');
const cookieSession = require("cookie-session");
const exphbs  = require('express-handlebars');
const fs = require('fs');

//custom middleware
const data = require('./lib/data');
const msalAuth = require('./lib/msal-auth');

//custom routers
const msalRouter = require('./routes/msal-router');
const formRouter = require('./routes/form-router');
const indexRouter = require('./routes/index-router');
const wpRouter = require('./routes/wp-router');
const apiRouter = require('./routes/api-router');

//scheduler
const { ToadScheduler, SimpleIntervalJob, AsyncTask } = require('toad-scheduler')
const scheduler = new ToadScheduler()
const {refresh, timestamp} = require('./lib/wp')


//handlebars interception of .html files for custom rendering
app.engine('html', exphbs({extname: '.html'}));
app.set('view engine', 'html');
// app.engine('html', hbsHelpers.engine);
// app.set('view engine', 'handlebars');


//always use cookies
app.use(cookieSession({
  name: 'auth',
  keys: [process.env.COOKIE_KEY],
  maxAge: 168 * 60 * 60 * 1000, // 24*7 hours
}))

app.use(express.static("public"));

//router setups
const auth = express.Router()
auth.use(msalRouter)

const form = express.Router()
form.use(formRouter)

const wp = express.Router()
wp.use(wpRouter)

const index = express.Router()
index.use(indexRouter)

const api = express.Router()
api.use(apiRouter)
 
//attach routers
app.use('/auth', auth)
app.use('/form', form)
app.use('/wp', wp)
app.use('/', index)
app.use('/api', api)

//schedule
const task = new AsyncTask(
    'Refresh Cache', 
    () => { 
      console.log({function: "Toad Refresh Cache", outcome: "running"})
      return refresh().then(timestamp)
    },
    (e) => {
      console.error({function: "Toad Refresh Cache", outcome: "failed", e})
    }
)
const job = new SimpleIntervalJob({ minutes: 15, }, task)
scheduler.addSimpleIntervalJob(job)

//debug
app.get('/query', (req, res)=>{
  res.sendFile(__dirname+'/views/query.html')
})

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
