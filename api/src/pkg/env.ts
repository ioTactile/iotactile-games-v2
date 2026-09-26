/**
 * Charge le .env à la racine du monorepo (un seul fichier pour api + app).
 * À importer en premier dans le point d'entrée (server.ts).
 */
import path from "node:path";
import { config } from "dotenv";

const repoRoot = path.join(import.meta.dirname, "..", "..", "..");
config({ path: path.join(repoRoot, ".env"), quiet: true });
