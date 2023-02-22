const express = require("express");

const app = express();

app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const credentials = { username: "admin", password: "admin" };
let storedCode = {};
let session = {};

app.get("/oauth/authorize", (req, res) => {
  const { code, redirect_uri, username, state } = req.query;
  storedCode[username] = code;
  res.redirect(301, `${redirect_uri}?code=${code}&state=${state}`);
});

app.post("/oauth/token", (req, res) => {
  const { username, code } = req.query;

  const token = {
    access_token: "token",
    token_type: "Bearer",
    expires_in: 86400,
  };

  if (req.cookies && session && session[username]) {
    res.json(token);
  } else {
    if (code === storedCode[username]) {
      session[username] = true;
      // send back access token
      res.cookie("session", "authenticated", { httpOnly: true });
      res.json(token);
    } else {
      // send back 401
      res.status(401).send("Unauthorized");
    }
  }
});

app.get("/api/users", (req, res) => {
  res.json({ users: [{ name: "John" }, { name: "Jane" }] });
});

app.get("/random", (req, res) => {
  res.json([{ name: "Random1" }, { name: "Random2" }]);
});

// listen to port 3000
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
