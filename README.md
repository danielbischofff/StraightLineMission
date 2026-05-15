# Straightline Missions | Vibe Code Project


## Struktur

```txt
straightline-missions-clean/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js        # Startpunkt, Event-Listener, Bootstrapping
    ├── config.js     # Konstanten, Karten- und Storage-Konfiguration
    ├── dom.js        # Zentrale DOM-Referenzen
    ├── gps.js        # Standortabfrage und GPS-Watch
    ├── map.js        # Leaflet-Karte, Marker, Linien, Geo-Berechnungen
    ├── mission.js    # Missionsstart, Abschluss, Score-Logik
    ├── setup.js      # Start-/Ziel-Auswahl
    ├── state.js      # Gemeinsamer App-State
    ├── storage.js    # localStorage laden/speichern
    └── utils.js      # Formatierung und Hilfsfunktionen
```

## Wichtig

- Für GPS braucht der Browser HTTPS oder `localhost`.
- Die App lädt Leaflet und Turf weiterhin per CDN.
- Wegen JavaScript-Modulen sollte die App über einen lokalen Server geöffnet werden, nicht direkt per `file://`.

Beispiel:

```bash
python3 -m http.server 8000
```

Dann im Browser öffnen:

```txt
http://localhost:8000
```
