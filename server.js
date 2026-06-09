const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
const rooms = {};

// ==========================================
// 🧠 CATEGORIZED QUESTION DATABASE
// ==========================================
const customDatabase = [
    // --- BLOCKCHAIN ---
    { cat: "blockchain", q: "What is the primary benefit of a 'Smart Contract'?", correct: "Automated self-execution", incorrect: ["Live chat", "Physical storage", "Printing money"] },
    { cat: "blockchain", q: "What does 'DeFi' stand for?", correct: "Decentralized Finance", incorrect: ["Digital Exchange Fiat", "Derivative Financial Instrument", "Decrypted File Interface"] },
    { cat: "blockchain", q: "Which consensus is more energy-efficient?", correct: "Proof of Stake (PoS)", incorrect: ["Proof of Work (PoW)", "Proof of Print (PoP)", "Proof of Vault (PoV)"] },
    { cat: "blockchain", q: "What are 'Gas Fees'?", correct: "Costs to compensate validators", incorrect: ["Taxes to government", "Monthly subscriptions", "Password penalties"] },
    { cat: "blockchain", q: "What is a 'Rug Pull'?", correct: "A scam where developers steal funds", incorrect: ["A stock market crash", "Reversing a transaction", "Hardware malfunction"] },
    
    // --- VIDEO GAMES ---
    { cat: "gaming", q: "What is the best-selling video game console of all time?", correct: "PlayStation 2", incorrect: ["Nintendo DS", "Xbox 360", "Nintendo Switch"] },
    { cat: "gaming", q: "In Minecraft, what material is required to build a Nether Portal?", correct: "Obsidian", incorrect: ["Diamond", "Bedrock", "Cobblestone"] },
    { cat: "gaming", q: "What is the name of the main protagonist in the Halo series?", correct: "Master Chief", incorrect: ["Doomguy", "Commander Shepard", "Marcus Fenix"] },
    { cat: "gaming", q: "Which company created the game 'Counter-Strike'?", correct: "Valve", incorrect: ["Riot Games", "Blizzard", "Epic Games"] },
    { cat: "gaming", q: "What is the highest selling video game of all time?", correct: "Minecraft", incorrect: ["Tetris", "GTA V", "Wii Sports"] },

    // --- FUN TRIVIA ---
    { cat: "trivia", q: "What shape is wombat poop?", correct: "Cube-shaped", incorrect: ["Spherical", "Pyramid-shaped", "Flat"] },
    { cat: "trivia", q: "How many hearts does an octopus have?", correct: "Three", incorrect: ["One", "Two", "Eight"] },
    { cat: "trivia", q: "Which country invented ice cream?", correct: "China", incorrect: ["Italy", "France", "USA"] },
    { cat: "trivia", q: "What is the national animal of Scotland?", correct: "Unicorn", incorrect: ["Highland Cow", "Loch Ness Monster", "Eagle"] }
];

function getCustomQuestion(category) {
    // Filter database by category, or mix them all if "mixed"
    let pool = customDatabase;
    if (category !== "mixed") {
        pool = customDatabase.filter(q => q.cat === category);
        if(pool.length === 0) pool = customDatabase; // Fallback
    }

    const qData = pool[Math.floor(Math.random() * pool.length)];
    const allOptions = [qData.correct, ...qData.incorrect];
    allOptions.sort(() => Math.random() - 0.5); 

    const labels = ['A', 'B', 'C', 'D'];
    let finalOptions = [];
    let finalAnswerLetter = '';

    for (let i = 0; i < 4; i++) {
        finalOptions.push(`${labels[i]}) ${allOptions[i]}`);
        if (allOptions[i] === qData.correct) {
            finalAnswerLetter = labels[i];
        }
    }
    return { q: qData.q, options: finalOptions, ans: finalAnswerLetter };
}

