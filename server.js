const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve files from the public folder
app.use(express.static('public'));

// Store active games
const rooms = {};

// Automatically redirect the base URL to the phone controller
app.get('/', (req, res) => {
    res.redirect('/client.html');
});

// ==========================================
// 🧠 MASSIVE 180-QUESTION DATABASE
// ==========================================
const customDatabase = [
    // --- 🪙 BLOCKCHAIN CATEGORY ---
    { cat: "blockchain", q: "What is the primary benefit of a 'Smart Contract'?", correct: "Automated self-execution", incorrect: ["Live chat", "Physical storage", "Printing money"] },
    { cat: "blockchain", q: "What does 'DeFi' stand for?", correct: "Decentralized Finance", incorrect: ["Digital Exchange Fiat", "Derivative Financial Instrument", "Decrypted File Interface"] },
    { cat: "blockchain", q: "Which consensus mechanism is considered more energy-efficient?", correct: "Proof of Stake (PoS)", incorrect: ["Proof of Work (PoW)", "Proof of Print (PoP)", "Proof of Vault (PoV)"] },
    { cat: "blockchain", q: "In blockchain auditing, what makes the ledger highly secure?", correct: "It is immutable and append-only", incorrect: ["Stored on a single server", "Easily edited by admins", "Backed by physical gold"] },
    { cat: "blockchain", q: "What are 'Gas Fees' in a blockchain network?", correct: "Costs to compensate validators", incorrect: ["Taxes paid to the government", "Monthly subscriptions", "Password penalties"] },
    { cat: "blockchain", q: "What is a CBDC?", correct: "Central Bank Digital Currency", incorrect: ["Crypto-Backed Data Contract", "Centralized Blockchain Coin", "Corporate Bank Crypto"] },
    { cat: "blockchain", q: "How does blockchain improve supply chain finance?", correct: "Real-time tracking of assets", incorrect: ["Making shipping boats faster", "Eliminating international taxes", "Replacing workers with AI"] },
    { cat: "blockchain", q: "What cryptographic process links a new block to the previous block?", correct: "Hashing", incorrect: ["Zipping", "Encrypting", "Compiling"] },
    { cat: "blockchain", q: "What is a 'DAO'?", correct: "Decentralized Autonomous Organization", incorrect: ["Digital Asset Offering", "Data Algorithm Output", "Distributed Account Operator"] },
    { cat: "blockchain", q: "What problem do 'Stablecoins' attempt to solve?", correct: "High price volatility", incorrect: ["Slow internet speeds", "Lack of physical bank branches", "High cost of mining hardware"] },
    { cat: "blockchain", q: "What is the role of an 'Oracle' in smart contracts?", correct: "To feed real-world data to the blockchain", incorrect: ["To predict Bitcoin prices", "To encrypt user passwords", "To delete old contracts"] },
    { cat: "blockchain", q: "In DeFi, what is a 'Liquidity Pool'?", correct: "Locked funds used to facilitate trading", incorrect: ["A backup server", "A physical bank vault", "A group of stock investors"] },
    { cat: "blockchain", q: "What is a '51% Attack'?", correct: "Gaining majority control of network computing power", incorrect: ["51% of users forgetting passwords", "Fees increasing by 51%", "Government buying 51% of crypto"] },
    { cat: "blockchain", q: "What is 'Yield Farming'?", correct: "Earning interest by lending or staking assets", incorrect: ["Growing virtual crops", "Mining with solar power", "Buying low and selling high"] },
    { cat: "blockchain", q: "What does 'KYC' stand for?", correct: "Know Your Customer", incorrect: ["Keep Your Crypto", "Key Yield Calculation", "Kinetic Yield Contract"] },
    { cat: "blockchain", q: "What is a 'Layer 2' solution?", correct: "A framework built on top to improve scaling", incorrect: ["A backup blockchain", "A stricter security protocol", "A physical hardware wallet"] },
    { cat: "blockchain", q: "If you lose your 'Private Key', what happens?", correct: "You permanently lose access to your assets", incorrect: ["Reset it via email", "The bank sends a new one", "Pay a fine to recover it"] },
    { cat: "blockchain", q: "What is an 'AMM'?", correct: "Automated Market Maker", incorrect: ["Asset Management Module", "Algorithm Mining Machine", "Active Money Multiplier"] },
    { cat: "blockchain", q: "What is the 'Genesis Block'?", correct: "The first block ever recorded on a network", incorrect: ["A block with illegal transactions", "Block that creates new wallets", "Block reserved for developers"] },
    { cat: "blockchain", q: "What is 'Slashing' in PoS?", correct: "A penalty where a validator loses tokens", incorrect: ["Cutting transaction fees", "Hacking a smart contract", "Dividing a token"] },
    { cat: "blockchain", q: "Fiat-collateralized stablecoins are backed by what?", correct: "Traditional currencies", incorrect: ["Other cryptocurrencies", "Complex math algorithms", "Nothing"] },
    { cat: "blockchain", q: "What is the main purpose of a 'Nonce'?", correct: "A random number used once to solve a puzzle", incorrect: ["Slang for a new crypto", "Fee paid to execute a contract", "Signature of the block creator"] },
    { cat: "blockchain", q: "Which blockchain restricts who can participate?", correct: "Private / Permissioned Blockchain", incorrect: ["Public Blockchain", "Open-Source Blockchain", "Decentralized Blockchain"] },
    { cat: "blockchain", q: "What is 'Tokenomics'?", correct: "The study of the economics of a crypto token", incorrect: ["Manufacturing of digital coins", "Software that trades automatically", "Legal taxation of assets"] },
    { cat: "blockchain", q: "What is 'Sharding'?", correct: "Splitting the network to improve scalability", incorrect: ["Destroying old blocks", "Encrypting passwords", "Combining two blockchains"] },
    { cat: "blockchain", q: "What does 'TVL' stand for?", correct: "Total Value Locked", incorrect: ["Token Verification Ledger", "Transaction Volume Limit", "Temporary Vault Loan"] },
    { cat: "blockchain", q: "What is the main characteristic of an 'NFT'?", correct: "It represents a unique digital asset", incorrect: ["Pegged to the US Dollar", "Used exclusively for gas fees", "Bought with physical cash"] },
    { cat: "blockchain", q: "What is a 'Rug Pull'?", correct: "A scam where developers abandon a project", incorrect: ["A stock market crash", "Reversing a transaction", "Hardware malfunction"] },
    { cat: "blockchain", q: "What does 'DApp' stand for?", correct: "Decentralized Application", incorrect: ["Digital Asset Processing", "Data Allocation Program", "Distributed Accounting Process"] },
    { cat: "blockchain", q: "What is the 'Byzantine Generals Problem'?", correct: "A problem detailing decentralized consensus", incorrect: ["A military tactic to steal gold", "A bug in the original Bitcoin", "Formula for gas fees"] },
    { cat: "blockchain", q: "In tokenomics, what is 'Vesting'?", correct: "Locking tokens for a set period", incorrect: ["Wearing a hardware wallet", "Burning tokens", "Trading between networks"] },
    { cat: "blockchain", q: "What is the purpose of a 'Blockchain Bridge'?", correct: "Transferring tokens between different blockchains", incorrect: ["Connecting to a bank branch", "Bypassing gas fees", "Storing passwords offline"] },
    { cat: "blockchain", q: "What is 'Impermanent Loss'?", correct: "Temporary loss when providing liquidity", incorrect: ["Forgetting a password", "Stablecoin losing its peg", "Transaction failing"] },
    { cat: "blockchain", q: "What is an 'Airdrop'?", correct: "Distributing free tokens to users", incorrect: ["Bluetooth sending Bitcoin", "Massive drop in price", "Exchange going offline"] },
    { cat: "blockchain", q: "What is a 'Governance Token'?", correct: "A token granting voting rights", incorrect: ["Token issued by the government", "Token used to pay taxes", "Token that can never be sold"] },
    { cat: "blockchain", q: "What does 'Cold Storage' mean?", correct: "Keeping digital assets offline", incorrect: ["Storing servers in a fridge", "Freezing a bank account", "Waiting before selling"] },
    { cat: "blockchain", q: "What is a 'Mempool'?", correct: "A waiting area for unconfirmed transactions", incorrect: ["A shared wallet", "A database of banned users", "Code library for contracts"] },
    { cat: "blockchain", q: "What is 'Interoperability'?", correct: "Different blockchains communicating", incorrect: ["Refunding a transaction", "Running without the internet", "Converting crypto to fiat"] },
    { cat: "blockchain", q: "What is a 'Sybil Attack'?", correct: "One entity creating multiple fake identities", incorrect: ["Physical attack on a server", "Guessing a password rapidly", "Stealing from a liquidity pool"] },
    { cat: "blockchain", q: "What does 'FUD' stand for?", correct: "Fear, Uncertainty, and Doubt", incorrect: ["Financial Utility Data", "Fiat Underlying Derivative", "Free Unlocked Deposits"] },
    { cat: "blockchain", q: "What is 'Hashing'?", correct: "Converting data into a fixed-size string", incorrect: ["Mining Bitcoin", "Deleting old wallets", "Reversing a transaction"] },
    { cat: "blockchain", q: "What is the smallest unit of Bitcoin called?", correct: "Satoshi", incorrect: ["Bit", "Gwei", "Wei"] },
    // -- Blockchain: Fun Trivia Buffer --
    { cat: "blockchain", q: "What is the fear of long words called?", correct: "Hippopotomonstrosesquippedaliophobia", incorrect: ["Arachnophobia", "Claustrophobia", "Megalophobia"] },
    { cat: "blockchain", q: "How many folds are in a traditional chef's hat?", correct: "100", incorrect: ["10", "50", "365"] },
    { cat: "blockchain", q: "What do you call a group of crows?", correct: "A murder", incorrect: ["A flock", "A gaggle", "A parliament"] },
    { cat: "blockchain", q: "Which country invented ice cream?", correct: "China", incorrect: ["Italy", "France", "USA"] },
    { cat: "blockchain", q: "What is the national animal of Scotland?", correct: "The Unicorn", incorrect: ["The Highland Cow", "The Loch Ness Monster", "The Golden Eagle"] },
    { cat: "blockchain", q: "What shape is wombat poop?", correct: "Cube-shaped", incorrect: ["Spherical", "Pyramid-shaped", "Flat"] },
    { cat: "blockchain", q: "Why are flamingos pink?", correct: "From eating shrimp and algae", incorrect: ["Genetics", "To attract mates", "Sunburn"] },
    { cat: "blockchain", q: "How many hearts does an octopus have?", correct: "Three", incorrect: ["One", "Two", "Eight"] },
    { cat: "blockchain", q: "How long was the shortest war in history?", correct: "38 minutes", incorrect: ["3 days", "12 hours", "1 week"] },
    { cat: "blockchain", q: "Which electric car company is led by Elon Musk?", correct: "Tesla", incorrect: ["Rivian", "Lucid", "Ford"] },
    { cat: "blockchain", q: "What is the hardest natural substance on Earth?", correct: "Diamond", incorrect: ["Gold", "Iron", "Quartz"] },
    { cat: "blockchain", q: "What is the rarest blood type?", correct: "AB Negative", incorrect: ["O Positive", "B Negative", "A Positive"] },
    { cat: "blockchain", q: "What is the capital of Australia?", correct: "Canberra", incorrect: ["Sydney", "Melbourne", "Brisbane"] },
    { cat: "blockchain", q: "What is the tallest mountain in the world?", correct: "Mount Everest", incorrect: ["K2", "Mount Kilimanjaro", "Mount Fuji"] },
    { cat: "blockchain", q: "Which planet is known as the Red Planet?", correct: "Mars", incorrect: ["Venus", "Jupiter", "Saturn"] },
    { cat: "blockchain", q: "Who painted the Mona Lisa?", correct: "Leonardo da Vinci", incorrect: ["Vincent van Gogh", "Pablo Picasso", "Claude Monet"] },
    { cat: "blockchain", q: "What is the largest ocean on Earth?", correct: "Pacific Ocean", incorrect: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
    { cat: "blockchain", q: "What is the chemical symbol for Gold?", correct: "Au", incorrect: ["Ag", "Go", "Gd"] },

    // --- 🎮 GAMING CATEGORY ---
    { cat: "gaming", q: "In Counter-Strike 2, which sniper rifle is famous for its one-shot kill to the body?", correct: "AWP", incorrect: ["Scout", "G3SG1", "SCAR-20"] },
    { cat: "gaming", q: "Which assault rifle in CS2 is exclusive to the Terrorist side and kills with one headshot?", correct: "AK-47", incorrect: ["M4A4", "AUG", "FAMAS"] },
    { cat: "gaming", q: "Which map in Counter-Strike features 'Bombsite A' and 'Bombsite B' in a desert setting?", correct: "Dust II", incorrect: ["Mirage", "Inferno", "Nuke"] },
    { cat: "gaming", q: "In the Warhammer 40,000 universe, who is the ruler of the Imperium of Man?", correct: "The God-Emperor", incorrect: ["Roboute Guilliman", "Horus Lupercal", "Malcador"] },
    { cat: "gaming", q: "Which Space Marine Legion specializes in stealth and guerrilla warfare?", correct: "Raven Guard", incorrect: ["Ultramarines", "World Eaters", "Imperial Fists"] },
    { cat: "gaming", q: "The Black Templars are a successor chapter of which original Space Marine Legion?", correct: "Imperial Fists", incorrect: ["Blood Angels", "Dark Angels", "Space Wolves"] },
    { cat: "gaming", q: "What software is an industry standard for creating digital art and YouTube thumbnails?", correct: "Adobe Photoshop", incorrect: ["Microsoft Word", "Audacity", "DaVinci Resolve"] },
    { cat: "gaming", q: "What aesthetic style features neon purples, grid lines, and 80s retro vibes?", correct: "Synthwave", incorrect: ["Steampunk", "Cyberpunk", "Gothic"] },
    { cat: "gaming", q: "Which software is widely used for professional video editing and color grading?", correct: "DaVinci Resolve", incorrect: ["Clipchamp", "Paint", "EViews"] },
    { cat: "gaming", q: "What is the best-selling video game console of all time?", correct: "PlayStation 2", incorrect: ["Nintendo DS", "Xbox 360", "Nintendo Switch"] },
    { cat: "gaming", q: "In Minecraft, what material is required to build a Nether Portal?", correct: "Obsidian", incorrect: ["Diamond", "Bedrock", "Cobblestone"] },
    { cat: "gaming", q: "What is the name of the main protagonist in the Halo series?", correct: "Master Chief", incorrect: ["Doomguy", "Commander Shepard", "Marcus Fenix"] },
    { cat: "gaming", q: "Which company created the game 'Counter-Strike'?", correct: "Valve", incorrect: ["Riot Games", "Blizzard", "Epic Games"] },
    { cat: "gaming", q: "What is the highest selling video game of all time?", correct: "Minecraft", incorrect: ["Tetris", "GTA V", "Wii Sports"] },
    { cat: "gaming", q: "What is the name of the princess you must save in 'The Legend of Zelda'?", correct: "Zelda", incorrect: ["Peach", "Daisy", "Rosalina"] },
    { cat: "gaming", q: "Which studio developed 'Grand Theft Auto V'?", correct: "Rockstar Games", incorrect: ["Ubisoft", "EA", "Bethesda"] },
    { cat: "gaming", q: "What is the max level a player can reach in vanilla World of Warcraft (2004)?", correct: "60", incorrect: ["50", "70", "100"] },
    { cat: "gaming", q: "In Super Mario Bros, what item makes Mario grow larger?", correct: "Super Mushroom", incorrect: ["Fire Flower", "Starman", "1-Up Mushroom"] },
    { cat: "gaming", q: "Which game popularized the 'Battle Royale' genre before Fortnite?", correct: "PUBG", incorrect: ["Apex Legends", "Call of Duty", "Overwatch"] },
    { cat: "gaming", q: "Who is the iconic villain in the Final Fantasy VII game?", correct: "Sephiroth", incorrect: ["Kefka", "Bowser", "Ganondorf"] },
    { cat: "gaming", q: "What is the main currency used in the Fallout universe?", correct: "Bottle Caps", incorrect: ["Gold Coins", "Credits", "Dollars"] },
    { cat: "gaming", q: "Which video game features the phrase 'The cake is a lie'?", correct: "Portal", incorrect: ["Half-Life", "Left 4 Dead", "Team Fortress 2"] },
    { cat: "gaming", q: "What is the name of the protagonist in The Witcher series?", correct: "Geralt of Rivia", incorrect: ["Vesemir", "Dandelion", "Eskel"] },
    { cat: "gaming", q: "In which game do you play as a space bounty hunter named Samus Aran?", correct: "Metroid", incorrect: ["Mass Effect", "Destiny", "Starcraft"] },
    { cat: "gaming", q: "Which game engine is developed by Epic Games?", correct: "Unreal Engine", incorrect: ["Unity", "Source", "CryEngine"] },
    { cat: "gaming", q: "What color is Pac-Man?", correct: "Yellow", incorrect: ["Orange", "Red", "Green"] },
    { cat: "gaming", q: "What is the name of Sonic the Hedgehog's sidekick?", correct: "Tails", incorrect: ["Knuckles", "Shadow", "Amy"] },
    { cat: "gaming", q: "In League of Legends, what is the central lane called?", correct: "Mid Lane", incorrect: ["Top Lane", "Bottom Lane", "Jungle"] },
    { cat: "gaming", q: "Which game involves capturing creatures in 'Poké Balls'?", correct: "Pokémon", incorrect: ["Digimon", "Monster Hunter", "Ark"] },
    { cat: "gaming", q: "What does 'NPC' stand for in gaming?", correct: "Non-Playable Character", incorrect: ["New Player Class", "No Player Control", "Network Ping Code"] },
    { cat: "gaming", q: "What is the primary objective in 'Rocket League'?", correct: "Score goals with a car", incorrect: ["Race to the finish line", "Destroy other cars", "Collect rings"] },
    { cat: "gaming", q: "Which game features a blocky world where you survive against creepers?", correct: "Minecraft", incorrect: ["Terraria", "Roblox", "Rust"] },
    { cat: "gaming", q: "Who is the creator of the Metal Gear series?", correct: "Hideo Kojima", incorrect: ["Shigeru Miyamoto", "Gabe Newell", "Todd Howard"] },
    { cat: "gaming", q: "What is the name of the fictional city in Bioshock built underwater?", correct: "Rapture", incorrect: ["Columbia", "Atlantis", "Gomorrah"] },
    { cat: "gaming", q: "Which game console introduced the 'DualShock' controller?", correct: "PlayStation", incorrect: ["Nintendo 64", "Xbox", "Sega Genesis"] },
    { cat: "gaming", q: "What does 'RPG' stand for?", correct: "Role-Playing Game", incorrect: ["Real-time Playing Game", "Retro Puzzle Game", "Random Player Generator"] },
    { cat: "gaming", q: "In Skyrim, what is the language of the dragons called?", correct: "Dovahzul", incorrect: ["Elvish", "Orcish", "Daedric"] },
    { cat: "gaming", q: "What is the highest tier of loot rarity in most modern games?", correct: "Legendary/Mythic", incorrect: ["Rare", "Uncommon", "Epic"] },
    { cat: "gaming", q: "What is the max squad size in standard Apex Legends?", correct: "3", incorrect: ["2", "4", "5"] },
    { cat: "gaming", q: "Which game involves an imposter trying to eliminate crewmates?", correct: "Among Us", incorrect: ["Fall Guys", "Rust", "DayZ"] },
    { cat: "gaming", q: "What is the name of the main character in the Tomb Raider series?", correct: "Lara Croft", incorrect: ["Jill Valentine", "Aloy", "Cortana"] },
    { cat: "gaming", q: "Which game features characters called 'Sims'?", correct: "The Sims", incorrect: ["Animal Crossing", "Stardew Valley", "Second Life"] },
    { cat: "gaming", q: "What is the name of the heavy weapons guy in Team Fortress 2?", correct: "Heavy", incorrect: ["Soldier", "Demoman", "Tank"] },
    { cat: "gaming", q: "In CS2, what is the maximum competitive match round limit in regulation?", correct: "24 (MR12)", incorrect: ["30 (MR15)", "16 (MR8)", "20 (MR10)"] },
    { cat: "gaming", q: "What year was the original PlayStation released in Japan?", correct: "1994", incorrect: ["1996", "1998", "1992"] },
    { cat: "gaming", q: "Which company developed the Xbox?", correct: "Microsoft", incorrect: ["Sony", "Nintendo", "Sega"] },
    { cat: "gaming", q: "What is the name of Mario's dinosaur companion?", correct: "Yoshi", incorrect: ["Birdo", "Toad", "Bowser"] },
    { cat: "gaming", q: "In Overwatch, who says 'It's high noon'?", correct: "Cassidy (McCree)", incorrect: ["Reaper", "Soldier 76", "Hanzo"] },
    { cat: "gaming", q: "Which fighting game franchise features 'Fatalities'?", correct: "Mortal Kombat", incorrect: ["Street Fighter", "Tekken", "Super Smash Bros"] },
    { cat: "gaming", q: "What is the primary material used to craft a pickaxe in early Minecraft?", correct: "Wood", incorrect: ["Iron", "Stone", "Gold"] },
    { cat: "gaming", q: "Which studio created the Dark Souls series?", correct: "FromSoftware", incorrect: ["Bethesda", "Bioware", "Naughty Dog"] },
    { cat: "gaming", q: "What does 'FPS' stand for regarding gameplay mechanics?", correct: "First-Person Shooter", incorrect: ["Frames Per Second", "First-Person Strategy", "Fast-Paced Shooter"] },
    { cat: "gaming", q: "What is the name of the main city in Cyberpunk 2077?", correct: "Night City", incorrect: ["Neon City", "New Angeles", "Metro City"] },
    { cat: "gaming", q: "In Tetris, how many blocks make up a 'Tetromino'?", correct: "4", incorrect: ["3", "5", "6"] },
    { cat: "gaming", q: "Which classic game involves eating dots in a maze?", correct: "Pac-Man", incorrect: ["Space Invaders", "Frogger", "Centipede"] },
    { cat: "gaming", q: "What is the name of the main character in God of War?", correct: "Kratos", incorrect: ["Zeus", "Ares", "Thor"] },
    { cat: "gaming", q: "In Red Dead Redemption 2, who is the main protagonist?", correct: "Arthur Morgan", incorrect: ["John Marston", "Dutch van der Linde", "Micah Bell"] },
    { cat: "gaming", q: "Which game features a battle bus?", correct: "Fortnite", incorrect: ["PUBG", "Warzone", "Apex Legends"] },
    { cat: "gaming", q: "What does 'GG' mean in gaming chat?", correct: "Good Game", incorrect: ["Get Good", "Great Going", "Go Go"] },
    { cat: "gaming", q: "In Super Smash Bros. Melee, which character is notoriously top-tier?", correct: "Fox", incorrect: ["Kirby", "Pichu", "Bowser"] },

    // --- 🎪 FUN TRIVIA CATEGORY ---
    { cat: "trivia", q: "Which district in Taichung is home to Asia University?", correct: "Wufeng District", incorrect: ["Xitun District", "Beitun District", "Nantun District"] },
    { cat: "trivia", q: "What is the Mandarin Chinese word for 'Hello'?", correct: "Nǐ hǎo", incorrect: ["Xièxiè", "Zàijiàn", "Bùkèqì"] },
    { cat: "trivia", q: "Which famous drink was invented in Taichung, Taiwan?", correct: "Boba / Pearl Milk Tea", incorrect: ["Matcha Latte", "Kombucha", "Oolong Tea"] },
    { cat: "trivia", q: "What is the largest organ of the human body?", correct: "The Skin", incorrect: ["The Liver", "The Brain", "The Lungs"] },
    { cat: "trivia", q: "What is the speed of light?", correct: "299,792 km/s", incorrect: ["150,000 km/s", "1,000,000 km/s", "343 m/s"] },
    { cat: "trivia", q: "Which planet is the hottest in our solar system?", correct: "Venus", incorrect: ["Mercury", "Mars", "Jupiter"] },
    { cat: "trivia", q: "What is the smallest country in the world?", correct: "Vatican City", incorrect: ["Monaco", "San Marino", "Liechtenstein"] },
    { cat: "trivia", q: "Who wrote the play 'Romeo and Juliet'?", correct: "William Shakespeare", incorrect: ["Charles Dickens", "Jane Austen", "Mark Twain"] },
    { cat: "trivia", q: "What is the longest river in the world?", correct: "The Nile River", incorrect: ["The Amazon River", "The Yangtze River", "The Mississippi River"] },
    { cat: "trivia", q: "In what year did the Titanic sink?", correct: "1912", incorrect: ["1905", "1915", "1920"] },
    { cat: "trivia", q: "What is the chemical symbol for Water?", correct: "H2O", incorrect: ["CO2", "O2", "HO"] },
    { cat: "trivia", q: "Which element has the atomic number 1?", correct: "Hydrogen", incorrect: ["Oxygen", "Carbon", "Helium"] },
    { cat: "trivia", q: "Who painted the Sistine Chapel ceiling?", correct: "Michelangelo", incorrect: ["Leonardo da Vinci", "Raphael", "Donatello"] },
    { cat: "trivia", q: "What is the capital of Japan?", correct: "Tokyo", incorrect: ["Kyoto", "Osaka", "Seoul"] },
    { cat: "trivia", q: "Which ocean is the deepest?", correct: "Pacific Ocean", incorrect: ["Atlantic Ocean", "Indian Ocean", "Southern Ocean"] },
    { cat: "trivia", q: "What is the largest mammal on Earth?", correct: "Antarctic Blue Whale", incorrect: ["African Elephant", "Giraffe", "Great White Shark"] },
    { cat: "trivia", q: "Who discovered Penicillin?", correct: "Alexander Fleming", incorrect: ["Marie Curie", "Louis Pasteur", "Isaac Newton"] },
    { cat: "trivia", q: "What is the main ingredient in guacamole?", correct: "Avocado", incorrect: ["Tomato", "Onion", "Lime"] },
    { cat: "trivia", q: "Which country is home to the kangaroo?", correct: "Australia", incorrect: ["South Africa", "New Zealand", "Brazil"] },
    { cat: "trivia", q: "What is the capital of France?", correct: "Paris", incorrect: ["Rome", "Berlin", "Madrid"] },
    { cat: "trivia", q: "Who developed the theory of relativity?", correct: "Albert Einstein", incorrect: ["Isaac Newton", "Nikola Tesla", "Galileo Galilei"] },
    { cat: "trivia", q: "What is the largest desert in the world?", correct: "Antarctic Desert", incorrect: ["Sahara Desert", "Gobi Desert", "Arabian Desert"] },
    { cat: "trivia", q: "Which metal is liquid at room temperature?", correct: "Mercury", incorrect: ["Iron", "Lead", "Silver"] },
    { cat: "trivia", q: "What is the currency of the United Kingdom?", correct: "Pound Sterling", incorrect: ["Euro", "Dollar", "Franc"] },
    { cat: "trivia", q: "Who is known as the 'Father of Computers'?", correct: "Charles Babbage", incorrect: ["Alan Turing", "Bill Gates", "Steve Jobs"] },
    { cat: "trivia", q: "What is the most spoken language in the world natively?", correct: "Mandarin Chinese", incorrect: ["English", "Spanish", "Hindi"] },
    { cat: "trivia", q: "Which gas makes up the majority of Earth's atmosphere?", correct: "Nitrogen", incorrect: ["Oxygen", "Carbon Dioxide", "Hydrogen"] },
    { cat: "trivia", q: "What is the capital of Canada?", correct: "Ottawa", incorrect: ["Toronto", "Vancouver", "Montreal"] },
    { cat: "trivia", q: "Who was the first person to walk on the moon?", correct: "Neil Armstrong", incorrect: ["Buzz Aldrin", "Yuri Gagarin", "John Glenn"] },
    { cat: "trivia", q: "What is the hardest rock?", correct: "Diamond", incorrect: ["Granite", "Marble", "Obsidian"] },
    { cat: "trivia", q: "Which organ pumps blood through the human body?", correct: "Heart", incorrect: ["Lungs", "Brain", "Kidneys"] },
    { cat: "trivia", q: "What is the freezing point of water in Celsius?", correct: "0", incorrect: ["32", "100", "-10"] },
    { cat: "trivia", q: "What is the largest bone in the human body?", correct: "Femur", incorrect: ["Tibia", "Fibula", "Humerus"] },
    { cat: "trivia", q: "Which artist is famous for cutting off his own ear?", correct: "Vincent van Gogh", incorrect: ["Pablo Picasso", "Claude Monet", "Salvador Dali"] },
    { cat: "trivia", q: "What is the capital of Italy?", correct: "Rome", incorrect: ["Venice", "Florence", "Milan"] },
    { cat: "trivia", q: "How many continents are there?", correct: "7", incorrect: ["5", "6", "8"] },
    { cat: "trivia", q: "Which planet has the most rings?", correct: "Saturn", incorrect: ["Jupiter", "Uranus", "Neptune"] },
    { cat: "trivia", q: "What is the primary language spoken in Brazil?", correct: "Portuguese", incorrect: ["Spanish", "English", "French"] },
    { cat: "trivia", q: "What is the longest bone in the human body?", correct: "Femur", incorrect: ["Tibia", "Humerus", "Radius"] },
    { cat: "trivia", q: "Which animal is known as the King of the Jungle?", correct: "Lion", incorrect: ["Tiger", "Elephant", "Gorilla"] },
    { cat: "trivia", q: "What is the largest country by land area?", correct: "Russia", incorrect: ["Canada", "China", "United States"] },
    { cat: "trivia", q: "Who painted the Last Supper?", correct: "Leonardo da Vinci", incorrect: ["Michelangelo", "Raphael", "Donatello"] },
    { cat: "trivia", q: "What is the chemical symbol for Silver?", correct: "Ag", incorrect: ["Au", "Si", "Sv"] },
    { cat: "trivia", q: "Which desert covers much of Northern Africa?", correct: "Sahara Desert", incorrect: ["Kalahari Desert", "Gobi Desert", "Mojave Desert"] },
    { cat: "trivia", q: "What is the boiling point of water in Celsius?", correct: "100", incorrect: ["0", "50", "212"] },
    { cat: "trivia", q: "Which inventor is credited with developing the light bulb?", correct: "Thomas Edison", incorrect: ["Nikola Tesla", "Alexander Graham Bell", "Albert Einstein"] },
    { cat: "trivia", q: "What is the capital of Spain?", correct: "Madrid", incorrect: ["Barcelona", "Seville", "Valencia"] },
    { cat: "trivia", q: "Which continent is known as the 'Dark Continent'?", correct: "Africa", incorrect: ["Asia", "South America", "Antarctica"] },
    { cat: "trivia", q: "What is the square root of 64?", correct: "8", incorrect: ["6", "7", "9"] },
    { cat: "trivia", q: "Which gas is responsible for the greenhouse effect?", correct: "Carbon Dioxide", incorrect: ["Oxygen", "Nitrogen", "Argon"] },
    { cat: "trivia", q: "What is the capital of Germany?", correct: "Berlin", incorrect: ["Munich", "Frankfurt", "Hamburg"] },
    { cat: "trivia", q: "Who wrote 'Hamlet'?", correct: "William Shakespeare", incorrect: ["Charles Dickens", "Jane Austen", "Mark Twain"] },
    { cat: "trivia", q: "Which element has the chemical symbol 'O'?", correct: "Oxygen", incorrect: ["Gold", "Osmium", "Oganesson"] },
    { cat: "trivia", q: "What is the highest mountain in North America?", correct: "Denali", incorrect: ["Mount Logan", "Mount Whitney", "Mount Elbert"] },
    { cat: "trivia", q: "Which animal is the fastest land animal?", correct: "Cheetah", incorrect: ["Lion", "Leopard", "Gazelle"] },
    { cat: "trivia", q: "What is the capital of Russia?", correct: "Moscow", incorrect: ["Saint Petersburg", "Novosibirsk", "Yekaterinburg"] },
    { cat: "trivia", q: "Which famous scientist introduced the idea of natural selection?", correct: "Charles Darwin", incorrect: ["Isaac Newton", "Albert Einstein", "Gregor Mendel"] },
    { cat: "trivia", q: "What is the chemical symbol for Iron?", correct: "Fe", incorrect: ["Ir", "In", "I"] },
    { cat: "trivia", q: "Which ocean is located to the east of the United States?", correct: "Atlantic Ocean", incorrect: ["Pacific Ocean", "Indian Ocean", "Arctic Ocean"] },
    { cat: "trivia", q: "What is the currency of Japan?", correct: "Yen", incorrect: ["Won", "Yuan", "Ringgit"] }
];

// Helper function to grab a random question and shuffle the answers
function getCustomQuestion(category) {
    let pool = customDatabase;
    if (category !== "mixed") {
        pool = customDatabase.filter(q => q.cat === category);
        if(pool.length === 0) pool = customDatabase; 
    }

    const qData = pool[Math.floor(Math.random() * pool.length)];
    const allOptions = [qData.correct, ...qData.incorrect];
    
    // Shuffle the answers
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
// ⚙️ GAME ENGINE LOGIC & SOCKET.IO
// ==========================================

io.on('connection', (socket) => {
  
  // 1. Host creates a room
  socket.on('create', () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString(); 
    rooms[code] = { code, hostSocketId: socket.id, players: [], phase: 'lobby', round: 0, currentQ: null, maxRounds: 5, category: 'mixed' };
    socket.join(code);
    socket.emit('created', { code });
    io.to(code).emit('state', rooms[code]);
  });

  // 2. Host reloads page and reconnects to room
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

  // 3. Host manually destroys room
  socket.on('close_room', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        io.to(roomCode).emit('kicked'); 
        delete rooms[roomCode]; 
        socket.emit('err', 'ROOM_EXPIRED'); 
    }
  });

  // 4. Player joins room (handles refresh takeover too)
  socket.on('join', ({ code, name }) => {
    const room = rooms[code];
    if (!room) return socket.emit('err', 'Invalid Room Code');

    const existingPlayer = room.players.find(p => p.name === name);

    // If game started, only allow reconnects, block new players
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

    // Add brand new player with powerups and stats trackers
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

  // 5. Host kicks a player
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

  // 6. Player uses 50/50 Powerup
  socket.on('use_5050', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        const player = room.players.find(p => p.id === socket.id);
        if(player && player.powerups.fifty > 0 && room.phase === 'betting') {
            player.powerups.fifty -= 1; // deduct powerup
            const correctAns = room.currentQ.ans;
            const wrongOptions = ['A','B','C','D'].filter(l => l !== correctAns);
            wrongOptions.sort(() => Math.random() - 0.5);
            const toHide = [wrongOptions[0], wrongOptions[1]];
            socket.emit('5050_result', toHide); // Send hidden letters back to phone
            io.to(roomCode).emit('state', room); 
        }
    }
  });

  // 7. Player uses Peek Powerup
  socket.on('use_peek', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        const player = room.players.find(p => p.id === socket.id);
        if(player && player.powerups.peek > 0 && room.phase === 'betting') {
            player.powerups.peek -= 1; // deduct powerup
            const topPlayers = [...room.players]
                .filter(p => p.id !== socket.id)
                .sort((a,b) => b.balance - a.balance)
                .slice(0, 3);
            
            const peekData = topPlayers.map(p => {
                return { name: p.name, bet: p.bet ? p.bet.option : "Thinking..." };
            });

            socket.emit('peek_result', peekData); // Send top 3 info back to phone
            io.to(roomCode).emit('state', room);
        }
    }
  });

  // 8. Player places bet
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

  // 9. Host starts the round
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

  // 10. Host reveals answer and pays winners
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

  // 11. Trigger Podium
  socket.on('endGame', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        rooms[roomCode].phase = 'game_over';
        io.to(roomCode).emit('state', rooms[roomCode]);
    }
  });

  // 12. Play again (reset room data)
  socket.on('resetGame', () => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if(roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        room.phase = 'lobby';
        room.round = 0;
        room.players.forEach(p => { 
            p.balance = 1000; p.bet = null; p.lastResult = null; 
            p.eliminatedAt = null; p.totalBet = 0; p.totalWon = 0; 
            p.powerups = { fifty: 1, peek: 1 }; 
        });
        io.to(roomCode).emit('state', room);
    }
  });
});

// Start listening for internet traffic!
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎰 Casino Server is live and running on port ${PORT}`);
});
