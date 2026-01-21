# 🎵 SARABANDA - Party Game

Un gioco musicale interattivo locale per PC e smartphone, ispirato al famoso quiz musicale televisivo. Il giudice controlla il gioco dal PC mentre i concorrenti giocano dai loro telefoni utilizzando il buzzer virtuale.

---

## 🎮 Caratteristiche

- **Multiplayer locale**: Supporta più squadre che giocano contemporaneamente
- **Interface responsive**: Console giudice su PC, buzzer sui telefoni
- **Personalizzazione squadre**: Ogni squadra sceglie una GIF e un suono distintivi
- **Sistema di punteggio flessibile**:
  - **Classico**: +1 per risposta corretta, -1 per risposta sbagliata
  - **Titolo+Autore**: +2 per entrambi corretti, 0 per uno solo, -2 per errore totale
- **Riconnessione automatica**: Le squadre possono riconnettersi se perdono la connessione
- **QR Code automatico**: Scansiona per connetterti rapidamente
- **Classifica in tempo reale**: Visibile sia dal giudice che dai concorrenti
- **Wake Lock**: Lo schermo del telefono non si spegne durante il gioco
- **Visualizzatore audio**: Spettro audio animato durante la riproduzione dei brani
- **Gestione brani**: Carica le tue playlist MP3 via drag & drop

---

## 📁 Struttura del Progetto

```
Sarabanda/
├── SarabandaGame.exe        # Eseguibile per Windows (generato)
├── server.js                # Server Node.js principale
├── package.json             # Dipendenze del progetto
├── README.md                # Questo file
├── public/                  # File web dell'interfaccia
│   ├── index.html          # Console del giudice
│   └── mobile.html         # Interfaccia mobile per i concorrenti
├── GIF/                     # GIF per le squadre (personalizzabili)
│   ├── example1.gif
│   ├── example2.gif
│   └── ...
├── Sounds/                  # Suoni per le squadre (personalizzabili)
│   ├── sound1.mp3
│   ├── sound2.mp3
│   └── ...
└── Hint/                    # Suggerimenti per nomi (personalizzabili)
    ├── nomi_squadre.txt    # Nomi suggeriti per le squadre
    └── nomi_membri.txt     # Nomi suggeriti per i membri
```

---

## 🚀 Avvio Rapido

### Opzione 1: Usa l'Eseguibile (Consigliato)

1. **Avvia il server**:
   - Fai doppio click su `SarabandaGame.exe`
   - Si aprirà una finestra nera (terminale) con:
     - Il link per il giudice: `http://localhost:3000`
     - Un QR Code da scansionare con i telefoni
     - Il link manuale per i telefoni

2. **Giudice**: Apri `http://localhost:3000` nel browser del PC

3. **Concorrenti**: Scansiona il QR Code con la fotocamera del telefono oppure digita manualmente l'URL mostrato

### Opzione 2: Sviluppo con Node.js

Se hai Node.js installato e vuoi modificare il codice:

```bash
# Installa le dipendenze
npm install

# Avvia il server
npm start
```

---

## 🎯 Come Giocare

### Setup Iniziale (Giudice)

1. **Carica i brani musicali**:
   - Trascina i file MP3 nell'area di drop
   - Oppure clicca per selezionarli dal file manager
   - I brani verranno caricati nella playlist

2. **Configura il sistema di punteggio**:
   - Clicca sull'icona ⚙️ in alto a destra
   - Scegli tra:
     - **Classico (+1/-1)**: Risposta corretta +1, sbagliata -1
     - **Titolo+Autore (+2/0/-2)**: Entrambi corretti +2, uno solo 0, errore -2

3. **Aspetta che le squadre si registrino**:
   - Ogni squadra sceglie nome, membri, GIF e suono
   - Le squadre appaiono nella lobby in tempo reale

4. **Avvia il gioco**:
   - Clicca "INIZIA PARTITA" quando tutte le squadre sono pronte

### Durante la Partita

#### Console Giudice:

1. **Riproduci un brano**: Clicca ▶ per far partire la canzone
2. **Attiva il buzzer**: Clicca "🔓 SBLOCCA" per permettere alle squadre di prenotarsi
3. **Gestisci le prenotazioni**:
   - La prima squadra che preme il buzzer viene mostrata
   - Clicca "✓ CORRETTO" o "✗ SBAGLIATO" per assegnare i punti
   - Se hai selezionato "Titolo+Autore", avrai opzioni aggiuntive
4. **Rivela il titolo**: Clicca "👁 MOSTRA TITOLO" per mostrare la soluzione a tutti
5. **Prossimo round**: Clicca "NUOVO ROUND" e ricomincia

#### Interfaccia Mobile (Concorrenti):

1. **Registrazione**:
   - Inserisci il nome della squadra e i membri
   - Scegli una GIF (avatar della squadra)
   - Scegli un suono (che si sentirà quando prenoti)
   - Clicca "🎮 ENTRA IN GIOCO"

