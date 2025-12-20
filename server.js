const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const ip = require('ip');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve i file statici (HTML, CSS, JS) dalla cartella 'public'
app.use(express.static('public'));
// Serve le GIF dalla cartella GIF
app.use('/GIF', express.static('GIF'));
// Serve i suoni dalla cartella Sounds
app.use('/Sounds', express.static('Sounds'));

// Traccia GIF e suoni già selezionati
let usedGifs = new Set();
let usedSounds = new Set();

// API per ottenere la lista delle GIF disponibili (esclude quelle già usate)
app.get('/api/gifs', (req, res) => {
    const gifDir = path.join(__dirname, 'GIF');
    fs.readdir(gifDir, (err, files) => {
        if (err) {
            return res.json([]);
        }
        const allGifs = files.filter(f => /\.(gif|png|jpg|jpeg|webp)$/i.test(f));
        const availableGifs = allGifs.filter(g => !usedGifs.has(g));
        res.json(availableGifs);
    });
});

// API per ottenere la lista dei suoni disponibili (esclude quelli già usati)
app.get('/api/sounds', (req, res) => {
    const soundDir = path.join(__dirname, 'Sounds');
    fs.readdir(soundDir, (err, files) => {
        if (err) {
            return res.json([]);
        }
        const allSounds = files.filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f));
        const availableSounds = allSounds.filter(s => !usedSounds.has(s));
        res.json(availableSounds);
    });
});

// API per ottenere suggerimenti casuali per nomi squadre e membri
app.get('/api/hints', (req, res) => {
    const hintsDir = path.join(__dirname, 'Hint');
    let teamHints = [];
    let memberHints = [];
    
    // Leggi nomi squadre
    try {
        const teamFile = path.join(hintsDir, 'nomi_squadre.txt');
        if (fs.existsSync(teamFile)) {
            const content = fs.readFileSync(teamFile, 'utf8');
            teamHints = content.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
    } catch (e) {
        console.log('Nessun file nomi_squadre.txt trovato');
    }
    
    // Leggi nomi membri
    try {
        const memberFile = path.join(hintsDir, 'nomi_membri.txt');
        if (fs.existsSync(memberFile)) {
            const content = fs.readFileSync(memberFile, 'utf8');
            memberHints = content.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
    } catch (e) {
        console.log('Nessun file nomi_membri.txt trovato');
    }
    
    // Seleziona 2-3 casuali per ogni categoria
    const shuffleAndPick = (arr, count) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    };
    
    const selectedTeams = shuffleAndPick(teamHints, 3);
    const selectedMembers = shuffleAndPick(memberHints, 3);
    
    res.json({
        teamSuggestions: selectedTeams,
        memberSuggestions: selectedMembers
    });
});

let teams = []; // { id, name, members, gif, sound, score }
let buzzerLocked = true; // Il pulsante è bloccato finché non parte la musica

io.on('connection', (socket) => {
    // Appena uno si connette, gli mandiamo lo stato attuale
    socket.emit('update_teams', teams);
    
    // Invia anche le risorse già usate per aggiornare la UI
    socket.emit('used_resources', { gifs: Array.from(usedGifs), sounds: Array.from(usedSounds) });

    // 1. Registrazione Squadra (dal telefono)
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
        
        const newTeam = {
            id: socket.id,
            name: data.name,
            members: data.members,
            gif: data.gif, // Es: "1.gif"
            sound: data.sound, // Es: "buzz1.mp3"
            score: 0
        };
        teams.push(newTeam);
        
        // Notifica tutti dell'aggiornamento squadre e risorse usate
        io.emit('update_teams', teams);
        io.emit('used_resources', { gifs: Array.from(usedGifs), sounds: Array.from(usedSounds) });
        
        // Conferma registrazione al client
        socket.emit('registration_success');
        
        console.log(`Squadra registrata: ${data.name} (GIF: ${data.gif}, Sound: ${data.sound})`);
    });

    // 2. Prenotazione (Buzz)
    socket.on('buzz', () => {
        if (!buzzerLocked) {
            buzzerLocked = true; // Blocca subito per tutti gli altri
            
            // Trova chi ha premuto
            const team = teams.find(t => t.id === socket.id);
            if (team) {
                io.emit('team_buzzed', team); // Dillo al giudice e ai telefoni
                io.emit('buzzer_status', 'locked'); // Blocca i telefoni
            }
        }
    });

    // 3. Azioni del Giudice
    socket.on('judge_action', (action) => {
        switch(action.type) {
            case 'unlock_buzzer':
                buzzerLocked = false;
                io.emit('buzzer_status', 'active'); // Accende i pulsanti sui telefoni
                break;
            case 'lock_buzzer':
                buzzerLocked = true;
                io.emit('buzzer_status', 'locked');
                break;
            case 'update_score':
                const team = teams.find(t => t.id === action.teamId);
                if (team) {
                    team.score += action.delta;
                    io.emit('update_teams', teams);
                }
                break;
            case 'reset_round':
                buzzerLocked = true;
                io.emit('reset_round'); // Toglie overlay dai telefoni
                break;
            case 'reset_game':
                // Reset completo del gioco
                teams = [];
                usedGifs.clear();
                usedSounds.clear();
                buzzerLocked = true;
                io.emit('update_teams', teams);
                io.emit('used_resources', { gifs: [], sounds: [] });
                io.emit('game_reset');
                console.log('Gioco resettato dal giudice');
                break;
        }
    });

    // Disconnessione
    socket.on('disconnect', () => {
        const team = teams.find(t => t.id === socket.id);
        if (team) {
            // Libera GIF e suono
            usedGifs.delete(team.gif);
            usedSounds.delete(team.sound);
            console.log(`Squadra disconnessa: ${team.name} (GIF: ${team.gif} e Sound: ${team.sound} ora disponibili)`);
        }
        teams = teams.filter(t => t.id !== socket.id);
        io.emit('update_teams', teams);
        io.emit('used_resources', { gifs: Array.from(usedGifs), sounds: Array.from(usedSounds) });
    });
});

// Avvio Server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n--- SARABANDA SERVER PRONTO ---`);
    console.log(`Indirizzo IP locale: http://${ip.address()}:${PORT}`);
    console.log(`1. Il Giudice apre questo link sul PC.`);
    console.log(`2. Le squadre aprono http://${ip.address()}:${PORT}/mobile.html sui telefoni.\n`);
});