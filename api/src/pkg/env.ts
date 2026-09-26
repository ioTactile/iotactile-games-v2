/**
 * Load the monorepo-root .env (single file for api + app).
 * Import first in the entrypoint (server.ts).
 */
import path from 'node:path';
import { config } from 'dotenv';

const repoRoot = path.join(import.meta.dirname, '..', '..', '..');
config({ path: path.join(repoRoot, '.env'), quiet: true });