2. **Durante la partita**:
   - Vedi la **classifica compatta** in alto con tutti i punteggi
   - Il buzzer cambierà da "BLOCCATO" a "PRENOTA!" quando attivo
   - Premi il buzzer per prenotare la risposta
   - Lo schermo **non si spegne** automaticamente durante il gioco

---

## 🔧 Personalizzazione

### Cambiare GIF e Suoni

Puoi personalizzare le GIF e i suoni semplicemente sostituendo i file nelle cartelle:

- **GIF**: Aggiungi file `.gif`, `.png`, `.jpg`, `.jpeg`, `.webp` nella cartella `GIF/`
- **Suoni**: Aggiungi file `.mp3`, `.wav`, `.ogg`, `.m4a` nella cartella `Sounds/`

Le modifiche saranno disponibili al prossimo avvio del server.

### Suggerimenti per Nomi

Modifica i file nella cartella `Hint/`:

- **`nomi_squadre.txt`**: Lista di nomi suggeriti per le squadre (separati da virgola)
- **`nomi_membri.txt`**: Lista di nomi suggeriti per i membri (separati da virgola)

Esempio:
```
I Fantastici 4, Le Tigri, I Draghi, Gli Aquilotti, Le Stelle
```

---

## 🛠️ Sviluppo e Build

### Dipendenze

Il progetto usa le seguenti librerie Node.js:

- **express**: Web server
- **socket.io**: Comunicazione real-time tra giudice e concorrenti
- **ip**: Rilevamento automatico dell'indirizzo IP locale
- **qrcode-terminal**: Generazione QR Code nel terminale

### Generare l'Eseguibile

Se modifichi il codice e vuoi rigenerare l'eseguibile:

```bash
# Installa pkg globalmente (solo la prima volta)
npm install -g pkg

# Genera l'eseguibile per Windows 64-bit
pkg . --targets node18-win-x64 --output SarabandaGame
```

**Opzioni disponibili**:
- `node18-win-x64`: Windows 64-bit
- `node18-linux-x64`: Linux 64-bit
- `node18-macos-x64`: macOS 64-bit
- `node18-macos-arm64`: macOS Apple Silicon (M1/M2)

Per generare eseguibili per più piattaforme:
```bash
pkg . --targets node18-win-x64,node18-linux-x64,node18-macos-x64 --output SarabandaGame
```

### Comandi Utili

```bash
# Installa le dipendenze
npm install

# Avvia il server in modalità sviluppo
npm start

# Genera l'eseguibile
pkg . --targets node18-win-x64 --output SarabandaGame

# Genera per tutte le piattaforme principali
pkg . --targets node18-win-x64,node18-linux-x64,node18-macos-x64 --output SarabandaGame
```

---

## 🌐 Requisiti di Rete

- **PC e telefoni devono essere sulla stessa rete WiFi**
- **Porta 3000**: Il server usa la porta 3000 (assicurati che non sia bloccata dal firewall)
- **Firewall di Windows**: Potrebbe essere necessario consentire l'accesso alla porta 3000

Se il firewall blocca le connessioni:
1. Apri "Firewall di Windows Defender"
2. Clicca su "Impostazioni avanzate"
3. Aggiungi una nuova regola in entrata per la porta 3000

---

## 📱 Compatibilità

### Browser Supportati

- **Desktop**: Chrome, Firefox, Edge, Safari (ultime versioni)
- **Mobile**: Chrome, Safari, Firefox (ultime versioni)

### Wake Lock API

La funzionalità di prevenzione dello spegnimento dello schermo è supportata su:
- Chrome/Edge per Android
- Safari per iOS (limitato)

Se il tuo browser non supporta Wake Lock, lo schermo potrebbe spegnersi normalmente.

---

## 🐛 Risoluzione Problemi

### Le squadre non vedono le GIF/Suoni

1. Controlla che le cartelle `GIF/` e `Sounds/` siano nella stessa directory dell'eseguibile
2. Verifica che il firewall non blocchi la porta 3000
3. Assicurati che PC e telefoni siano sulla stessa rete WiFi
4. Controlla i log nel terminale per vedere se le richieste arrivano

### Errore `io is not defined`

Se vedi questo errore, significa che Socket.IO non si sta caricando. Il progetto ora usa la CDN di Socket.IO, quindi richiede una connessione internet attiva.

### Il server non si avvia

1. Verifica che la porta 3000 non sia già in uso
2. Chiudi eventuali istanze precedenti di SarabandaGame.exe
3. Controlla che tutte le cartelle (`public/`, `GIF/`, `Sounds/`, `Hint/`) siano presenti

---

## 🎨 Tecnologie Utilizzate

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Real-time**: Socket.IO
- **Audio**: Web Audio API
- **Wake Lock**: Screen Wake Lock API
- **Build**: pkg (per la generazione dell'eseguibile)

---

## 📝 Licenza

Progetto open source creato per scopi didattici e ricreativi.

---

## 🤝 Contributi

Sentiti libero di aprire issue o pull request per migliorare il gioco!

---

## 📞 Supporto

Per problemi o domande, apri un issue su GitHub.

---

**Buon divertimento! 🎵🎉**
