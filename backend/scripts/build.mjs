// `npm run build`: compila el backend con Nest (genera `dist/`).
// En Vercel se omite: Vercel compila y empaqueta el backend por su cuenta a partir del código fuente
// (`src/main.ts`). Si además existiera `dist/`, usaría su contenido como raíz de la función y las
// dependencias quedarían fuera de `/var/task/node_modules` ("Cannot find package '@nestjs/common'").
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';

if (process.env.VERCEL) {
  // El caché de build de Vercel puede restaurar un `dist/` viejo de un deploy anterior: se borra para que
  // Vercel no lo use como raíz de la función.
  rmSync(new URL('../dist', import.meta.url), { recursive: true, force: true });
  console.log('Vercel compila el backend desde el código fuente: se omite `nest build`.');
  process.exit(0);
}

const { status } = spawnSync('nest', ['build'], { stdio: 'inherit', shell: true });
process.exit(status ?? 1);
