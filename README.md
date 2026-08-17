# ça surf ?

App ultra basique : tu tapes une loc, elle te dit si ça surf.

## Comment ça marche

- Recherche de la loc via l'API de géocodage [Open-Meteo](https://open-meteo.com/) (gratuite, sans clé).
- Récupération de la houle (hauteur + période) via la [Marine API](https://open-meteo.com/en/docs/marine-weather-api) et du vent via la Forecast API, toutes deux Open-Meteo.
- Vrais horaires de marée (pleine/basse mer) via [Stormglass](https://stormglass.io/) pour la vue détaillée d'un spot, avec repli sur un coefficient (vive-eau/morte-eau) estimé par phase lunaire si le quota gratuit est dépassé ou pour la liste "Spots".
- Un score simple combine houle, période, vent et marée pour afficher un message :
  - **ça surf pas**
  - **ça surf vite fait**
  - **ça surf**
  - **ça surf de fou**
  - **NON MAIS WTF LES AMIS ?!?!?!**

C'est volontairement approximatif : l'idée est d'avoir un visuel + message en un coup d'œil, pas une prévision pro.

### Sur la marée

Stormglass fournit les vrais horaires de pleine/basse mer, utilisés quand on regarde un spot précis (recherche, géolocalisation, ou clic depuis la liste des spots). Sa clé API gratuite (~10 requêtes/jour) est intégrée côté client — visible dans le code source puisque l'app est 100% statique, sans backend pour la cacher.

La liste "Spots" (12 appels en parallèle) épuiserait ce quota d'un coup, donc elle reste sur l'estimation par phase lunaire du **coefficient de marée** (vive-eau ↔ morte-eau, identique partout à une date donnée) plutôt que sur les vrais horaires. Ce même repli s'active automatiquement partout ailleurs si Stormglass échoue (quota dépassé, erreur réseau...), affiché comme "Marée (est.)" pour rester honnête sur la précision.

## Lancer en local

Aucune dépendance, aucun build. Sers juste les fichiers statiques :

```bash
python3 -m http.server 8000
```

Puis ouvre `http://localhost:8000`.

## Déploiement

Le dossier est 100% statique (`index.html`, `style.css`, `app.js`) : déployable tel quel sur GitHub Pages, Netlify, Vercel, etc.
