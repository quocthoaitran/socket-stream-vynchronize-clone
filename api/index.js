const express = require("express")
const cors = require("cors")
const socketio = require("socket.io")
const dotenv = require("dotenv")

const app = express()

var server = require("http").Server(app)

dotenv.config()

var users = []
connections = []
rooms = []
userRooms = []

const PORT = process.env.PORT || 8080

app.use(express.json())

app.use(cors())

app.get("/", (req, res) => {
  res.json("It's working!")
});

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!!`)
});

const io = socketio(server);

io.on("connection", (socket) => {
  connections.push(socket)
  console.log(
    `The id ${socket.id} was connected. Connections: ${connections.length} sockets connected`
  );
  // updateRooms()

  socket.on("init_user", (username) => {
    socket.username = username
    users.push(username)
    updateRooms()
  })

  socket.on("join_room", (data) => {
    if (socket.roomID !== undefined) {
      //leave current room
      var id = socket.id;
      var roomID = userRooms[id];
      var room = io.sockets.adapter.rooms.get(`room-${roomID}`)
      if (room !== undefined) {
        if (socket.id === room.host) {
          room.users.splice(room.users.indexOf(socket), 1)
          if (room.users.length) {
            userHost = room.users[0]
            room.hostName = userHost.username
            room.host = userHost.id
            updateRoomUsers(roomID)
            updateHostRoom(roomID, room.hostName)
          }
        }

        if (room.users.indexOf(socket) != -1) {
          room.users.splice(room.users.indexOf(socket), 1)
          updateRoomUsers(roomID)
        }

        if (room.users.length == 0) {
          if (rooms.indexOf(roomID) != -1) {
            rooms.splice(rooms.indexOf(roomID), 1)
          }
          // rooms.splice(rooms.indexOf(roomID))
          updateRooms()
        }
      } else {
        if (rooms.indexOf(roomID) != -1) {
          rooms.splice(rooms.indexOf(roomID), 1)
        }
        updateRooms()
      }
      socket.leave(`room-${socket.roomID}`)
      updateRooms()
      delete userRooms[id]
    }

    socket.roomID = data.roomID
    userRooms[socket.id] = data.roomID

    var host = null
    var init = false

    // Adds the room to a global array
    if (!rooms.includes(socket.roomID)) {
      rooms.push(socket.roomID)
    }

    //check if the room exists or not
    if (io.sockets.adapter.rooms.get(`room-${socket.roomID}`) === undefined) {
      // Sets the first socket to join as host
      host = socket.id
      init = true
    } else {
      host = io.sockets.adapter.rooms.get(`room-${socket.roomID}`).host
    }

    //actually join room
    console.log(`${socket.username} connected to room-${socket.roomID}`)
    socket.join(`room-${socket.roomID}`);

    if (init) {
      // Sets the host
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).host = host

      // Host username
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).hostName =
        socket.username
      // Keep list of online users
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).users = [socket]

      //init video
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).queue = []

      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).currVideo = {
        url: "https://www.youtube.com/watch?v=is_5Ikji_FU",
        title: "Em là của anh - KARIK",
        time: 0,
        playing: true,
      };
    }
    // Set host label
    updateHostRoom(
      socket.roomID,
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).hostName
    );

    // Update Queue video
    updateQueueVideos(socket.roomID);

    // Gets current video from room variable
    var currVideo = io.sockets.adapter.rooms.get(`room-${socket.roomID}`)
      .currVideo;
    socket.emit("change_video_client", currVideo)

    if (socket.id != host) {
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).users.push(socket)
    }

    updateRoomUsers(socket.roomID)
    updateRooms()
  });

  socket.on("new_user", (data, callback) => {
    // add user
    socket.username = data.username
    users.push(socket.username)

    // join room
    socket.roomID = data.roomID
    userRooms[socket.id] = data.roomID

    var host = null;
    var init = false;

    // Adds the room to a global array
    if (!rooms.includes(socket.roomID)) {
      rooms.push(socket.roomID)
    }

    //check if the room exists or not
    if (io.sockets.adapter.rooms.get(`room-${socket.roomID}`) === undefined) {
      socket.send(socket.id);

      // Sets the first socket to join as host
      host = socket.id;
      init = true;
    } else {
      host = io.sockets.adapter.rooms.get(`room-${socket.roomID}`).host
    }

    //actually join room
    console.log(`${socket.username} connected to room-${socket.roomID}`)
    socket.join(`room-${socket.roomID}`);
    callback(socket.roomID);

    if (init) {
      // Sets the host
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).host = host

      // Host username
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).hostName =
        socket.username;
      // Keep list of online users
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).users = [socket]

      //init video
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).queue = []

      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).currVideo = {
        url: "https://www.youtube.com/watch?v=is_5Ikji_FU",
        title: "Em là của anh - KARIK",
        time: 0,
        playing: true,
      };
    }
    // Set host label
    updateHostRoom(
      socket.roomID,
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).hostName
    );

    // Update Queue video
    updateQueueVideos(socket.roomID);

    // Gets current video from room variable
    var currVideo = io.sockets.adapter.rooms.get(`room-${socket.roomID}`)
      .currVideo;
    socket.emit("change_video_client", currVideo);

    if (socket.id != host) {
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).users.push(socket)
    }

    updateRoomUsers(socket.roomID);
  });

  socket.on("check_connection", (callback) => {
    if (!socket.username) {
      callback({
        connected: false,
        isHost: false,
      });
    } else if (
      socket.id === io.sockets.adapter.rooms.get(`room-${socket.roomID}`).host
    ) {
      callback({
        connected: true,
        isHost: true,
      });
    } else {
      callback({
        connected: true,
        isHost: false,
      });
    }
  });

  socket.on("send_message", (data) => {
    io.sockets
      .in(`room-${socket.roomID}`)
      .emit("new_message", { message: data, user: socket.username });
  });

  socket.on("sync_video", (data) => {
    io.sockets.adapter.rooms.get(`room-${socket.roomID}`).currVideo = {
      ...io.sockets.adapter.rooms.get(`room-${socket.roomID}`).currVideo,
      ...data,
    };
    updateCurrVideo(socket.roomID);
  });

  //Enqueue video
  socket.on("enqueue_video", (data) => {
    io.sockets.adapter.rooms.get(`room-${socket.roomID}`).queue.push(data);
    updateQueueVideos(socket.roomID);
  });

  socket.on("delete_queue_item", (data) => {
    if (
      socket.id === io.sockets.adapter.rooms.get(`room-${socket.roomID}`).host
    ) {
      io.sockets.adapter.rooms
        .get(`room-${socket.roomID}`)
        .queue.splice(data, 1);
      updateQueueVideos(socket.roomID);
    }
  });

  // play new video
  socket.on("play_video", (data) => {
    if (
      socket.id === io.sockets.adapter.rooms.get(`room-${socket.roomID}`).host
    ) {
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).currVideo = {
        url: data.url,
        title: data.title,
        time: 0,
        playing: true,
      };
      io.sockets.adapter.rooms
        .get(`room-${socket.roomID}`)
        .queue.splice(data.index, 1);
      updateQueueVideos(socket.roomID);
      updateCurrVideo(socket.roomID);
    }
  });

  socket.on("disconnect", () => {
    if (users.indexOf(socket.username) !== -1) {
      users.splice(users.indexOf(socket.username), 1)
      // updateUsernames()
    }

    connections.splice(connections.indexOf(socket), 1)
    console.log(
      `${socket.id} disconnected. ${connections.length} sockets connected`
    );

    // Update room
    var id = socket.id
    var roomID = userRooms[id]
    var room = io.sockets.adapter.rooms.get(`room-${roomID}`)

    if (room !== undefined) {
      if (socket.id === room.host) {
        room.users.splice(room.users.indexOf(socket), 1)
        if (room.users.length) {
          userHost = room.users[0]
          room.hostName = userHost.username
          room.host = userHost.id
          updateRoomUsers(roomID)
          updateHostRoom(roomID, room.hostName)
        }
      }

      if (room.users.indexOf(socket) != -1) {
        room.users.splice(room.users.indexOf(socket), 1)
        updateRoomUsers(roomID);
      }

      if (room.users.length == 0) {
        rooms.splice(rooms.indexOf(roomID))
        updateRooms()
      }
    } else {
      if (rooms.indexOf(roomID) != -1) {
        rooms.splice(rooms.indexOf(roomID))
      }
      updateRooms()
    }
    delete userRooms[id];
  });

  socket.on("request_to_change_host", () => {
    io.to(
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).host
    ).emit("confirm_request", { id: socket.id, username: socket.username })
  });

  socket.on("host_confirm_request", (data) => {
    if (data.isConfirm) {
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).host = data.id
      io.sockets.adapter.rooms.get(`room-${socket.roomID}`).hostName =
        data.username;
      updateHostRoom(socket.roomID, data.username)
    }
    io.to(data.id).emit("answer_request", data.isConfirm)
  })

  socket.on('get_rooms', () => {
    updateRooms()
  })

  //Update all rooms
  function updateRooms() {
    listRooms = rooms.map(room => ({
        room: room,
        hostName: io.sockets.adapter.rooms.get(`room-${room}`).hostName,
        currVideo: io.sockets.adapter.rooms.get(`room-${room}`).currVideo
    }))
    io.sockets.emit("update_list_room", listRooms)
  }

  //Update HostRoom
  function updateHostRoom(roomID, hostName) {
    io.sockets.in(`room-${roomID}`).emit("change_host_label", hostName)
  }

  // Update all users
  function updateUsernames() {}

  // Update current video
  function updateCurrVideo(roomID) {
    io.sockets
      .in(`room-${roomID}`)
      .emit(
        "change_video_client",
        io.sockets.adapter.rooms.get(`room-${roomID}`).currVideo
      );
    updateRooms()
  }

  // Update the room usernames
  function updateRoomUsers(roomID) {
    if (io.sockets.adapter.rooms.get(`room-${roomID}`) !== undefined) {
      var roomUsers = io.sockets.adapter.rooms
        .get(`room-${roomID}`)
        .users.map((user) => user.username);
      io.sockets.in(`room-${roomID}`).emit("get_users", roomUsers)
    }
  }

  // Update Queue videos
  function updateQueueVideos(roomID) {
    if (io.sockets.adapter.rooms.get(`room-${roomID}`) !== undefined) {
      var queueVideo = io.sockets.adapter.rooms.get(`room-${roomID}`).queue
      // var currVideo = io.sockets.adapter.rooms.get(`room-${roomID}`).currVideo
    }
    io.sockets.in("room-" + socket.roomID).emit("get_video_list", {
      queueVideo: queueVideo,
    });
  }
});
