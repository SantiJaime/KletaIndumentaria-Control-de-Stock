// Después de `nest build`: marca `dist/` como ESM.
// Vercel usa el contenido de `dist/` como raíz de la función (`/var/task/main.js`), sin el package.json
// del backend; sin este archivo Node trata `main.js` como CommonJS y falla con sus `import`.
import { writeFileSync } from 'node:fs';

writeFileSync(new URL('../dist/package.json', import.meta.url), '{ "type": "module" }\n');
