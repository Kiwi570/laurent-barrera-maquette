# Laurent Barrera — maquette v3 « Sous-bois sacré »

Site statique (HTML, CSS, JavaScript), sans étape de construction, prêt pour Vercel (`vercel.json`, adresses propres).

## Pages (v2, multipage)

- `index.html` : accueil (ouverture, à paraître, démarche, aperçus de chaque rubrique)
- `series/index.html` et `series/*.html` : les six séries, chacune avec visionneuse, loupe et vue au mur
- `livres/index.html` et `livres/*.html` : catalogue et une fiche par livre (Les arbres sacrés du Japon, Koï, Esthétiques japonaises en photographie, Fragrances du Japon, Pleine Présence en Photographie)
- `parcours.html` : démarche, cernes 2019-2026, expositions, prix, presse
- `actualites.html` : derniers articles, archives 2026, lettre d'information (simulée)
- `tirages.html` : vue au mur, choix dans les séries, demande de tirage
- `contact.html` : coordonnées, formulaire, galeries et festivals
- `les-arbres-sacres-du-japon.html` : redirige vers `livres/les-arbres-sacres-du-japon.html` (ancienne adresse de la v1)

## À compléter avec Laurent

- Titre, année, technique et format de chaque photographie (affichés « à compléter »).
- Formats, papiers et prix des tirages d'art ; les formats de la vue au mur (60, 90, 120 cm) sont illustratifs.
- Prix des livres Fragrances du Japon, Esthétiques japonaises et Pleine Présence ; frais d'envoi et mode de paiement du panier.
- Format, pagination et ISBN confirmé des Arbres sacrés du Japon (ISBN déduit de la référence Amazon 2354323816).
- Étapes du livre au-delà de Yakushima et Kyūshū (sanctuaires, chemins de pèlerinage).
- Année de l'exposition « Éphémère Tokyo » et date de l'exposition à la mairie d'honneur de Toulon.
- Fichiers haute définition : série Protean (800 px), Horses Kami n° 05, Koï n° 03 et 04 (1000 px).
- Expositions et distinctions de la série Divers.
- Le livre « Les 4 dimensions du bonheur », vu sur le blog, n'apparaît nulle part ailleurs : à confirmer.

## Incohérences relevées sur le site actuel

- Titres d'onglets « Monsite » ; sous-titre « Artiste Photographe » sur la page Contact au lieu de « Auteur et Photographe ».
- Adresses trompeuses (/paysages pour les chevaux, /fleurs-hana pour Shintô, /photaquarelles pour les livres).
- Page À propos : essai annoncé en 3 langues, le blog en annonce 5 ; © 2025 ; lien Facebook vers une recherche.

## Simulations

Formulaires, panier et rappel de parution sont simulés : rien n'est envoyé. Les liens Amazon et les articles du blog pointent vers les vraies pages.

## Organisation des fichiers (v3)

- `src/` : sources lisibles (JavaScript, CSS, bibliothèques). Non publiées sur Vercel (`.vercelignore`).
- `assets/js/` et `assets/css/` : versions regroupées et minifiées servies par le site, générées à partir de `src/`.
  `vendor.js` (GSAP, ScrollTrigger, SplitText, Lenis), `site.js` (commun à toutes les pages), `fog.js` (brume WebGL), puis un script par type de page.
- `assets/fonts/` : polices WOFF2 allégées (jeu de caractères latin, axes utiles seulement).
- Les liens internes sont sans « .html » (adresses propres de Vercel), et chaque fichier CSS ou JS porte une empreinte `?v=` : le cache navigateur se renouvelle à chaque mise à jour.
- `404.html` : page « Perdu dans la brume » pour les adresses inconnues.
- Pour ouvrir le site en local avec ces adresses propres : `npx serve` dans le dossier (un simple double-clic sur un fichier HTML ne suit pas les liens).

## Crédits techniques

GSAP 3.15 (licence GreenSock), Lenis 1.3 (MIT), OGL 1.0 (domaine public), polices Fraunces, Instrument Sans et DM Mono (SIL Open Font License, fichiers dans `assets/fonts`).
Images d'ambiance (brume, mur, écorce, mousse, cernes, papier, atelier, eau, table) créées avec Grok ; toutes les autres photographies sont de Laurent Barrera.
