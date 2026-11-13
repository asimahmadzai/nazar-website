import {createContext,useContext,useEffect,useState,ReactNode} from 'react'
import en from './i18n/en';import fa from './i18n/fa';import ps from './i18n/ps';import {api} from './api'
const dict:Record<string,Record<string,string>>={en,fa,ps}
export interface Me{id:number;name:string;email:string;phone:string;role:'admin'|'customer'}
interface Ctx{lang:string;setLang:(l:string)=>void;t:(k:string)=>string;me:Me|null|undefined;setMe:(m:Me|null)=>void;signOut:()=>void;toast:string;say:(m:string)=>void;S:Record<string,string>;reloadS:()=>void}
const C=createContext<Ctx>(null!);export const useApp=()=>useContext(C)
export function Provider({children}:{children:ReactNode}){
 const [lang,setLang]=useState(['en','fa','ps'].includes(localStorage.getItem('nz_lang')||'')?localStorage.getItem('nz_lang')!:'en'),[me,setMe]=useState<Me|null|undefined>(undefined),[toast,setToast]=useState(''),[S,setS]=useState<Record<string,string>>({})
 const reloadS=()=>api('/settings').then(setS).catch(()=>{})
 useEffect(()=>{api('/auth/me').then(setMe).catch(()=>setMe(null));reloadS()},[])
 useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='en'?'ltr':'rtl';localStorage.setItem('nz_lang',lang)},[lang])
 const say=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3000)}
 const signOut=()=>{api('/auth/logout','POST',{}).finally(()=>{setMe(null);say('Signed out')})}
 return <C.Provider value={{lang,setLang,t:k=>(dict[lang]||en)[k]??en[k]??k,me,setMe,signOut,toast,say,S,reloadS}}>{children}</C.Provider>}
