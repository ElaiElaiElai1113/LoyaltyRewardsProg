import { createServer } from 'vite';
import { realpathSync } from 'node:fs';
process.env.VITE_SUPABASE_URL = '';
process.env.VITE_SUPABASE_ANON_KEY = '';
const server = await createServer({ server: { host: '127.0.0.1', port: 5191, strictPort: true, fs: { strict: true, allow: [process.cwd(), realpathSync('node_modules')] } } });
await server.listen();server.printUrls();