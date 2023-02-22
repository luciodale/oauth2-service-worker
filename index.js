const express = require("express");

const app = express();

app.use(express.static("public"));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
})

const credentials = {username: 'admin', password: 'admin'};
let code;

app.get('/oauth/authorize', (req, res) => {
  // check that credentials are correct
  // store code in code variable (with username)
  // redirect to the client app with query params
})

app.get('/oauth/token', (req, res) => {
  // if the cookie exists and is authenticated, send back access token
  // else, check that code from query params matches previously stored code
  // if yes, send back access token and set session cookie
  // else, send back 401
  // start coding the comments

  const token = {access_token: "token", token_type: 'Bearer', expires_in: 86400}

  if (req.cookies.session) {
    // logic
    res.json(token);
    
  } else {
    if (req.query.code === code) {
      // send back access token
      res.cookie('session', 'authenticated', { httpOnly: true });
      res.json(token);
    } else {
      // send back 401
      res.status(401).send('Unauthorized');
    }
  }
})

app.get('/api/users', (req, res) => {
  res.json({users: [{name: 'John'}, {name: 'Jane'}]});
})

app.get('/random', (req, res) => {
  res.json([{name: 'Random1'}, {name: 'Random2'}]);
})


// listen to port 3000
app.listen(3000, () => {
  console.log('Server started on port 3000');
})