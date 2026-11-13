import {useState} from 'react';import {smeFee,effectiveRate,realEstate,MIN_CONTRACT} from '../utils/pricing'
const num=(s:string)=>s.trim()===''?NaN:Number(s)
export default function Pricing(){const [a,setA]=useState('10000'),[b,setB]=useState('150000'),[n,setN]=useState('5'),[p,setP]=useState('5')
 const A=num(a),aOk=A>=MIN_CONTRACT&&isFinite(A),B=num(b),N=num(n),P=num(p),rOk=B>0&&N>=1&&Number.isInteger(N)&&P>=0&&P<=100
 const r=rOk?realEstate(B,N,P):null
 return <section className="sec narrow"><h1>Fees & Pricing</h1><p className="note">Business-plan proposal; must be confirmed before operations.</p>
 <div className="panel"><h2>SME / saver contract fee</h2><label>Contract amount (USD, min ${MIN_CONTRACT})<input inputMode="decimal" value={a} onChange={e=>setA(e.target.value)} aria-invalid={!aOk}/></label>
 {aOk?<p><b>Fee: ${smeFee(A).toFixed(2)}</b> · effective {effectiveRate(A).toFixed(2)}% · {A<3000?'under $3,000: fixed $200':'$200 + 2.5% of $'+A.toLocaleString()}</p>:<p className="err" role="alert">Enter an amount of at least ${MIN_CONTRACT}.</p>}</div>
 <div className="panel"><h2>Real estate illustration</h2><label>Total project budget<input value={b} onChange={e=>setB(e.target.value)}/></label><label>Participants (whole number)<input value={n} onChange={e=>setN(e.target.value)}/></label><label>Fee %<input value={p} onChange={e=>setP(e.target.value)}/></label>
 {r?<p>Contribution each: ${r.each.toLocaleString()} · Nazar fee each: ${r.fee.toLocaleString()} · Total fee: ${r.total.toLocaleString()}<br/><small>The fee is Nazar’s facilitation fee, separate from the project contribution.</small></p>:<p className="err" role="alert">Enter a positive budget, a whole number of participants, and a fee between 0 and 100.</p>}</div></section>}
