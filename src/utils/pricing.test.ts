import {smeFee,realEstate} from './pricing'
const eq=(a:number,b:number)=>{if(Math.abs(a-b)>1e-9)throw new Error(`${a}!=${b}`)}
eq(smeFee(1500),200);eq(smeFee(3000),275);eq(smeFee(10000),450)
const r=realEstate(150000,5,5);eq(r.each,30000);eq(r.fee,1500);eq(r.total,7500)
console.log('pricing tests passed')
