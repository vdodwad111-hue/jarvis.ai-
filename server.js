const express = require("express");

const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use(express.static("public"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`JARVIS running on port ${PORT}`);
});
