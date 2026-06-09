const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

// ==========================================
// 🧠 MASSIVE QUESTION DATABASE (80% Finance / 20% Random)
// ==========================================
const customDatabase = [
    // --- FINANCIAL BLOCKCHAIN (40 Questions) ---
    { q: "What is the primary benefit of a 'Smart Contract' in finance?", correct: "Automated self-execution of agreements", incorrect: ["Customer service live chat", "Physical document storage", "Printing paper money"] },
    { q: "What does 'DeFi' stand for in the blockchain space?", correct: "Decentralized Finance", incorrect: ["Digital Exchange Fiat", "Derivative Financial Instrument", "Decrypted File Interface"] },
    { q: "Which consensus mechanism is considered more energy-efficient?", correct: "Proof of Stake (PoS)", incorrect: ["Proof of Work (PoW)", "Proof of Print (PoP)", "Proof of Vault (PoV)"] },
    { q: "In blockchain auditing, what makes the ledger highly secure?", correct: "It is immutable and append-only", incorrect: ["It is stored on a single central server", "It can be easily edited by admins", "It is backed by physical gold"] },
    { q: "What are 'Gas Fees' in a blockchain network?", correct: "Costs to compensate validators for computing power", incorrect: ["Taxes paid to the government", "Monthly subscription costs for wallets", "Penalties for typing the wrong password"] },
    { q: "What is a CBDC?", correct: "Central Bank Digital Currency", incorrect: ["Crypto-Backed Data Contract", "Centralized Blockchain Decentralized Coin", "Corporate Bank Derivative Crypto"] },
    { q: "How does blockchain improve supply chain finance?", correct: "By providing transparent, real-time tracking of assets", incorrect: ["By making shipping boats move faster", "By eliminating all international taxes", "By replacing factory workers with AI"] },
    { q: "What cryptographic process links a new block to the previous block?", correct: "Hashing", incorrect: ["Zipping", "Encrypting", "Compiling"] },
    { q: "What is a 'DAO'?", correct: "Decentralized Autonomous Organization", incorrect: ["Digital Asset Offering", "Data Algorithm Output", "Distributed Account Operator"] },
    { q: "What problem do 'Stablecoins' attempt to solve?", correct: "High price volatility in cryptocurrencies", incorrect: ["The slow speed of the internet", "The lack of physical bank branches", "The high cost of mining hardware"] },
    { q: "What is the role of an 'Oracle' in smart contracts?", correct: "To feed real-world off-chain data to the blockchain", incorrect: ["To predict the future price of Bitcoin", "To encrypt the user's password", "To delete old contracts"] },
    { q: "In DeFi, what is a 'Liquidity Pool'?", correct: "Locked funds in a smart contract used to facilitate trading", incorrect: ["A backup server for offline transactions", "A physical bank vault holding cash", "A group of investors pooling money to buy stocks"] },
    { q: "What is a '51% Attack'?", correct: "When a single entity gains majority control of the network's computing power", incorrect: ["When 51% of users forget their passwords", "When fees increase by 51%", "When the government buys 51% of all crypto"] },
    { q: "What is 'Yield Farming'?", correct: "Earning interest by lending or staking crypto assets", incorrect: ["Growing virtual crops in the metaverse", "Mining Bitcoin with solar power", "Buying crypto low and selling high"] },
    { q: "What does 'KYC' stand for in financial compliance?", correct: "Know Your Customer", incorrect: ["Keep Your Crypto", "Key Yield Calculation", "Kinetic Yield Contract"] },
    { q: "What is a 'Layer 2' solution?", correct: "A secondary framework built on top of a blockchain to improve scaling", incorrect: ["A backup blockchain used if the main one crashes", "A stricter security protocol for banks", "A new type of physical hardware wallet"] },
    { q: "If you lose your 'Private Key', what happens?", correct: "You permanently lose access to your crypto assets", incorrect: ["You can reset it via email", "The bank sends you a new one", "You have to pay a small fine to recover it"] },
    { q: "What is an 'AMM' in decentralized exchanges?", correct: "Automated Market Maker", incorrect: ["Asset Management Module", "Algorithm Mining Machine", "Active Money Multiplier"] },
    { q: "What is the 'Genesis Block'?", correct: "The very first block ever recorded on a blockchain network", incorrect: ["A block that contains illegal transactions", "The block that creates new wallets", "A block reserved for developers"] },
    { q: "What is 'Slashing' in a Proof of Stake network?", correct: "A penalty where a validator loses tokens for acting maliciously", incorrect: ["Cutting transaction fees in half", "Hacking into a smart contract", "Dividing a token into smaller decimals"] },
    { q: "Fiat-collateralized stablecoins are backed by what?", correct: "Traditional currencies like the US Dollar", incorrect: ["Other cryptocurrencies", "Complex math algorithms", "Nothing"] },
    { q: "What is the main purpose of a 'Nonce' in mining?", correct: "A random number used once to solve the cryptographic puzzle", incorrect: ["A slang term for a new cryptocurrency", "The fee paid to execute a contract", "The signature of the block creator"] },
    { q: "Which type of blockchain restricts who can participate and view the ledger?", correct: "Private / Permissioned Blockchain", incorrect: ["Public Blockchain", "Open-Source Blockchain", "Decentralized Blockchain"] },
    { q: "What is 'Tokenomics'?", correct: "The study of the economics and incentives of a specific crypto token", incorrect: ["The physical manufacturing of digital coins", "A software program that trades automatically", "The legal taxation of digital assets"] },
    { q: "What is 'Sharding' in blockchain architecture?", correct: "Splitting the network into smaller partitions to improve scalability", incorrect: ["Destroying old blocks to save space", "Encrypting passwords with a glass algorithm", "Combining two blockchains into one"] },
    { q: "What does 'TVL' stand for in decentralized finance?", correct: "Total Value Locked", incorrect: ["Token Verification Ledger", "Transaction Volume Limit", "Temporary Vault Loan"] },
    { q: "What is the main characteristic of an 'NFT'?", correct: "It represents a unique, non-interchangeable digital asset", incorrect: ["It is pegged to the US Dollar", "It is used exclusively to pay gas fees", "It can only be bought with physical cash"] },
    { q: "What is a 'Rug Pull'?", correct: "A scam where developers abandon a project and steal investors' funds", incorrect: ["A sudden crash in the stock market", "A feature that reverses accidental transactions", "A physical hardware wallet malfunction"] },
    { q: "What does 'DApp' stand for?", correct: "Decentralized Application", incorrect: ["Digital Asset Processing Protocol", "Data Allocation Program", "Distributed Accounting Process"] },
    { q: "What is the 'Byzantine Generals Problem'?", correct: "A game theory problem detailing the difficulty of decentralized consensus", incorrect: ["A historical military tactic used to physically steal gold", "A bug in the original Bitcoin code", "The formula used to calculate gas fees"] },
    { q: "In tokenomics, what is 'Vesting'?", correct: "Locking tokens for a set period before they can be sold", incorrect: ["Wearing a hardware wallet on a lanyard", "Burning tokens to increase their value", "Trading tokens between different networks"] },
    { q: "What is the purpose of a 'Blockchain Bridge'?", correct: "To transfer tokens and data between two different blockchains", incorrect: ["To connect a blockchain to a physical bank branch", "To bypass paying any gas fees", "To securely store passwords offline"] },
    { q: "What is 'Impermanent Loss' in DeFi?", correct: "The temporary loss of funds when providing liquidity to an AMM", incorrect: ["Forgetting your wallet password for a few days", "When a stablecoin loses its peg to the dollar", "When a transaction fails and the fee is lost"] },
    { q: "What is an 'Airdrop' in crypto marketing?", correct: "Distributing free tokens to users' wallets to promote a project", incorrect: ["Using Bluetooth to send Bitcoin to a friend", "A sudden, massive drop in a token's price", "When a crypto exchange goes offline"] },
    { q: "What is a 'Governance Token'?", correct: "A token that grants voting rights on project decisions", incorrect: ["A token issued directly by the government", "A token used only to pay taxes", "A token that can never be sold"] },
    { q: "What does 'Cold Storage' mean in cryptocurrency?", correct: "Keeping digital assets offline for security", incorrect: ["Storing servers in a refrigerated warehouse", "Freezing a compromised bank account", "Waiting six months before selling a token"] },
    { q: "What is a 'Mempool'?", correct: "A waiting area for unconfirmed transactions before they are added to a block", incorrect: ["A shared wallet used by multiple people", "A database of all banned users", "The code library used to build smart contracts"] },
    { q: "What is 'Interoperability' in blockchain?", correct: "The ability of different blockchain networks to communicate and share data", incorrect: ["The ability to refund a completed transaction", "When a blockchain can run without the internet", "The process of converting crypto back to fiat cash"] },
    { q: "What is a 'Sybil Attack'?", correct: "One entity creating multiple fake identities to gain network influence", incorrect: ["A physical attack on a server farm", "Guessing a password millions of times per second", "Stealing funds from an unprotected liquidity pool"] },
    { q: "What does 'FUD' stand for in the crypto markets?", correct: "Fear, Uncertainty, and Doubt", incorrect: ["Financial Utility Data", "Fiat Underlying Derivative", "Free Unlocked Deposits"] },

    // --- FUNNY & RANDOM TRIVIA (10 Questions) ---
    { q: "What is the national animal of Scotland?", correct: "The Unicorn", incorrect: ["The Highland Cow", "The Loch Ness Monster", "The Golden Eagle"] },
    { q: "Approximately how much of human DNA is identical to a banana?", correct: "60%", incorrect: ["10%", "99%", "0%"] },
    { q: "What shape is wombat poop?", correct: "Cube-shaped", incorrect: ["Spherical", "Pyramid-shaped", "Flat like a pancake"] },
    { q: "Why are flamingos pink?", correct: "From eating shrimp and algae", incorrect: ["It is their natural genetic feather color", "To attract mates from long distances", "From sunburn in tropical climates"] },
    { q: "How many hearts does an octopus have?", correct: "Three", incorrect: ["One", "Two", "Eight"] },
    { q: "How long did the shortest war in history (Anglo-Zanzibar War) last?", correct: "38 minutes", incorrect: ["3 days", "12 hours", "1 week"] },
    { q: "What do you call a group of crows?", correct: "A murder", incorrect: ["A flock", "A gaggle", "A parliament"] },
    { q: "Which country invented ice cream?", correct: "China", incorrect: ["Italy", "France", "United States"] },
    { q: "What is the fear of long words called?", correct: "Hippopotomonstrosesquippedaliophobia", incorrect: ["Arachnophobia", "Claustrophobia", "Megalophobia"] },
    { q: "How many folds are in a traditional chef's hat (toque)?", correct: "100", incorrect: ["10", "50", "365"] }
];

// Automatically grabs a question, shuffles the answers, and assigns A, B, C, D
function getCustomQuestion() {
    const qData = customDatabase[Math.floor(Math.random() * customDatabase.length)];
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

// ==========================================
// ⚙️ GAME ENGINE LOGIC
// ==========================================

// Automatically redirect the base URL to the phone controller
app.get('/', (req, res) => {
    res.redirect('/client.html');
});

io.on('connection', (socket) => {
  
  socket.on('create', () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString(); 
    rooms[code] = { code, players: [], phase: 'lobby', round: 0, currentQ: null, maxRounds: 5 };
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

  socket.on('startRound', (settings) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        
        if (settings && settings.maxRounds) {
            room.maxRounds = parseInt(settings.maxRounds);
        }

        room.round++;
        room.currentQ = getCustomQuestion();
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
