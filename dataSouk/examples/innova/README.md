# Base SQLite d’exemple (InnovaSoft)

Fichier : **`innova.db`** — données fictives (tickets, lignes, articles, stock) pour tester DataSouk **sans** installation InnovaSoft.

## Générer ou régénérer le fichier

À la racine du monorepo `dataSouk` :

```bash
npm run example:db
```

Cela recrée `examples/innova/innova.db` (l’ancien fichier est écrasé).

## Utilisation dans le dashboard

1. Démarrer l’agent (`npm run dev:agent` avec `ANONYMIZE_SALT` défini).
2. Ouvrir **Configuration** (`/setup`), choisir **SQLite**.
3. Coller le **chemin absolu** vers `innova.db`, par exemple :
   - Windows : `D:\Bureau\Flayou3756\dataSouk\examples\innova\innova.db`
   - (Adaptez au dossier réel du dépôt sur votre PC.)

## Schéma

Tables alignées sur les requêtes en lecture seule de l’agent : `Ticket`, `LigneTicket`, `Article`, `Stock` (voir `apps/agent/src/db/queries.ts`).
