import test from 'node:test';import assert from 'node:assert/strict';import {createApp} from './app.ts'
const srv=createApp(':memory:').listen(0);const base=`http://localhost:${(srv.address() as any).port}/api`
const call=async(p:string,m='GET',b?:any,c='')=>{const r=await fetch(base+p,{method:m,headers:{'Content-Type':'application/json',cookie:c},body:b?JSON.stringify(b):undefined});return{s:r.status,j:await r.json().catch(()=>({})),c:(r.headers.get('set-cookie')||'').split(';')[0]}}
const reg=(n:string)=>call('/auth/register','POST',{name:n,email:n+'@x.com',password:'longenoughpw1'})
test('roles, funding rules, booking races',async()=>{
 const [a,...rest]=await Promise.all([reg('first'),reg('b'),reg('c'),reg('d')]);const all=[a,...rest]
 assert.equal(all.filter(r=>r.j.role==='admin').length,1,'exactly one admin even when concurrent');assert.equal(all.filter(r=>r.j.role==='customer').length,3)
 const admin=all.find(r=>r.j.role==='admin')!,cust=all.filter(r=>r.j.role==='customer')
 assert.equal((await call('/admin/stats','GET',undefined,cust[0].c)).s,403);assert.equal((await call('/admin/stats')).s,401);assert.equal((await call('/admin/stats','GET',undefined,admin.c)).s,200)
 const opps=(await call('/opportunities')).j;assert.ok(opps.length>=8);const single=opps.find((o:any)=>o.target===3000),multi=opps.find((o:any)=>o.arrangement==='multi')
 assert.equal((await call('/interests','POST',{opportunityId:single.id,amount:500},cust[0].c)).s,400,'partial amount rejected for single-investor')
 assert.equal((await call('/interests','POST',{opportunityId:multi.id,amount:100},cust[0].c)).s,400,'below $500 minimum rejected')
 const ids=await Promise.all(cust.slice(0,2).map(c=>call('/interests','POST',{opportunityId:multi.id,amount:500},c.c)));ids.forEach(i=>assert.equal(i.s,200))
 const slot=(await call('/slots','GET',undefined,cust[0].c)).j.slots[0]
 const bk=await Promise.all(cust.slice(0,2).map((c,i)=>call('/appointments','POST',{interestId:ids[i].j.id,start:slot},c.c)))
 assert.deepEqual(bk.map(b=>b.s).sort(),[200,409],'same slot booked only once')
 const f=await call(`/admin/opportunities/${single.id}/funding`,'POST',{amount:3000},admin.c);assert.equal(f.s,200)
 assert.equal((await call(`/admin/opportunities/${multi.id}/funding`,'POST',{amount:99999},admin.c)).s,400,'funding cannot exceed target')
 srv.close()})
