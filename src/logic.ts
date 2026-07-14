import type { Level, ModuleId, Quality, Segment, TopicPack } from './types';
import { metadata } from './data';

const cap = (s:string) => s.charAt(0).toUpperCase() + s.slice(1);
export function composeSegments(topic:TopicPack, active:ModuleId[]):Segment[] {
  const on=(id:ModuleId)=>active.includes(id); const s:Segment[]=[];
  if(on('contrast')) s.push({id:'contrast',label:'CONTRAST',text:topic.concession+', '});
  if(on('stance')) s.push({id:'stance',label:'POSITION',text:topic.stance+(topic.stance.endsWith(',')?' ':on('hedge')?', ':' ')});
  if(on('hedge')) s.push({id:'hedge',label:'POSITION',text:(on('stance')?topic.hedge:cap(topic.hedge))+', '});
  const subject=on('precision')?topic.preciseSubject:topic.basicSubject;
  const shouldCap=!on('contrast')&&!on('stance')&&!on('hedge');
  s.push({id:on('precision')?'precision':'claim',label:on('precision')?'PRECISION':'CLAIM',text:(shouldCap?cap(subject):subject)+' '+topic.predicate});
  if(on('reason')) s.push({id:'reason',label:'REASON',text:' '+topic.reason});
  if(on('consequence')) s.push({id:'consequence',label:'CONSEQUENCE',text:', '+topic.consequence});
  s[s.length-1].text=s[s.length-1].text.replace(/[.!?]?$/,'.');
  if(on('example')) s.push({id:'example',label:'EXAMPLE',text:topic.example,breakBefore:true});
  if(on('counterargument')) s.push({id:'counterargument',label:'COUNTERARGUMENT',text:topic.counterargument,breakBefore:true});
  if(on('rebuttal')) s.push({id:'rebuttal',label:'REBUTTAL',text:topic.rebuttal,breakBefore:true});
  if(on('conclusion')) s.push({id:'conclusion',label:'CONCLUSION',text:topic.conclusion,breakBefore:true});
  return s;
}
export const plainAnswer=(topic:TopicPack,active:ModuleId[])=>composeSegments(topic,active).map((x,i)=>`${x.breakBefore&&i?'\n\n':''}${x.text}`).join('').replace(/\s+([,.!?])/g,'$1');
export const points=(active:ModuleId[])=>2+active.reduce((n,id)=>n+metadata[id].weight,0);
export function levelFromPoints(n:number):Level { return n<=2?'A1':n<=5?'A2':n<=9?'B1':n<=15?'B2':'C1'; }
export function quality(active:ModuleId[]):Quality {
  const q:Quality={specificity:1,logic:1,support:0,nuance:0};
  const add:Record<ModuleId,Partial<Quality>>={stance:{logic:1},precision:{specificity:3},hedge:{nuance:2},reason:{logic:2},consequence:{logic:2,nuance:1},example:{support:3},contrast:{nuance:3},counterargument:{nuance:2,support:1},rebuttal:{logic:2,nuance:2},conclusion:{logic:1}};
  active.forEach(id=>Object.entries(add[id]).forEach(([k,v])=>q[k as keyof Quality]=Math.min(5,q[k as keyof Quality]+(v??0)))); return q;
}
