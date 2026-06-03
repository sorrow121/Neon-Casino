const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the HTML files from the 'public' folder
app.use(express.static('public'));

// Store active games
const rooms = {};

// Helper function to clean up weird text formatting from the internet API
function decodeHTML(text) {
    return text
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&eacute;/g, 'é');
}

// Fetches a brand new question from the Open Trivia Database
async function fetchNewQuestion() {
    try {
        const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = await response.json();
        const qData = data.results[0];

        const questionText = decodeHTML(qData.question);
        const correctAns = decodeHTML(qData.correct_answer);
        const incorrectAns = qData.incorrect_answers.map(decodeHTML);

        // Combine all answers and shuffle them so the correct answer isn't always 'A'
        const allOptions = [correctAns, ...incorrectAns];
        allOptions.sort(() => Math.random() - 0.5);

        // Assign them to A, B, C, D
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
        console.log("API Error, using fallback.");
        return { 
            q: "Connection Error: Who is the best game dev?", 
            options: ["A) You", "B) Not You", "C) Someone Else", "D) Nobody"], 
            ans: "A" 
        };
    }
}

// Handle all real-time connections
io.on('connection', (socket) => {
  
  // 1. Host creates a new casino room
  socket.on('create', () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString(); 
    rooms[code] = { code, players: [], phase: 'lobby', round: 0, currentQ: null };
    socket.join(code);
    socket.emit('created', { code });
    io.to(code).emit('state', rooms[code]);
  });

  // 2. Player joins via their phone
  socket.on('join', ({ code, name }) => {
    const room = rooms[code];
    if (!room) return socket.emit('err', 'Invalid Room Code');
    
    // Prevent duplicate names
    if(room.players.some(p => p.name === name)) return socket.emit('err', 'Name taken');

    // Create the player profile (with eliminatedAt tracker for exact leaderboard sorting)
    const newPlayer = { 
        id: socket.id, 
        name: name, 
        balance: 1000, 
        bet: null, 
        lastResult: null, 
        eliminatedAt: null 
    };
    
    room.players.push(newPlayer);
    socket.join(code);
    
    socket.emit('joined', { name, balance: 1000 });
    io.to(code).emit('state', room);
  });

  // 3. Player locks in a bet
  socket.on('place_bet', (betData) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
      const room = rooms[roomCode];
      const player = room.players.find(p => p.id === socket.id);
      
      // STRICT BLOCK: If they are dead, or already bet, ignore them
      if(player && !player.bet && player.balance > 0) {
        // Calculate bet amount (Handling the "All In" string)
        let amountToBet = betData.amount === 'all' ? player.balance : parseInt(betData.amount);
        
        // Prevent betting $0, negative numbers, or more than they own
        if(amountToBet > player.balance || amountToBet <= 0) return; 

        player.bet = { option: betData.option, amount: amountToBet };
        player.balance -= amountToBet; // Deduct immediately from balance
        io.to(roomCode).emit('state', room); 
      }
    }
  });

  // 4. Host starts the round (Fetches Trivia)
  socket.on('startRound', async () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        room.round++;
        room.currentQ = await fetchNewQuestion(); // Wait for the internet to send a question
        room.phase = 'betting';
        
        // Clear old bets and results for the new round
        room.players.forEach(p => { 
            p.bet = null; 
            p.lastResult = null; 
        });
        io.to(roomCode).emit('state', room);
    }
  });

  // 5. Host reveals the answer
  socket.on('reveal', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        room.phase = 'results';
        
        // Calculate who won and who lost
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
            
            // Record EXACTLY which round they died in for correct leaderboard sorting later
            if (p.balance <= 0 && !p.eliminatedAt) {
                p.eliminatedAt = room.round;
            }
        });
        io.to(roomCode).emit('state', room);
    }
  });

  // 6. Host triggers the final Podium Phase
  socket.on('endGame', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        rooms[roomCode].phase = 'game_over';
        io.to(roomCode).emit('state', rooms[roomCode]);
    }
  });

  // 7. Host resets the entire room to play again (Keeps players in the room)
  socket.on('resetGame', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        room.phase = 'lobby';
        room.round = 0;
        
        // Revive everyone and give them $1000 again
        room.players.forEach(p => { 
            p.balance = 1000; 
            p.bet = null; 
            p.lastResult = null; 
            p.eliminatedAt = null; 
        });
        io.to(roomCode).emit('state', room);
    }
  });
});

// Start the server (Configured to work on cloud hosts like Render)
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎰 Casino Server is live and running on port ${PORT}`);
});