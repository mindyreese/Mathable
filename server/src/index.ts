import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = http.createServer(app);
import { generateRound, scoreRound, findAllSolutions } from '@shared/logic';
import { Round, Path } from '@shared/types';

interface RoomState {
  round: Round | null;
  allSolutions: { path: Path; expression: string }[];
  submissions: { [playerId: string]: Path[] };
  startTime: number;
  roundDuration: number;
}

const rooms = new Map<string, RoomState>();

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('Mathable server running');
});

// simple endpoint to generate a round (seed optional)
app.get('/round', (req, res) => {
  const { seed } = req.query;
  const round = generateRound(typeof seed === 'string' ? seed : undefined);
  res.json(round);
});

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      const round = generateRound();
      const allSolutions = findAllSolutions(round.grid, round.target, round.operatorMode);
      rooms.set(roomId, {
        round,
        allSolutions,
        submissions: {},
        startTime: Date.now(),
        roundDuration: 60000 // 60 seconds
      });
    }
    
    const roomState = rooms.get(roomId);
    if (roomState) {
      io.to(roomId).emit('round-start', roomState.round);
    }
  });
  
  socket.on('submit-path', (roomId: string, path: Path) => {
    const roomState = rooms.get(roomId);
    if (!roomState) return;
    
    if (!roomState.submissions[socket.id]) {
      roomState.submissions[socket.id] = [];
    }
    roomState.submissions[socket.id].push(path);
    
    io.to(roomId).emit('submission', { playerId: socket.id, pathCount: roomState.submissions[socket.id].length });
  });
  
  socket.on('end-round', (roomId: string) => {
    const roomState = rooms.get(roomId);
    if (!roomState) return;
    
    const breakdowns = scoreRound(roomState.submissions, roomState.allSolutions, roomState.round!.grid);
    io.to(roomId).emit('round-end', { scores: breakdowns, solutions: roomState.allSolutions });
    
    // Start next round
    const nextRound = generateRound();
    const nextSolutions = findAllSolutions(nextRound.grid, nextRound.target, nextRound.operatorMode);
    roomState.round = nextRound;
    roomState.allSolutions = nextSolutions;
    roomState.submissions = {};
    roomState.startTime = Date.now();
    
    io.to(roomId).emit('round-start', nextRound);
  });
  
  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
