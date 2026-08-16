# ça surf ?

App ultra basique : tu tapes une loc, elle te dit si ça surf.

## Comment ça marche

- Recherche de la loc via l'API de géocodage [Open-Meteo](https://open-meteo.com/) (gratuite, sans clé).
- Récupération de la houle (hauteur + période) via la [Marine API](https://open-meteo.com/en/docs/marine-weather-api) et du vent via la Forecast API, toutes deux Open-Meteo.
- Un score simple combine hauteur de houle, période et vent pour afficher un message :
  - **ça surf pas**
  - **ça surf vite fait**
  - **ça surf**
  - **ça surf de fou**

C'est volontairement approximatif (pas d'orientation de spot, pas de marée) : l'idée est d'avoir un visuel + message en un coup d'œil, pas une prévision pro.

## Lancer en local

Aucune dépendance, aucun build. Sers juste les fichiers statiques :

```bash
python3 -m http.server 8000
```

Puis ouvre `http://localhost:8000`.

## Déploiement

Le dossier est 100% statique (`index.html`, `style.css`, `app.js`) : déployable tel quel sur GitHub Pages, Netlify, Vercel, etc.
