import bcrypt from 'bcrypt';
import postgres from 'postgres';

const DATABASE_URL = 'postgresql://sports:sports123@localhost:5432/sports_manager';

const sql = postgres(DATABASE_URL);

const password = 'Admin1234!';
const hash = await bcrypt.hash(password, 10);

const [user] = await sql`
  INSERT INTO users (email, password_hash, name, role)
  VALUES ('admin@golmanager.com', ${hash}, 'Administrador', 'SUPER_ADMIN')
  ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        name          = EXCLUDED.name,
        role          = EXCLUDED.role
  RETURNING id, email, name, role
`;

console.log('✅ Usuario creado:');
console.log('   Email:      admin@golmanager.com');
console.log('   Contraseña: Admin1234!');
console.log('   Rol:        SUPER_ADMIN');
console.log('   ID:         ' + user.id);

await sql.end();
