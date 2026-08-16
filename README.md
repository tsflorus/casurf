# ça surf ?

App ultra basique : tu tapes une loc, elle te dit si ça surf.

## Comment ça marche

- Recherche de la loc via l'API de géocodage [Open-Meteo](https://open-meteo.com/) (gratuite, sans clé).
- Récupération de la houle (hauteur + période) via la [Marine API](https://open-meteo.com/en/docs/marine-weather-api) et du vent via la Forecast API, toutes deux Open-Meteo.
- Un coefficient de marée (vive-eau/morte-eau) estimé à partir de la phase lunaire, calculé localement dans le navigateur.
- Un score simple combine houle, période, vent et marée pour afficher un message :
  - **ça surf pas**
  - **ça surf vite fait**
  - **ça surf**
  - **NON MAIS WTF LES AMIS ?!?!?!**

C'est volontairement approximatif : l'idée est d'avoir un visuel + message en un coup d'œil, pas une prévision pro.

### Sur la marée

Il n'existe pas d'API de marée mondiale gratuite et sans clé (les vraies prédictions de marée sont propres à chaque station et demandent des données harmoniques payantes type WorldTides/Stormglass). L'app calcule donc uniquement le **coefficient** (force de la marée : vive-eau ↔ morte-eau, identique partout à une date donnée) à partir de la phase lunaire — pas l'heure de marée haute/basse ni si ça monte ou ça descend à l'instant T, qui dépendent du spot précis. C'est affiché comme "Marée (est.)" pour rester honnête sur la précision.

## Lancer en local

Aucune dépendance, aucun build. Sers juste les fichiers statiques :

```bash
python3 -m http.server 8000
```

Puis ouvre `http://localhost:8000`.

## Déploiement

Le dossier est 100% statique (`index.html`, `style.css`, `app.js`) : déployable tel quel sur GitHub Pages, Netlify, Vercel, etc.
