const { Server } = require('socket.io');
const PlayerQueues = require('../models/PlayerQueue.js');
const PlayingTeam = require('../models/PlayingTeam.js');

const sendBodysepCourt = async (court) => {
    const body = await {
        teamOnePlay: await PlayingTeam.findOne({ courtId: court }).select('-_id -__v -update_by -update_at'),
        teamTwoPlay: await PlayingTeam.findOne({ courtId: court }).select('-_id -__v -update_by -update_at').skip(1),
        teamQueueList: await PlayerQueues.find({ courtId: court }).select('-_id -__v -update_by -update_at')
    }
    return body
}

module.exports = async (server) => {
    const io = new Server(server, {
        // path: '/ws',
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = ['http://localhost:3000', 'http://localhost:8000', 'https://badminton-queue-h1zt.vercel.app', 'https://badminton-queue-gilt.vercel.app', 'http://badminton-queue-server.onrender.com'];
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ["GET", "POST"], // Allowed HTTP methods
            credentials: true, // Allow cookies or credentials
        },
    });
    let changeStream
    let changeStreamPlaying

    io.on("connection", () => {
        console.log("connected successfully");
    })

    io.on("connection", async (socket) => {
        console.log(socket.id);
        socket.on("subscribe", (room) => {
            const rooms = Array.from(socket.rooms);

            // Leave all other rooms except the socket's own room
            rooms.forEach((currentRoom) => {
                if (currentRoom !== socket.id) {
                    socket.leave(currentRoom);
                }
            });

            // Join the new room
            socket.join(room);
            io.to(room).emit("message", `User ${socket.id} joined room ${room}`);
        });
        socket.on("change", async (room) => {
            if (!changeStream || !changeStreamPlaying) {
                changeStream = PlayerQueues.watch()
                changeStreamPlaying = PlayingTeam.watch()

                changeStream.on('change', async (change) => {
                    console.log('work');
                    const data = await sendBodysepCourt(room)
                    await io.to(room).emit('dataResponse', data)
                })

                changeStreamPlaying.on('change', async (change) => {
                    console.log('work2');
                    const data = await sendBodysepCourt(room)
                    await io.to(room).emit('dataResponse', data)
                });

            }
        });

        socket.on('complete', () => {
            console.log(`Client ${socket.id} completed updates`);
        });

        // changeStream.on("change", async (change) => {
        //     // console.log(change.documentKey._id)
        //     const tempCourtId = await PlayerQueues.findById(change.documentKey._id)
        //     emitPlayersQueue(tempCourtId?.courtId)
        // })
    })
}
