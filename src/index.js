const express = require("express");
const { json, urlencoded } = require("body-parser");
const cors = require("cors");
const app = express();

// middlewares
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));


const user = require("../src/routes/User");

app.use("/api/user", user);

module.exports = app;
