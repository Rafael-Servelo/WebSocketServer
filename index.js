const express = require("express");
const path = require("path");

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const os = require("os");
const clc = require("cli-color");

const networkinfo = os.networkInterfaces();
const ipv4 = networkinfo.en1[1].address;

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "public"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.use("/", (_req, res) => {
  res.render("index.html");
});

let notifications = [];
let messages = [];

io.on("connection", (socket) => {
  console.debug(`Client Connected: ${socket.id} \n`);

  socket.on("disconnect", () => {
    console.debug(`Client Disconnected: ${socket.id} \n`);
  });

  /**
   * Messages Chat
   */

  socket.on("message", (data) => {
    socket.emit("messages", data);
  });

  socket.on("sendMessage", (data) => {
    messages.push(data);
    socket.broadcast.emit("receivedMessage", data);
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });

  socket.emit("previousMessage", messages);

  /**
   * Notifications
   */
  socket.emit("previousNotification", notifications);

  socket.on("sendNotification", (data) => {
    notifications.push(data);
    socket.broadcast.emit("receivedNotification", data);
  });

  socket.on("deleteNotification", (data) => {
    notifications.splice(data, 1);
    socket.emit("previousNotification", notifications);
  });
});

const port = process.env.PORT || 3001

server.listen(port, () => {
  console.log(
    "Starting connection to WebSocket Server in: \n\n" +
      clc.bold.green("→  ") + clc.white.bold("Local: ") + clc.cyanBright(`http://localhost:${port}\n`) +
      clc.bold.green("→  ") + clc.white.bold("Network: ") + clc.cyanBright(`http://${ipv4}:${port}\n`)
  );
});
