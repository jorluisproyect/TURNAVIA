const http = require("http");
const next = require("next");

const dev = false;
const port = process.env.PORT || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => handle(req, res));

    server.listen(port, () => {
      console.log(`TUCITA running on ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start TUCITA:", err);
    process.exit(1);
  });
