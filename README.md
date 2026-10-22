# Express Débarras · site démo BTS NDRC

Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · Lenis · Vitest. Aucun backend : l’état vit dans React et localStorage.

## Lancer

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 17 tests de prix (dont les 6 obligatoires)
npm run build
```

## Déployer sur Vercel

1. Pousser le dossier sur un dépôt GitHub.
2. vercel.com → Add New Project → importer le dépôt → Deploy (aucune variable d’environnement).
3. Mettre à jour `metadataBase` dans `app/layout.tsx` et l’URL de `app/sitemap.ts` / `app/robots.ts` avec le domaine final.

## Où modifier quoi

| Besoin | Fichier |
| --- | --- |
| Prix, volumes, packs, FAQ, avis exemples, coordonnées | `lib/data.ts` |
| Logique de calcul (fonction pure) | `lib/pricing.ts` + `tests/pricing.test.ts` |
| Couleurs, typos, ombres | `tailwind.config.ts` |
| Logo SVG | `components/brand/Logo.tsx` |
| Illustrations | `components/illus/Illus.tsx`, `Avatar.tsx` |

## Règles de calcul retenues

- Au-delà de 40 m³ : `max(1 490 €, volume × 36 €)`.
- Étage sans ascenseur : `(étage − 1) × 15 €` à partir du 2e.
- Arrondi à l’euro, demi vers le haut, calcul interne en centimes.
- Tournée 7 j réservée à Express Objet ; urgence et samedi s’appliquent aussi à Express Objet.
- Sérénité inclut le démontage ; Clés en main inclut Sérénité et 60 m² de nettoyage.

## Parcours démo pour l’oral

Accueil → puce « Cave, garage, grenier » → simulateur → réserver → confirmation → `/espace` → statut → « Générer le rapport de tri » → Imprimer.
