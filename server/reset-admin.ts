// Local recovery: npm run reset-admin -- admin@email.com NewPassword123  (requires access to this machine/DB file)
import {DatabaseSync} from 'node:sqlite';import bcrypt from 'bcryptjs';import path from 'node:path';import {fileURLToPath} from 'node:url'
const [email,pw]=process.argv.slice(2);if(!email||!pw||pw.length<10){console.error('Usage: npm run reset-admin -- <email> <password (10+ chars)>');process.exit(1)}
const db=new DatabaseSync(process.env.DB_FILE||path.join(path.dirname(fileURLToPath(import.meta.url)),'nazar.db'))
const r=db.prepare("UPDATE users SET pass_hash=? WHERE email=? AND role='admin'").run(bcrypt.hashSync(pw,11),email.toLowerCase())
console.log(r.changes?'Admin password updated.':'No admin with that email.')
