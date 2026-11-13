import {pages} from '../data/content'
export default function Info({slug}:{slug:string}){const p=pages[slug]
 return <section className="sec narrow"><h1>{p.title}</h1><p>{p.intro}</p>{p.items.map(([h,b])=><details key={h} open={slug!=='faq'}><summary>{h}</summary><p>{b}</p></details>)}</section>}
