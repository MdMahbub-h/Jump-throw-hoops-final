const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get, set, update } = require("firebase/database");
const dotenv = require("dotenv");

dotenv.config();

const firebase = initializeApp({
  apiKey: "AIzaSyALswdE4EclGpsyA4FYVcL0RYe9HZd6vf4",
  authDomain: "article-bcccc.firebaseapp.com",
  databaseURL: "https://article-bcccc-default-rtdb.firebaseio.com",
  projectId: "article-bcccc",
  storageBucket: "article-bcccc.appspot.com",
  messagingSenderId: "558259234111",
  appId: "1:558259234111:web:8b89fa061e0f5a7e189f8a",
});

const db = getDatabase(firebase);

const app = express();

const server = http.createServer(app);

const port = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const getCodes = (score, codes = "[]") => {
  let unlocked = null;
  let newCodes = [];
  try {
    const _codes = JSON.parse(codes);
    if (Array.isArray(_codes)) {
      newCodes = _codes;
    }
  } catch (err) {
    console.log(err);
  }

  if (score >= 500) {
    const cd5h = newCodes.find((cd) => cd.points == "500");
    if (!cd5h) {
      const code = Math.floor(Math.random() * 900000) + 100000;
      unlocked = {
        points: "500",
        code: code,
      };
      newCodes.push(unlocked);
    }
  }

  if (score >= 1000) {
    const cd1k = newCodes.find((cd) => cd.points == "1000");
    if (!cd1k) {
      const code = Math.floor(Math.random() * 900000) + 100000;
      unlocked = {
        points: "1000",
        code: code,
      };
      newCodes.push(unlocked);
    }
  }

  if (score >= 5000) {
    const cd5k = newCodes.find((cd) => cd.points == "5000");
    if (!cd5k) {
      const code = Math.floor(Math.random() * 900000) + 100000;
      unlocked = {
        points: "5000",
        code: code,
      };
      newCodes.push(unlocked);
    }
  }

  return { codes: JSON.stringify(newCodes), unlocked };
};

const storeData = async (data, codes) => {
  try {
    await set(ref(db, `scores/${data.username}`), {
      username: data.username,
      email: data.email,
      score: data.score,
      news: data.news ? "Yes" : "No",
      codes: codes,
    }).then(() => {
      get(ref(db, "scores")).then((scoreValue) => {
        const dataValue = scoreValue.val();

        if (Object.keys(dataValue).length > 100) {
          const scores = Object.entries(dataValue)
            .map((score) => {
              return score[1];
            })
            .sort((a, b) => b.score - a.score);

          scores.splice(-1, 1);

          const scoreData = {};

          scores.forEach((score) => {
            scoreData[score.username] = score;
          });

          set(ref(db, "scores"), scores);
        }
      });
    });
  } catch (err) {
    console.log(err);
  }
};

const sendUserData = async (socket, username) => {
  try {
    get(ref(db, `scores/${username}`)).then((value) => {
      if (value.exists()) {
        const user = value.val();
        socket.emit("userData", user);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

io.on("connection", (socket) => {
  console.log("Connected...");

  socket.on("userData", (data) => {
    sendUserData(socket, data.username);
  });

  socket.on("score", (data) => {
    if (!data.username || data.username.length > 32) return;
    get(ref(db, `scores/${data.username}`)).then(async (value) => {
      if (value.exists()) {
        socket.emit("usernameTaken");
      } else {
        socket.emit("newUser", data);
        const codeData = getCodes(data.score);
        await storeData(data, codeData.codes);
        await sendUserData(socket, data.username);
      }
    });
  });

  socket.on("scoreUpdate", (data, callback) => {
    if (!data.username || data.username.length > 32) return;
    get(ref(db, `scores/${data.username}`)).then(async (value) => {
      if (value.exists()) {
        const dataValue = value.val();

        const score =
          dataValue.score < data.score ? data.score : dataValue.score;
        const codeData = getCodes(data.score, dataValue.codes);
        await update(ref(db, `scores/${data.username}`), {
          score: score,
          codes: codeData.codes,
        });
        sendUserData(socket, data.username);
        callback(codeData.unlocked);
      } else {
        const codeData = getCodes(data.score);
        await storeData(data, codeData.codes);
        await sendUserData(socket, data.username);
        callback(codeData.unlocked);
      }
    });
  });

  socket.on("leaderboard", () => {
    get(ref(db, "scores")).then((value) => {
      socket.emit("leaderboard", value);
    });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected...");
  });
});

app.use(express.static(path.join(__dirname, "public")));

server.listen(port, () => {
  console.log(`Listening to port ${port}...`);
});
