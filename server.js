const http = require("http");
const next = require("next");

const dev = false;
const port = process.env.PORT || 3000;
const publicUrl = process.env.APP_URL || "https://tucita.com.ve";
const publicOrigin = new URL(publicUrl);

const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      // cPanel/Passenger proxies the app through localhost. Normalize the
      // public host/protocol before Next.js constructs request URLs so redirects
      // and auth callbacks never point mobile users to localhost:3000.
      req.headers.host = publicOrigin.host;
      req.headers["x-forwarded-host"] = publicOrigin.host;
      req.headers["x-forwarded-proto"] = publicOrigin.protocol.replace(":", "");

      handle(req, res);
    });

    server.listen(port, () => {
      console.log(`TUCITA running on ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start TUCITA:", err);
    process.exit(1);
  });
