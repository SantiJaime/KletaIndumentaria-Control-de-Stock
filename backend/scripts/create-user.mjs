// Crea (o actualiza la contraseña y el rol de) un usuario.
//   USER_PASSWORD='...' npm run user:create -- <usuario> <admin|vendedor>
// La contraseña va por variable de entorno para que no quede en el historial del shell ni en el código.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';

const ROLES = ['admin', 'vendedor'];
const [rawUsername, role] = process.argv.slice(2);
const password = process.env.USER_PASSWORD;

const username = rawUsername?.trim().toLowerCase();
if (!username || !ROLES.includes(role) || !password) {
  console.error(
    "Uso: USER_PASSWORD='...' npm run user:create -- <usuario> <admin|vendedor>",
  );
  process.exit(1);
}
if (password.length < 6 || Buffer.byteLength(password) > 72) {
  console.error('La contraseña debe tener entre 6 y 72 caracteres.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();
try {
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await client.query(
    `INSERT INTO users (username, password_hash, role, updated_at)
     VALUES ($1, $2, $3::"Role", now())
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, updated_at = now()
     RETURNING id, (xmax = 0) AS created`,
    [username, passwordHash, role],
  );
  console.log(
    `${rows[0].created ? 'Usuario creado' : 'Usuario actualizado'}: ${username} (${role}), id ${rows[0].id}`,
  );
} finally {
  await client.end();
}
