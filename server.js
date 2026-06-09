const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

function decodeHTML(text) {
    return text.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&eacute;/g, 'é');
}

async function fetchNewQuestion() {
    try {
        const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = await response.json();
        const qData = data.results[0];

        const questionText = decodeHTML(qData.question);
        const correctAns = decodeHTML(qData.correct_answer);
        const incorrectAns = qData.incorrect_answers.map(decodeHTML);

        const allOptions = [correctAns, ...incorrectAns];
        allOptions.sort(() => Math.random() - 0.5);

        const labels = ['A', 'B', 'C', 'D'];
        let finalOptions = [];
        let finalAnswerLetter = '';

        for (let i = 0; i < 4; i++) {
            finalOptions.push(`${labels[i]}) ${allOptions[i]}`);
            if (allOptions[i] === correctAns) {
                finalAnswerLetter = labels[i];
            }
        }

        return { q: questionText, options: finalOptions, ans: finalAnswerLetter };
    } catch (err) {
        return { q: "Connection Error: Who is the best game dev?", options: ["A) You", "B) Not You", "C) Someone Else", "D) Nobody"], ans: "A" };
    }
}

io.on('connection', (socket) => {
  
  socket.on('create', () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString(); 
    rooms[code] = { code, players: [], phase: 'lobby', round: 0, currentQ: null, maxRounds: 5 }; // Added maxRounds
    socket.join(code);
    socket.emit('created', { code });
    io.to(code).emit('state', rooms[code]);
  });

  socket.on('join', ({ code, name }) => {
    const room = rooms[code];
    if (!room) return socket.emit('err', 'Invalid Room Code');
    if(room.players.some(p => p.name === name)) return socket.emit('err', 'Name taken');

    const newPlayer = { id: socket.id, name, balance: 1000, bet: null, lastResult: null, eliminatedAt: null };
    room.players.push(newPlayer);
    socket.join(code);
    
    socket.emit('joined', { name, balance: 1000 });
    io.to(code).emit('state', room);
  });

  socket.on('place_bet', (betData) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
      const room = rooms[roomCode];
      const player = room.players.find(p => p.id === socket.id);
      
      if(player && !player.bet && player.balance > 0) {
        let amountToBet = betData.amount === 'all' ? player.balance : parseInt(betData.amount);
        if(amountToBet > player.balance || amountToBet <= 0) return; 

        player.bet = { option: betData.option, amount: amountToBet };
        player.balance -= amountToBet; 
        io.to(roomCode).emit('state', room); 
      }
    }
  });

  // FIX: Start Round now accepts settings from the Host
  socket.on('startRound', async (settings) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        
        // Save the settings if they were passed
        if (settings && settings.maxRounds) {
            room.maxRounds = parseInt(settings.maxRounds);
        }

        room.round++;
        room.currentQ = await fetchNewQuestion();
        room.phase = 'betting';
        room.players.forEach(p => { p.bet = null; p.lastResult = null; });
        io.to(roomCode).emit('state', room);
    }
  });

  socket.on('reveal', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        room.phase = 'results';
        
        room.players.forEach(p => {
            if (p.bet) {
                if (p.bet.option === room.currentQ.ans) {
                    const payout = p.bet.amount * 2;
                    p.balance += payout; 
                    p.lastResult = { won: true, msg: `+ $${payout}` };
                } else {
                    p.lastResult = { won: false, msg: `- $${p.bet.amount}` };
                }
            }
            if (p.balance <= 0 && !p.eliminatedAt) {
                p.eliminatedAt = room.round;
            }
        });
        io.to(roomCode).emit('state', room);
    }
  });

  socket.on('endGame', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        rooms[roomCode].phase = 'game_over';
        io.to(roomCode).emit('state', rooms[roomCode]);
    }
  });

  socket.on('resetGame', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        room.phase = 'lobby';
        room.round = 0;
        room.players.forEach(p => { p.balance = 1000; p.bet = null; p.lastResult = null; p.eliminatedAt = null; });
        io.to(roomCode).emit('state', room);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎰 Casino Server is live and running on port ${PORT}`);
});
