import {Link} from 'react-router-dom';import {money} from '../api'
export const pct=(o:any)=>o.target>0?Math.min(100,Math.round(o.raised/o.target*100)):0
export function Thumb({o,big}:{o:any;big?:boolean}){return <div className={big?'thumb big':'thumb'} style={o.image?{backgroundImage:`url(${o.image})`}:undefined} role={o.image?'img':undefined} aria-label={o.image?o.title:undefined}>{!o.image&&<span>{o.category[0]}</span>}{o.sample&&<em className="tag">Sample record</em>}</div>}
export function Bar({o}:{o:any}){return <div><div className="bar"><i style={{width:pct(o)+'%'}}/></div><small>Verified funding: {money(o.raised)} of {money(o.target)} ({pct(o)}%)</small></div>}
export default function OppCard({o}:{o:any}){
 return <article className="card"><Thumb o={o}/><div className="cb"><small className="eyebrow">{o.category}</small><h3>{o.title}</h3><p className="clamp">{o.description}</p><Bar o={o}/>
 <dl><dt>Target</dt><dd>{money(o.target)}</dd><dt>Minimum</dt><dd>{money(o.min)}</dd><dt>Funding</dt><dd>{o.arrangement==='single'?'One investor funds the full amount':'Multiple investors'}</dd><dt>Structure</dt><dd>{o.structure||'—'}</dd><dt>Status</dt><dd><b className="pill">{o.status}</b></dd></dl>
 <div className="row"><Link className="btn" to={'/explore/'+o.id}>View Details</Link><Link className="btn ghost" to={'/explore/'+o.id+'#interest'}>Express Interest</Link></div></div></article>}
