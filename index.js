const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

let codeState;

app.get("/oauth/authorize", (req, res) => {
  const { redirect_uri, state } = req.query;
  codeState = state;
  res.redirect(301, `${redirect_uri}?code=${state}&state=${state}`);
});

const token = {
  access_token: "token",
  token_type: "Bearer",
  expires_in: 86400,
};

app.post("/oauth/token", (req, res) => {
  const { code } = req.body;

  if (code === codeState && code !== undefined) {
    // send back access token
    res.cookie("session", "authenticated", { httpOnly: true });
    res.json(token);
  } else {
    // send back 401
    res.status(401).send("Unauthorized");
  }
});

app.get("/open-endpoint", (req, res) => {
  res.json([{ name: "Random1" }, { name: "Random2" }]);
});

const checkAuth = (req, res, next) => {
  console.log("in check auth");
  const { authorization } = req.headers;
  const token = authorization && authorization.split(" ")[1];
  if (token === "token") {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
};

app.use(checkAuth);

app.get("/api/users", (req, res) => {
  res.json({ users: [{ name: "John" }, { name: "Jane" }] });
});

// listen to port 3000
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