io.on('connection', (socket) => {
  socket.on('create', () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString(); 
    rooms[code] = { code, hostSocketId: socket.id, players: [], phase: 'lobby', round: 0, currentQ: null, maxRounds: 5, category: 'mixed' };
    socket.join(code);
    socket.emit('created', { code });
    io.to(code).emit('state', rooms[code]);
  });

  socket.on('reclaim_host', ({ code }) => {
    if (rooms[code]) {
        rooms[code].hostSocketId = socket.id;
        socket.join(code);
        socket.emit('created', { code }); 
        io.to(code).emit('state', rooms[code]);
    } else {
        socket.emit('err', 'ROOM_EXPIRED');
    }
  });

  // Host closes the room manually
  socket.on('close_room', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        io.to(roomCode).emit('kicked'); // Kick all players
        delete rooms[roomCode]; // Destroy room
        socket.emit('err', 'ROOM_EXPIRED'); // Reset host screen
    }
  });

  socket.on('join', ({ code, name }) => {
    const room = rooms[code];
    if (!room) return socket.emit('err', 'Invalid Room Code');

    const existingPlayer = room.players.find(p => p.name === name);

    if (room.phase !== 'lobby') {
        if (existingPlayer) {
            existingPlayer.id = socket.id;
            socket.join(code);
            socket.emit('joined', { name: existingPlayer.name, balance: existingPlayer.balance });
            io.to(code).emit('state', room);
            return;
        } else return socket.emit('err', 'Game already in progress');
    }

    if (existingPlayer) {
        existingPlayer.id = socket.id;
        socket.join(code);
        socket.emit('joined', { name: existingPlayer.name, balance: existingPlayer.balance });
        io.to(code).emit('state', room);
        return;
    }

    // NEW: Added powerups tracking
    const newPlayer = { 
        id: socket.id, name, balance: 1000, bet: null, lastResult: null, 
        eliminatedAt: null, totalBet: 0, totalWon: 0, 
        powerups: { fifty: 1, peek: 1 } 
    };
    room.players.push(newPlayer);
    socket.join(code);
    socket.emit('joined', { name, balance: 1000 });
    io.to(code).emit('state', room);
  });

  socket.on('kick_player', ({ pId }) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        const pIndex = room.players.findIndex(p => p.id === pId);
        if (pIndex !== -1) {
            const targetSocketId = room.players[pIndex].id;
            room.players.splice(pIndex, 1);
            io.to(targetSocketId).emit('kicked'); 
            io.to(roomCode).emit('state', room);
        }
    }
  });

  // --- POWERUP LOGIC ---
  socket.on('use_5050', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        const player = room.players.find(p => p.id === socket.id);
        if(player && player.powerups.fifty > 0 && room.phase === 'betting') {
            player.powerups.fifty -= 1;
            // Find 2 wrong answers
            const correctAns = room.currentQ.ans;
            const wrongOptions = ['A','B','C','D'].filter(l => l !== correctAns);
            // Shuffle and pick 2
            wrongOptions.sort(() => Math.random() - 0.5);
            const toHide = [wrongOptions[0], wrongOptions[1]];
            socket.emit('5050_result', toHide);
            io.to(roomCode).emit('state', room); // update host to show used powerup
        }
    }
  });

  socket.on('use_peek', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        const player = room.players.find(p => p.id === socket.id);
        if(player && player.powerups.peek > 0 && room.phase === 'betting') {
            player.powerups.peek -= 1;
            
            // Get top 3 players by balance (excluding the user asking)
            const topPlayers = [...room.players]
                .filter(p => p.id !== socket.id)
                .sort((a,b) => b.balance - a.balance)
                .slice(0, 3);
            
            const peekData = topPlayers.map(p => {
                return { name: p.name, bet: p.bet ? p.bet.option : "Thinking..." };
            });

            socket.emit('peek_result', peekData);
            io.to(roomCode).emit('state', room);
        }
    }
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
        player.totalBet += amountToBet;
        io.to(roomCode).emit('state', room); 
      }
    }
  });

  socket.on('startRound', (settings) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        if (settings && settings.maxRounds) room.maxRounds = parseInt(settings.maxRounds);
        if (settings && settings.category) room.category = settings.category;

        room.round++;
        room.currentQ = getCustomQuestion(room.category);
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
                    p.totalWon += payout; 
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
        room.players.forEach(p => { 
            p.balance = 1000; p.bet = null; p.lastResult = null; 
            p.eliminatedAt = null; p.totalBet = 0; p.totalWon = 0; 
            p.powerups = { fifty: 1, peek: 1 }; // Refill powerups!
        });
        io.to(roomCode).emit('state', room);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎰 Casino Server is live and running on port ${PORT}`);
});
