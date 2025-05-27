# Tabata Timer - Server Instructions

## Quick Start

1. **Start the server:**
   ```bash
   ./start_server.sh
   ```
   
   Or manually:
   ```bash
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

2. **Open your browser and go to:**
   ```
   http://localhost:8000
   ```
   
   **⚠️ Important: Use HTTP, not HTTPS!**

## Troubleshooting

### SSL/TLS Errors in Server Logs
If you see errors like `\x16\x03\x01` in the server logs, it means:

- Your browser is trying to use HTTPS instead of HTTP
- Make sure you're accessing `http://localhost:8080` (not `https://`)
- Clear your browser cache if needed
- Try incognito/private browsing mode

### Browser Issues
- **Chrome/Edge**: Type `http://localhost:8080` explicitly in the address bar
- **Firefox**: Should work fine with HTTP
- **Safari**: May try to upgrade to HTTPS automatically

### Port Already in Use
If port 8080 is busy, try a different port:
```bash
python3 -m http.server 8081 --bind 127.0.0.1
```

## Features Working
✅ Atomic timer (continues in background)  
✅ Start/Pause/Reset controls  
✅ Exercise beep sound (beep.mp3)  
✅ Settings with modal editing  
✅ Preset save/load system  
✅ Dark theme matching mobile design  
✅ All settings in seconds  
✅ No "Saved" popup messages  

## Development
The app uses vanilla JavaScript + jQuery + Bootstrap 5, no build process needed. 