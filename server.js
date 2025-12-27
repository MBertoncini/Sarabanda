const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const ip = require('ip');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve i file statici (HTML, CSS, JS) dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Serve le GIF dalla cartella GIF
app.use('/GIF', express.static('GIF'));
// Serve i suoni dalla cartella Sounds
app.use('/Sounds', express.static('Sounds'));

// Traccia GIF e suoni già selezionati
let usedGifs = new Set();
let usedSounds = new Set();

// NUOVO: Sistema di sessioni
let gameSession = {
    active: false,           // Il gioco è attivo?
    sessionId: null,         // ID univoco della sessione
    teams: [],               // { id, sessionToken, name, members, gif, sound, score, connected }
};

// Genera un token univoco per la squadra
function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

// Genera un ID sessione
function generateSessionId() {
    return crypto.randomBytes(8).toString('hex');
}

// API per ottenere la lista delle GIF disponibili
app.get('/api/gifs', (req, res) => {
    const gifDir = path.join(__dirname, 'GIF');
    fs.readdir(gifDir, (err, files) => {
        if (err) {
            return res.json([]);
        }
        const allGifs = files.filter(f => /\.(gif|png|jpg|jpeg|webp)$/i.test(f));
        res.json(allGifs);
    });
});

// API per ottenere la lista dei suoni disponibili
app.get('/api/sounds', (req, res) => {
    const soundDir = path.join(__dirname, 'Sounds');
    fs.readdir(soundDir, (err, files) => {
        if (err) {
            return res.json([]);
        }
        const allSounds = files.filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f));
        res.json(allSounds);
    });
});

