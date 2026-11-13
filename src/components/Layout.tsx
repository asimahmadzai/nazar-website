import {useState} from 'react';import {Link,NavLink,Outlet} from 'react-router-dom';import {useApp} from '../store'
const P:Record<string,JSX.Element>={Facebook:<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z"/>,Instagram:<><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.3"/></>,TikTok:<path d="M16 3c.3 2.4 1.8 4 4 4.2v3.2c-1.5 0-2.9-.5-4-1.3V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.3a2.8 2.8 0 1 0 1.8 2.6V3H16z"/>}
function Social({name,url}:{name:string;url?:string}){const on=/^https?:\/\//.test(url||''),svg=<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">{P[name]}</svg>
 return on?<a className="soc" href={url} target="_blank" rel="noopener noreferrer" aria-label={'Nazar on '+name}>{svg}</a>:<span className="soc off" title={name+' link not set yet (Admin → Settings)'} aria-label={name+' (link not set)'}>{svg}</span>}
export default function Layout(){const {lang,setLang,me,signOut,toast,S,t}=useApp();const [open,setOpen]=useState(false);const c=()=>setOpen(false)
  return <>
 <header className="hdr"><Link to="/" aria-label="Nazar home"><img src="/logo.png" alt="Nazar — Your Vision, Your Investment" className="logo"/></Link>
  <button className="menu" aria-expanded={open} onClick={()=>setOpen(!open)}>☰ Menu</button>
  <nav className={open?'nav open':'nav'} aria-label="Main"><NavLink end to="/" onClick={c}>Home</NavLink><NavLink to="/explore" onClick={c}>Investment Opportunities</NavLink><NavLink to="/how-it-works" onClick={c}>How It Works</NavLink><NavLink to="/about" onClick={c}>About Us</NavLink><NavLink to="/contact" onClick={c}>Contact Us</NavLink>
  {me?<>{me.role==='admin'?<Link to="/admin" onClick={c}>Admin Panel</Link>:<Link to="/dashboard" onClick={c}>My Dashboard</Link>}<button className="btn ghost" onClick={()=>{c();signOut()}}>Sign out</button></>:<><Link to="/signin" onClick={c}>{t('signin')}</Link><Link className="btn" to="/signup" onClick={c}>Create Account</Link></>}
  <select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value)}><option value="en">English</option><option value="fa">دری (draft)</option><option value="ps">پښتو (draft)</option></select></nav></header>
 <main><Outlet/></main>
 <footer className="ftr"><div className="fgrid"><div className="fbrand"><img src="/logo-dark.png" alt="Nazar logo" className="flogo"/><p>Nazar connects investors with Afghan businesses through transparent, Shariah-oriented investment structures.</p>
  <div className="socials"><Social name="Facebook" url={S.facebook}/><Social name="Instagram" url={S.instagram}/><Social name="TikTok" url={S.tiktok}/></div></div>
  <div><h4>Quick links</h4>{[['/','Home'],['/explore','Investment Opportunities'],['/how-it-works','How It Works'],['/about','About Us'],['/contact','Contact Us'],[me?(me.role==='admin'?'/admin':'/dashboard'):'/signin',me?'Dashboard':'Sign In']].map(([p,l])=><Link key={l} to={p}>{l}</Link>)}</div>
  <div><h4>Contact</h4><p className="fc">{S.office_address&&<span>{S.office_address}</span>}{S.email&&<a href={'mailto:'+S.email}>{S.email}</a>}{S.phone&&<span>{S.phone}</span>}{S.hours&&<span>{S.hours}</span>}</p></div>
  <div><h4>Legal</h4><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms and Conditions</Link><Link to="/risk">Risk Disclosure</Link><Link to="/pricing">Fees</Link></div></div>
  <div className="fbottom"><p className="risk">{t('risk')}</p><p>© {new Date().getFullYear()} Nazar. All rights reserved.</p></div></footer>
 {toast&&<div className="toast" role="status">{toast}</div>}</>}
