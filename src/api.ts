import {useEffect,useState} from 'react'
export async function api<T=any>(path:string,method='GET',body?:unknown):Promise<T>{const r=await fetch('/api'+path,{method,credentials:'same-origin',headers:body!==undefined?{'Content-Type':'application/json'}:{},body:body!==undefined?JSON.stringify(body):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Request failed');return j}
export function useApi<T=any>(path:string|null){const [data,setData]=useState<T|null>(null),[err,setErr]=useState(''),[loading,setL]=useState(true),[n,setN]=useState(0)
 useEffect(()=>{if(!path)return;setL(true);api<T>(path).then(x=>{setData(x);setErr('')}).catch(x=>setErr(x.message)).finally(()=>setL(false))},[path,n]);return{data,err,loading,reload:()=>setN(v=>v+1)}}
export const money=(n:number)=>'$'+Number(n).toLocaleString()
export const STATUSES=['Draft','Published and Accepting Interest','Under Review','Funding in Progress','Fully Funded','Closed']
export const CATS=['Retail','Agriculture & food','Furniture & woodworking','Local manufacturing','Technology','Women-led business','Renewable energy','Real estate']
export const STRUCTS=['Musharakah','Mudarabah','Murabaha','Wakalah','Ijarah','Sukuk','To be set in legal documentation']
