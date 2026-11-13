import express from 'express';import bcrypt from 'bcryptjs';import {DatabaseSync} from 'node:sqlite';import crypto from 'node:crypto';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url'
const here=path.dirname(fileURLToPath(import.meta.url))
export const STATUSES=['Draft','Published and Accepting Interest','Under Review','Funding in Progress','Fully Funded','Closed']
const INTEREST=['New','Contacted','Appointment Scheduled','Under Discussion','Converted','Closed'],APPT=['Pending','Confirmed','Completed','Cancelled'],ARR=['single','multi']
const SCHEMA=`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,phone TEXT,pass_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN('admin','customer')),created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX IF NOT EXISTS one_admin ON users(role) WHERE role='admin';
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS opportunities(id INTEGER PRIMARY KEY,title TEXT NOT NULL,category TEXT NOT NULL,description TEXT NOT NULL,objective TEXT,target REAL NOT NULL CHECK(target>0),min_amount REAL NOT NULL,max_amount REAL,arrangement TEXT NOT NULL,structure TEXT,duration TEXT,fees TEXT,risks TEXT,image TEXT,status TEXT NOT NULL,published INTEGER DEFAULT 0,featured INTEGER DEFAULT 0,sample INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS interests(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,opp_id INTEGER NOT NULL,amount REAL NOT NULL,contact_method TEXT,phone TEXT,comments TEXT,status TEXT DEFAULT 'New',notes TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS funding(id INTEGER PRIMARY KEY,opp_id INTEGER NOT NULL,amount REAL NOT NULL CHECK(amount>0),note TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY,ref TEXT UNIQUE,user_id INTEGER NOT NULL,interest_id INTEGER NOT NULL,start TEXT NOT NULL,status TEXT DEFAULT 'Pending',notes TEXT DEFAULT '',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX IF NOT EXISTS slot_once ON appointments(start) WHERE status IN('Pending','Confirmed');
CREATE TABLE IF NOT EXISTS blocked(date TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT);`
const R='Capital may be lost. Returns are not guaranteed and depend on actual business performance. Timelines may change. Your rights depend on the executed contract and applicable law. SAMPLE record: replace via the Admin Panel.'
const SEED:[string,string,string,number,number,number|null,string,string,string][]=[
['Neighborhood Grocery Expansion (sample)','Retail','Sample: a small neighborhood grocery adding refrigeration and stock.',3000,3000,3000,'single','Mudarabah','12 months'],
['Women-led Tailoring Studio (sample)','Women-led business','Sample: a women-led tailoring studio buying machines and fabric.',5000,5000,5000,'single','Musharakah','18 months'],
['Woodworking Workshop (sample)','Furniture & woodworking','Sample: a furniture workshop buying machinery and timber.',6000,6000,6000,'single','Murabaha','12 months'],
['Saffron Processing & Export (sample)','Agriculture & food','Sample: saffron processing and export packaging.',10000,500,null,'multi','Musharakah','24 months'],
['Light Manufacturing: Plastic Goods (sample)','Local manufacturing','Sample: a small plastics workshop expanding production.',12000,500,null,'multi','Mudarabah','18 months'],
['Digital Services Studio (sample)','Technology','Sample: a web and digital-services studio hiring and equipment.',10000,500,null,'multi','Wakalah','12 months'],
['Solar Water Pumping (sample)','Renewable energy','Sample: solar pumps for local farms, leased to farmers.',15000,500,null,'multi','Ijarah','36 months'],
['Residential Rental Project (sample)','Real estate','Sample: collective financing of a small residential rental development; rights depend on final legal documentation.',20000,500,null,'multi','To be set in legal documentation','36 months']]
export function createApp(file=process.env.DB_FILE||path.join(here,'nazar.db')){
 const db=new DatabaseSync(file);db.exec(SCHEMA)
 const q=(s,...p:any[])=>db.prepare(s).all(...p) as any[],one=(s:any,...p:any[])=>db.prepare(s).get(...p) as any,run=(s:any,...p:any[])=>db.prepare(s).run(...p)
 const tx=<T>(f:()=>T):T=>{db.exec('BEGIN IMMEDIATE');try{const r=f();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}
 for(const[k,v]of Object.entries({office_address:'[Set in Admin → Settings]',email:'',phone:'',hours:'',facebook:'',instagram:'',tiktok:'',open_days:'0,1,2,3,4,6',start_hour:'9',end_hour:'16',slot_minutes:'30'}))run('INSERT OR IGNORE INTO settings VALUES(?,?)',k,v)
 if(!one('SELECT 1 x FROM opportunities'))SEED.forEach((s,i)=>run('INSERT INTO opportunities(title,category,description,objective,target,min_amount,max_amount,arrangement,structure,duration,fees,risks,image,status,published,featured) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',s[0],s[1],s[2],'To be defined with the business',s[3],s[4],s[5],s[6],s[7],s[8],'Nazar facilitation fee per business-plan model, to be confirmed',R,'','Published and Accepting Interest',1,i<3?1:0))
 const sha=(t:string)=>crypto.createHash('sha256').update(t).digest('hex')
 const app=express();app.disable('x-powered-by');app.use(express.json({limit:'3mb'}))
 app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');if(req.method!=='GET'&&!req.is('json')&&req.path.startsWith('/api'))return res.status(415).json({error:'JSON required'});
  const c=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('nz_sid='));(req as any).user=null
  if(c){const s=one('SELECT u.id,u.name,u.email,u.phone,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?',sha(c.slice(7)),Date.now());(req as any).user=s||null};next()})
 const bad=(res:any,m:string,c=400)=>res.status(c).json({error:m})
 const need=(role?:string)=>(req:any,res:any,next:any)=>!req.user?bad(res,'Sign in required',401):role&&req.user.role!==role?bad(res,'Forbidden',403):next()
 const wrap=(f:any)=>async(req:any,res:any)=>{try{await f(req,res)}catch(e:any){console.error(e);bad(res,'Server error',500)}}
 const tries=new Map<string,number[]>()
 const session=(res:any,uid:number)=>{const t=crypto.randomBytes(32).toString('hex');run('INSERT INTO sessions VALUES(?,?,?)',sha(t),uid,Date.now()+6048e5);res.cookie('nz_sid',t,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:6048e5})}
 const em=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
 app.post('/api/auth/register',wrap(async(req:any,res:any)=>{const{name,email,phone='',password}=req.body||{}
  if(!name?.trim()||!em.test(email||''))return bad(res,'Valid name and email required');if(typeof password!=='string'||password.length<10)return bad(res,'Password must be at least 10 characters')
  const h=bcrypt.hashSync(password,11)
  try{const id=tx(()=>{const role=one('SELECT COUNT(*) c FROM users').c===0?'admin':'customer';return Number(run('INSERT INTO users(name,email,phone,pass_hash,role) VALUES(?,?,?,?,?)',name.trim().slice(0,100),email.toLowerCase(),String(phone).slice(0,30),h,role).lastInsertRowid)});session(res,id);res.json(one('SELECT id,name,email,phone,role FROM users WHERE id=?',id))}
  catch(e:any){if(/UNIQUE/.test(String(e.message)))return bad(res,'Email already registered',409);throw e}}))
 app.post('/api/auth/login',wrap(async(req:any,res:any)=>{const email=String(req.body?.email||'').toLowerCase(),k=email+req.ip,now=Date.now(),a=(tries.get(k)||[]).filter(t=>now-t<9e5)
  if(a.length>=5)return bad(res,'Too many attempts. Try again in 15 minutes.',429);const u=one('SELECT * FROM users WHERE email=?',email)
  if(!u||!bcrypt.compareSync(String(req.body?.password||''),u.pass_hash)){a.push(now);tries.set(k,a);return bad(res,'Invalid email or password',401)}
  session(res,u.id);res.json({id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role})}))
 app.post('/api/auth/logout',(req:any,res)=>{const c=(req.headers.cookie||'').split(';').map((x:string)=>x.trim()).find((x:string)=>x.startsWith('nz_sid='));if(c)run('DELETE FROM sessions WHERE token=?',sha(c.slice(7)));res.clearCookie('nz_sid');res.json({ok:true})})
 app.get('/api/auth/me',(req:any,res)=>res.json(req.user))
 const OPP='SELECT o.*,COALESCE((SELECT SUM(amount) FROM funding f WHERE f.opp_id=o.id),0) raised FROM opportunities o'
 const mapO=(o:any)=>({id:o.id,title:o.title,category:o.category,description:o.description,objective:o.objective,target:o.target,min:o.min_amount,max:o.max_amount,arrangement:o.arrangement,structure:o.structure,duration:o.duration,fees:o.fees,risks:o.risks,image:o.image,status:o.status,published:!!o.published,featured:!!o.featured,sample:!!o.sample,raised:o.raised,remaining:o.target-o.raised,createdAt:o.created_at,updatedAt:o.updated_at})
 app.get('/api/opportunities',(req,res)=>res.json(q(OPP+' WHERE published=1 ORDER BY featured DESC,id').map(mapO)))
 app.get('/api/opportunities/:id',(req,res)=>{const o=one(OPP+' WHERE id=? AND published=1',req.params.id);o?res.json(mapO(o)):bad(res,'Not found',404)})
 app.get('/api/settings',(req,res)=>res.json(Object.fromEntries(q('SELECT * FROM settings').map(r=>[r.key,r.value]))))
 const slots=()=>{const S:any=Object.fromEntries(q('SELECT * FROM settings').map(r=>[r.key,r.value])),days=S.open_days.split(',').map(Number),step=Number(S.slot_minutes)||30,taken=new Set(q("SELECT start FROM appointments WHERE status IN('Pending','Confirmed')").map(r=>r.start)),blk=new Set(q('SELECT date FROM blocked').map(r=>r.date)),out:string[]=[]
  for(let i=1;i<=14;i++){const d=new Date(Date.now()+i*864e5),ds=d.toISOString().slice(0,10);if(!days.includes(d.getUTCDay())||blk.has(ds))continue
   for(let m=Number(S.start_hour)*60;m<Number(S.end_hour)*60;m+=step){const s=ds+'T'+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');if(!taken.has(s))out.push(s)}};return out}
 app.get('/api/slots',need(),(req,res)=>res.json({slots:slots(),minutes:Number(one("SELECT value v FROM settings WHERE key='slot_minutes'").v)}))
 app.post('/api/interests',need('customer'),wrap((req:any,res:any)=>{const b=req.body||{},o=one(OPP+' WHERE id=? AND published=1',b.opportunityId),amt=Number(b.amount)
  if(!o)return bad(res,'Opportunity not found',404);if(!['Published and Accepting Interest','Funding in Progress'].includes(o.status))return bad(res,'This opportunity is not accepting interest')
  if(!(amt>0))return bad(res,'Enter an indicative amount')
  if(o.arrangement==='single'){if(amt!==o.target)return bad(res,`This opportunity needs ONE investor to fund the full $${o.target}.`)}
  else{if(amt<o.min_amount)return bad(res,`Minimum is $${o.min_amount}`);if(amt>(o.max_amount||o.target))return bad(res,'Above the maximum for this opportunity');if(amt>o.target-o.raised)return bad(res,'Exceeds remaining funding requirement')}
  const id=Number(run('INSERT INTO interests(user_id,opp_id,amount,contact_method,phone,comments) VALUES(?,?,?,?,?,?)',req.user.id,o.id,amt,String(b.contactMethod||'').slice(0,20),String(b.phone||'').slice(0,30),String(b.comments||'').slice(0,1000)).lastInsertRowid);res.json({id,note:'Interest recorded. This is not an investment agreement or acceptance of funds.'})}))
 app.get('/api/me/interests',need(),(req:any,res)=>res.json(q('SELECT i.*,o.title,(SELECT COUNT(*) FROM appointments a WHERE a.interest_id=i.id AND a.status IN(\'Pending\',\'Confirmed\')) booked FROM interests i JOIN opportunities o ON o.id=i.opp_id WHERE i.user_id=? ORDER BY i.id DESC',req.user.id)))
 app.get('/api/me/appointments',need(),(req:any,res)=>res.json(q('SELECT a.*,o.title FROM appointments a JOIN interests i ON i.id=a.interest_id JOIN opportunities o ON o.id=i.opp_id WHERE a.user_id=? ORDER BY a.start DESC',req.user.id)))
 app.post('/api/appointments',need('customer'),wrap((req:any,res:any)=>{const{interestId,start}=req.body||{},i=one('SELECT * FROM interests WHERE id=? AND user_id=?',interestId,req.user.id)
  if(!i)return bad(res,'Interest not found',404);if(!slots().includes(start))return bad(res,'That time is not available',409)
  if(one("SELECT 1 x FROM appointments WHERE interest_id=? AND status IN('Pending','Confirmed')",i.id))return bad(res,'You already have an appointment for this interest',409)
  const ref='NZR-'+crypto.randomBytes(4).toString('hex').toUpperCase()
  try{run('INSERT INTO appointments(ref,user_id,interest_id,start) VALUES(?,?,?,?)',ref,req.user.id,i.id,start);run("UPDATE interests SET status='Appointment Scheduled' WHERE id=? AND status='New'",i.id)}catch(e:any){if(/UNIQUE/.test(String(e.message)))return bad(res,'That slot was just taken. Please choose another.',409);throw e}
  const S=Object.fromEntries(q('SELECT * FROM settings').map(r=>[r.key,r.value]));res.json({ref,start,office:S.office_address,email_notification:'not sent (email not configured)'})}))
 app.post('/api/appointments/:id/cancel',need(),(req:any,res)=>{const r=run("UPDATE appointments SET status='Cancelled' WHERE id=? AND user_id=? AND status IN('Pending','Confirmed')",req.params.id,req.user.id);r.changes?res.json({ok:true}):bad(res,'Not found',404)})
 const A=express.Router();A.use(need('admin'));app.use('/api/admin',A)
 const val=(b:any)=>{const t=Number(b.target),mn=Number(b.min),mx=b.max===''||b.max==null?null:Number(b.max)
  if(!b.title?.trim()||!b.category?.trim()||!b.description?.trim())return 'Title, category and description are required'
  if(!(t>0))return 'Funding target must be above 0';if(!ARR.includes(b.arrangement))return 'Invalid arrangement';if(!STATUSES.includes(b.status))return 'Invalid status'
  if(b.arrangement==='multi'&&(!(mn>0)||mn>t))return 'Minimum must be above 0 and not above target';if(mx!==null&&(mx<mn||mx>t))return 'Maximum must be between minimum and target'
  if(b.image&&!/^data:image\/(jpeg|png|webp);base64,/.test(b.image))return 'Image must be JPEG, PNG or WebP';return ''}
 const F=(b:any)=>{const s=b.arrangement==='single',t=Number(b.target);return[b.title.trim(),b.category.trim(),b.description.trim(),b.objective||'',t,s?t:Number(b.min),s?t:(b.max===''||b.max==null?null:Number(b.max)),b.arrangement,b.structure||'',b.duration||'',b.fees||'',b.risks||'',b.image||'',b.status,b.published?1:0,b.featured?1:0]}
 A.get('/opportunities',(req,res)=>res.json(q(OPP+' ORDER BY id DESC').map(mapO)))
 A.post('/opportunities',wrap((req:any,res:any)=>{const e=val(req.body||{});if(e)return bad(res,e);res.json({id:Number(run('INSERT INTO opportunities(title,category,description,objective,target,min_amount,max_amount,arrangement,structure,duration,fees,risks,image,status,published,featured,sample) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)',...F(req.body)).lastInsertRowid)})}))
 A.put('/opportunities/:id',wrap((req:any,res:any)=>{const e=val(req.body||{});if(e)return bad(res,e);const o=one(OPP+' WHERE id=?',req.params.id);if(!o)return bad(res,'Not found',404)
  if(Number(req.body.target)<o.raised)return bad(res,'Target cannot be below verified funding of $'+o.raised);run("UPDATE opportunities SET title=?,category=?,description=?,objective=?,target=?,min_amount=?,max_amount=?,arrangement=?,structure=?,duration=?,fees=?,risks=?,image=?,status=?,published=?,featured=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",...F(req.body),o.id);res.json({ok:true})}))
 A.delete('/opportunities/:id',(req,res)=>{run('DELETE FROM funding WHERE opp_id=?',req.params.id);run('DELETE FROM interests WHERE opp_id=?',req.params.id);run('DELETE FROM opportunities WHERE id=?',req.params.id);res.json({ok:true})})
 A.post('/opportunities/:id/funding',wrap((req:any,res:any)=>{const amt=Number(req.body?.amount);try{tx(()=>{const o=one(OPP+' WHERE id=?',req.params.id);if(!o)throw new Error('Not found');if(!(amt>0))throw new Error('Enter a positive amount')
  if(o.arrangement==='single'&&(amt!==o.target||o.raised>0))throw new Error('Single-investor: one verified record for the full target only')
  if(o.raised+amt>o.target)throw new Error('Verified funding cannot exceed the target ($'+(o.target-o.raised)+' remaining)')
  run('INSERT INTO funding(opp_id,amount,note) VALUES(?,?,?)',o.id,amt,String(req.body.note||'').slice(0,200));run('UPDATE opportunities SET status=? WHERE id=?',o.raised+amt>=o.target?'Fully Funded':'Funding in Progress',o.id)});res.json({ok:true})}catch(e:any){bad(res,e.message)}}))
 A.get('/interests',(req,res)=>res.json(q('SELECT i.*,u.name,u.email,u.phone uphone,o.title FROM interests i JOIN users u ON u.id=i.user_id JOIN opportunities o ON o.id=i.opp_id ORDER BY i.id DESC')))
 A.patch('/interests/:id',(req:any,res)=>{const{status,notes}=req.body||{};if(!INTEREST.includes(status))return bad(res,'Invalid status');run('UPDATE interests SET status=?,notes=? WHERE id=?',status,String(notes||'').slice(0,2000),req.params.id);res.json({ok:true})})
 A.get('/appointments',(req,res)=>res.json(q('SELECT a.*,u.name,u.email,o.title FROM appointments a JOIN users u ON u.id=a.user_id JOIN interests i ON i.id=a.interest_id JOIN opportunities o ON o.id=i.opp_id ORDER BY a.start')))
 A.patch('/appointments/:id',wrap((req:any,res:any)=>{const{status,notes,start}=req.body||{};if(!APPT.includes(status))return bad(res,'Invalid status');if(start&&!slots().includes(start))return bad(res,'That time is not available',409)
  try{run('UPDATE appointments SET status=?,notes=?,start=COALESCE(?,start) WHERE id=?',status,String(notes||'').slice(0,2000),start||null,req.params.id);res.json({ok:true})}catch(e:any){if(/UNIQUE/.test(String(e.message)))return bad(res,'Slot already taken',409);throw e}}))
 A.post('/blocked',(req:any,res)=>{if(!/^\d{4}-\d\d-\d\d$/.test(req.body?.date||''))return bad(res,'Date YYYY-MM-DD');run('INSERT OR IGNORE INTO blocked VALUES(?)',req.body.date);res.json({ok:true})})
 A.get('/users',(req,res)=>res.json(q("SELECT u.id,u.name,u.email,u.phone,u.role,u.created_at,(SELECT COUNT(*) FROM interests i WHERE i.user_id=u.id) interests,(SELECT COUNT(*) FROM appointments a WHERE a.user_id=u.id) appointments FROM users u ORDER BY u.id")))
 A.put('/settings',(req:any,res)=>{for(const k of ['facebook','instagram','tiktok']){const u=String(req.body?.[k]||'');if(u&&!/^https?:\/\/[^\s]+$/.test(u))return bad(res,'Invalid '+k+' link (must start with http:// or https://)')};for(const[k,v]of Object.entries(req.body||{}))if(one('SELECT 1 x FROM settings WHERE key=?',k))run('UPDATE settings SET value=? WHERE key=?',String(v).slice(0,300),k);res.json({ok:true})})
 A.get('/stats',(req,res)=>{const c=(s:string,...p:any[])=>one(s,...p).c;const now=new Date().toISOString().slice(0,16)
  res.json({customers:c("SELECT COUNT(*) c FROM users WHERE role='customer'"),published:c('SELECT COUNT(*) c FROM opportunities WHERE published=1'),opportunities:c('SELECT COUNT(*) c FROM opportunities'),interests:c('SELECT COUNT(*) c FROM interests'),newInterests:c("SELECT COUNT(*) c FROM interests WHERE status='New'"),upcoming:c("SELECT COUNT(*) c FROM appointments WHERE start>=? AND status IN('Pending','Confirmed')",now),pending:c("SELECT COUNT(*) c FROM appointments WHERE status='Pending'"),confirmed:c("SELECT COUNT(*) c FROM appointments WHERE status='Confirmed'"),completed:c("SELECT COUNT(*) c FROM appointments WHERE status='Completed'"),cancelled:c("SELECT COUNT(*) c FROM appointments WHERE status='Cancelled'"),verified:c('SELECT COALESCE(SUM(amount),0) c FROM funding'),targets:c('SELECT COALESCE(SUM(target),0) c FROM opportunities WHERE published=1')})})
 const dist=path.join(here,'..','dist');if(fs.existsSync(dist)){app.use(express.static(dist));app.get(/^\/(?!api).*/,(r,s)=>s.sendFile(path.join(dist,'index.html')))}
 return app}