// API per ottenere suggerimenti casuali per nomi squadre e membri
app.get('/api/hints', (req, res) => {
    const hintsDir = path.join(__dirname, 'Hint');
    let teamHints = [];
    let memberHints = [];
    
    try {
        const teamFile = path.join(hintsDir, 'nomi_squadre.txt');
        if (fs.existsSync(teamFile)) {
            const content = fs.readFileSync(teamFile, 'utf8');
            teamHints = content.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
    } catch (e) {
        console.log('Nessun file nomi_squadre.txt trovato');
    }
    
    try {
        const memberFile = path.join(hintsDir, 'nomi_membri.txt');
        if (fs.existsSync(memberFile)) {
            const content = fs.readFileSync(memberFile, 'utf8');
            memberHints = content.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
    } catch (e) {
        console.log('Nessun file nomi_membri.txt trovato');
    }
    
    const shuffleAndPick = (arr, count) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    };
    
    res.json({
        teamSuggestions: shuffleAndPick(teamHints, 3),
        memberSuggestions: shuffleAndPick(memberHints, 3)
    });
});

// NUOVO: API per ottenere lo stato della sessione (squadre disconnesse a cui riconnettersi)
app.get('/api/session', (req, res) => {
    if (!gameSession.active) {
        return res.json({ active: false, disconnectedTeams: [] });
    }
    
    // Restituisci le squadre disconnesse (senza token, per sicurezza)
    const disconnectedTeams = gameSession.teams
        .filter(t => !t.connected)
        .map(t => ({
            name: t.name,
            members: t.members,
            gif: t.gif,
            sound: t.sound,
            score: t.score
        }));
    
    res.json({
        active: true,
        sessionId: gameSession.sessionId,
        disconnectedTeams: disconnectedTeams
    });
});

let buzzerLocked = true;

// Helper: ottieni dati squadre per broadcast (senza token)
function getTeamsForBroadcast() {
    return gameSession.teams.map(t => ({
        id: t.id,
        name: t.name,
        members: t.members,
        gif: t.gif,
        sound: t.sound,
        score: t.score,
        connected: t.connected
    }));
}

io.on('connection', (socket) => {
    // Invia stato attuale
    socket.emit('update_teams', getTeamsForBroadcast());
    socket.emit('used_resources', { gifs: Array.from(usedGifs), sounds: Array.from(usedSounds) });
    
    // NUOVO: Invia stato sessione
    if (gameSession.active) {
        const disconnectedTeams = gameSession.teams
            .filter(t => !t.connected)
            .map(t => ({
                name: t.name,
                members: t.members,
                gif: t.gif,
                sound: t.sound,
                score: t.score
            }));
        socket.emit('session_status', {
            active: true,
            sessionId: gameSession.sessionId,
            disconnectedTeams: disconnectedTeams
        });
    } else {
        socket.emit('session_status', { active: false, disconnectedTeams: [] });
    }

    // Registrazione Squadra (dal telefono)
    socket.on('register_team', (data) => {
        // Verifica che GIF e suono non siano già usati
        if (usedGifs.has(data.gif)) {
            socket.emit('registration_error', { message: 'Questa GIF è già stata scelta da un\'altra squadra!' });
            return;
        }
        if (usedSounds.has(data.sound)) {
            socket.emit('registration_error', { message: 'Questo suono è già stato scelto da un\'altra squadra!' });
            return;
        }
        
        // Marca GIF e suono come usati
        usedGifs.add(data.gif);
        usedSounds.add(data.sound);
        
        // Genera token per questa squadra
        const sessionToken = generateToken();
        
        const newTeam = {
            id: socket.id,
            sessionToken: sessionToken,
            name: data.name,
            members: data.members,
            gif: data.gif,
            sound: data.sound,
            score: 0,
            connected: true
        };
        gameSession.teams.push(newTeam);
        
        // Notifica tutti dell'aggiornamento
        io.emit('update_teams', getTeamsForBroadcast());
        io.emit('used_resources', { gifs: Array.from(usedGifs), sounds: Array.from(usedSounds) });
        
        // Conferma registrazione al client con il token
        socket.emit('registration_success', { sessionToken: sessionToken });
        
        // Aggiorna lista squadre disconnesse per tutti
        broadcastDisconnectedTeams();
        
        console.log(`Squadra registrata: ${data.name} (GIF: ${data.gif}, Sound: ${data.sound})`);
    });

    // NUOVO: Riconnessione squadra
    socket.on('rejoin_team', (data) => {
        const { teamName, sessionToken } = data;
        
        // Cerca la squadra
        const team = gameSession.teams.find(t => t.name === teamName);
        
        if (!team) {
            socket.emit('rejoin_error', { message: 'Squadra non trovata!' });
            return;
        }
        
        if (team.connected) {
            socket.emit('rejoin_error', { message: 'Questa squadra è già connessa!' });
            return;
        }
        
        // Verifica il token (se fornito) o permetti riconnessione senza token se la squadra è disconnessa
        if (sessionToken && team.sessionToken !== sessionToken) {
            // Token sbagliato, ma se la squadra è disconnessa permettiamo comunque
            console.log(`Riconnessione senza token valido per squadra: ${teamName}`);
        }
        
        // Aggiorna l'ID del socket e marca come connessa
        team.id = socket.id;
        team.connected = true;
        
        // Invia conferma con tutti i dati della squadra
        socket.emit('rejoin_success', {
            sessionToken: team.sessionToken,
            name: team.name,
            members: team.members,
            gif: team.gif,
            sound: team.sound,
            score: team.score
        });
        
        // Notifica tutti dell'aggiornamento
        io.emit('update_teams', getTeamsForBroadcast());
        broadcastDisconnectedTeams();
        
        console.log(`Squadra riconnessa: ${team.name}`);
    });

    // Prenotazione (Buzz)
    socket.on('buzz', () => {
        if (!buzzerLocked) {
            buzzerLocked = true;
            
            const team = gameSession.teams.find(t => t.id === socket.id);
            if (team) {
                io.emit('team_buzzed', {
                    id: team.id,
                    name: team.name,
                    gif: team.gif,
                    sound: team.sound
                });
                io.emit('buzzer_status', 'locked');
            }
        }
    });

    // Azioni del Giudice
    socket.on('judge_action', (action) => {
        switch(action.type) {
            case 'start_game':
                // NUOVO: Attiva la sessione quando il gioco inizia
                gameSession.active = true;
                gameSession.sessionId = generateSessionId();
                console.log(`Sessione di gioco avviata: ${gameSession.sessionId}`);
                io.emit('session_status', {
                    active: true,
                    sessionId: gameSession.sessionId,
                    disconnectedTeams: []
                });
                break;
                
            case 'unlock_buzzer':
                buzzerLocked = false;
                io.emit('buzzer_status', 'active');
                break;
                
            case 'lock_buzzer':
                buzzerLocked = true;
                io.emit('buzzer_status', 'locked');
                break;
                
            case 'update_score':
                const team = gameSession.teams.find(t => t.id === action.teamId);
                if (team) {
                    team.score += action.delta;
                    io.emit('update_teams', getTeamsForBroadcast());
                }
                break;
                
            case 'reset_round':
                buzzerLocked = true;
                io.emit('reset_round');
                break;
                
            case 'reset_game':
                // Reset completo del gioco
                gameSession = {
                    active: false,
                    sessionId: null,
                    teams: []
                };
                usedGifs.clear();
                usedSounds.clear();
                buzzerLocked = true;
                io.emit('update_teams', []);
                io.emit('used_resources', { gifs: [], sounds: [] });
                io.emit('session_status', { active: false, disconnectedTeams: [] });
                io.emit('game_reset');
                console.log('Gioco resettato dal giudice');
                break;
        }
    });

    // Disconnessione
    socket.on('disconnect', () => {
        const team = gameSession.teams.find(t => t.id === socket.id);
        if (team) {
            if (gameSession.active) {
                // NUOVO: Se il gioco è attivo, non rimuovere la squadra, solo marca come disconnessa
                team.connected = false;
                console.log(`Squadra disconnessa (può riconnettersi): ${team.name}`);
                
                // Notifica tutti che questa squadra è disconnessa
                io.emit('update_teams', getTeamsForBroadcast());
                broadcastDisconnectedTeams();
            } else {
                // Se il gioco non è attivo, rimuovi completamente
                usedGifs.delete(team.gif);
                usedSounds.delete(team.sound);
                gameSession.teams = gameSession.teams.filter(t => t.id !== socket.id);
                console.log(`Squadra rimossa: ${team.name} (GIF: ${team.gif} e Sound: ${team.sound} ora disponibili)`);
                
                io.emit('update_teams', getTeamsForBroadcast());
                io.emit('used_resources', { gifs: Array.from(usedGifs), sounds: Array.from(usedSounds) });
            }
        }
    });
});

// Helper: broadcast lista squadre disconnesse
function broadcastDisconnectedTeams() {
    const disconnectedTeams = gameSession.teams
        .filter(t => !t.connected)
        .map(t => ({
            name: t.name,
            members: t.members,
            gif: t.gif,
            sound: t.sound,
            score: t.score
        }));
    
    io.emit('session_status', {
        active: gameSession.active,
        sessionId: gameSession.sessionId,
        disconnectedTeams: disconnectedTeams
    });
}

// Avvio Server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n--- SARABANDA SERVER PRONTO ---`);
    console.log(`Indirizzo IP locale: http://${ip.address()}:${PORT}`);
    console.log(`1. Il Giudice apre questo link sul PC.`);
    console.log(`2. Le squadre aprono http://${ip.address()}:${PORT}/mobile.html sui telefoni.\n`);
});