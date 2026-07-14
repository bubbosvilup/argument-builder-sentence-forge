import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { challenges, metadata, moduleOrder, topics } from './data';
import { composeSegments, italianAnswer, levelFromPoints, plainAnswer, points, quality } from './logic';
import type { ModuleId } from './types';

const groups = ['Clarify the opinion','Develop the logic','Support the argument','Add complexity','Complete the response'];
const anatomyPrompts:Record<string,string>={stance:'Position',precision:'Precise claim',hedge:'Limit / nuance',reason:'Main reason',consequence:'Consequence',example:'Example',contrast:'Other side',counterargument:'Opposite view',rebuttal:'Your response',conclusion:'Conclusion'};

function App(){
  const saved=(()=>{try{return JSON.parse(localStorage.getItem('sentence-forge')||'{}') as {topicId?:string;active?:ModuleId[]}}catch{return {}}})();
  const [topicId,setTopicId]=useState(saved.topicId&&topics.some(t=>t.id===saved.topicId)?saved.topicId:topics[0].id);
  const [active,setActive]=useState<ModuleId[]>(saved.active?.filter(x=>moduleOrder.includes(x))||[]);
  const [history,setHistory]=useState<ModuleId[][]>([]); const [previous,setPrevious]=useState('');
  const [changed,setChanged]=useState<ModuleId|null>(null); const [anatomy,setAnatomy]=useState(false); const [teacher,setTeacher]=useState(false);
  const [compare,setCompare]=useState(false); const [hidden,setHidden]=useState(false); const [challengeIndex,setChallengeIndex]=useState<number|null>(null);
  const [showItalian,setShowItalian]=useState(true);
  const [notice,setNotice]=useState(''); const [dragging,setDragging]=useState<ModuleId|null>(null);
  const topic=topics.find(t=>t.id===topicId)!; const answer=useMemo(()=>plainAnswer(topic,active),[topic,active]);
  const score=points(active); const level=levelFromPoints(score); const meters=quality(active); const words=answer.trim().split(/\s+/).length;
  const segments=composeSegments(topic,active); const challenge=challengeIndex===null?null:challenges[challengeIndex];
  const success=challenge?.test(active,score,words)??false;
  useEffect(()=>localStorage.setItem('sentence-forge',JSON.stringify({topicId,active})),[topicId,active]);
  useEffect(()=>{if(!changed)return;const t=setTimeout(()=>setChanged(null),900);return()=>clearTimeout(t)},[changed]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),1800);return()=>clearTimeout(t)},[notice]);

  const toggle=(id:ModuleId)=>{setPrevious(answer);setHistory(h=>[...h,active]);setActive(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id]);setChanged(id);setHidden(false)};
  const switchTopic=(id:string)=>{setPrevious('');setHistory([]);setActive([]);setTopicId(id);setChanged(null);setHidden(false)};
  const undo=()=>{if(!history.length)return;setPrevious(answer);setActive(history[history.length-1]);setHistory(h=>h.slice(0,-1));setChanged(null)};
  const reset=()=>{if(!active.length)return;setPrevious(answer);setHistory(h=>[...h,active]);setActive([]);setChanged(null);setHidden(false)};
  const copy=async()=>{try{await navigator.clipboard.writeText(answer);setNotice('Answer copied')}catch{setNotice('Copy unavailable')}};
  const speak=()=>{if(!('speechSynthesis'in window)){setNotice('Read aloud is not supported here');return} speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(answer);u.lang='en-GB';u.rate=.88;speechSynthesis.speak(u);setNotice('Reading aloud…')};
  const drop=(e:DragEvent)=>{e.preventDefault();if(dragging&&!active.includes(dragging))toggle(dragging);setDragging(null)};
  const randomTopic=()=>{const options=topics.filter(t=>t.id!==topicId);switchTopic(options[Math.floor(Math.random()*options.length)].id)};
  const startChallenge=()=>setChallengeIndex(i=>i===null?0:(i+1)%challenges.length);
  const featureNames=active.map(id=>metadata[id].name.toLowerCase());

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true"><span>AB</span></div>
      <div className="brand-copy"><p className="eyebrow">Sentence forge · Per Gianluca</p><h1>Argument Builder</h1><p>Build a stronger argument one piece at a time.</p></div>
      <div className="level-wrap" aria-live="polite"><span className="level-label">Estimated level</span><strong key={level} className={`level-badge level-${level.toLowerCase()}`}>{level}</strong><small>Practice estimate</small></div>
    </header>

    <main>
      <section className="topic-strip" aria-labelledby="topic-heading"><div><span className="step">01</span><div><p className="kicker" id="topic-heading">Choose a discussion</p><h2>{topic.question}</h2><p className="topic-translation">{topic.italian.question}</p></div></div><label><span>Topic</span><select value={topicId} onChange={e=>switchTopic(e.target.value)}>{topics.map((t,i)=><option value={t.id} key={t.id}>{String(i+1).padStart(2,'0')} · {t.title}</option>)}</select></label></section>

      <div className="layout">
        <div className="primary-column">
          <section className={`workspace ${dragging?'is-dragging':''}`} onDragOver={e=>e.preventDefault()} onDrop={drop} aria-labelledby="answer-heading">
            <div className="section-head"><div><p className="kicker"><span className="status-dot"/>Live build</p><h2 id="answer-heading">Current answer</h2></div><div className="workspace-toggles"><Toggle label="Traduzione italiana" checked={showItalian} onChange={setShowItalian}/><Toggle label="Sentence anatomy" checked={anatomy} onChange={setAnatomy}/><Toggle label="Teacher mode" checked={teacher} onChange={setTeacher}/></div></div>
            <div className="drop-hint" aria-hidden={!dragging}>Drop the language module here</div>
            {hidden?<div className="prompt-grid" aria-label="Speaking prompts">{['Position','Main reason','Consequence','Example','Opposite view','Your response','Conclusion'].filter((_,i)=>i===0||active.length>i-1).map(p=><span key={p}>{p}</span>)}</div>:
            <div className="answer-text" aria-live="polite">{segments.map((s,i)=><span key={`${s.id}-${i}`} className={`${s.breakBefore?'new-line ':''}segment segment-${s.id} ${s.id===changed?'just-added':''}`}>{anatomy&&<small>{s.label}</small>}{s.text}</span>)}</div>}
            {showItalian&&!hidden&&<div className="answer-translation"><span>Traduzione italiana</span><p>{italianAnswer(topic,active)}</p></div>}
            <p className="core-note">Core idea: <strong>{topic.basicSubject.charAt(0).toUpperCase()+topic.basicSubject.slice(1)} {topic.predicate}.</strong><small>{topic.italian.basicSubject.charAt(0).toUpperCase()+topic.italian.basicSubject.slice(1)} {topic.italian.predicate}.</small></p>
            {previous&&<div className="change-panel"><div><span className="change-icon">↗</span><div><strong>{changed?`${metadata[changed].name} ${active.includes(changed)?'added':'removed'}`:'Previous version restored'}</strong><p>{changed&&active.includes(changed)?metadata[changed].explanation:'La struttura della frase è stata aggiornata.'}</p></div></div><details><summary>See previous version</summary><p>{previous}</p></details></div>}
          </section>

          <section className="controls" aria-label="Answer controls">
            <button onClick={undo} disabled={!history.length} title="Undo last change">↶ <span>Undo</span></button><button onClick={reset} disabled={!active.length}>↺ <span>Reset</span></button><button onClick={randomTopic}>⌁ <span>Random topic</span></button><button onClick={()=>setCompare(v=>!v)} className={compare?'selected':''}>◫ <span>Compare</span></button><button onClick={copy}>□ <span>Copy answer</span></button><button onClick={speak}>▶ <span>Read aloud</span></button><button onClick={startChallenge} className={challenge?'selected':''}>◎ <span>{challenge?'Next challenge':'Start challenge'}</span></button>
          </section>

          {compare&&<section className="comparison" aria-labelledby="compare-title"><div className="section-head"><div><p className="kicker">Before & after</p><h2 id="compare-title">Basic vs expanded</h2></div><button className="icon-button" onClick={()=>setCompare(false)} aria-label="Close comparison">×</button></div><div className="comparison-grid"><article><span>Basic · A2</span><p>{plainAnswer(topic,[])}</p><small>{italianAnswer(topic,[])}</small></article><article className="expanded"><span>Expanded · {level}</span><p>{segments.map((s,i)=><mark key={i} className={s.id==='claim'?'plain':''}>{s.breakBefore&&<><br/><br/></>}{s.text}</mark>)}</p><small>{italianAnswer(topic,active)}</small></article></div></section>}

          {teacher&&<TeacherPanel active={active} selected={changed||active.at(-1)||null}/>}
        </div>

        <aside className="side-column">
          <section className="level-card"><div className="level-card-top"><div><p className="kicker">Complexity range</p><h2>{level} argument</h2></div><strong>{score}<small> pts</small></strong></div><div className="level-track"><span style={{width:`${Math.min(100,score/35*100)}%`}}/></div><div className="level-labels"><span>A1</span><span>A2</span><span>B1</span><span>B2</span><span>C1</span></div><p>{featureNames.length?`${level} features: ${featureNames.join(', ')}.`:'La frase base parte da A2; aggiungi funzioni linguistiche per raggiungere B1, B2 e C1.'}</p><small>Stima orientativa basata su lessico, grammatica e funzioni comunicative; non è una certificazione CEFR.</small></section>
          <QualityMeters values={meters}/>
          {challenge&&<section className={`challenge-card ${success?'complete':''}`} aria-live="polite"><p className="kicker">Active challenge · {challengeIndex!+1}/{challenges.length}</p><h2>{success?'Challenge complete':challenge.name}</h2><p>{challenge.description}</p><div className="challenge-status"><span>{success?'✓':'○'}</span>{success?'Target reached — ready for the next one.':'Keep building in the module tray.'}</div></section>}
        </aside>
      </div>

      <section className="tray" aria-labelledby="tray-title"><div className="tray-title"><div><span className="step">02</span><div><p className="kicker">Language modules</p><h2 id="tray-title">Choose the next piece</h2></div></div><p>Drag a card to the answer or tap to add. Tap an active card to remove it.</p></div>
        {groups.map(group=><div className="module-group" key={group}><h3>{group}</h3><div className="module-grid">{moduleOrder.filter(id=>metadata[id].category===group).map(id=><ModuleCard key={id} id={id} topic={topic} active={active.includes(id)} onToggle={toggle} onDrag={setDragging}/>)}</div></div>)}
      </section>

      {active.length>=5&&<section className="speaking"><div><p className="kicker">Final speaking stage</p><h2>Your argument is ready to speak.</h2><p>Use the full text once, then hide it and rebuild the idea from prompts.</p></div><div className="speech-stats"><span><strong>{words}</strong> words</span><span><strong>~{Math.max(1,Math.ceil(words/120))}</strong> min</span><span><strong>{active.length}</strong> features</span></div><div className="speech-actions"><button className="primary" onClick={speak}>▶ Read aloud</button><button onClick={copy}>Copy answer</button><button onClick={()=>setHidden(v=>!v)}>{hidden?'Show text':'Hide text'}</button></div></section>}
    </main>
    <footer><div><strong>Argument Builder</strong><span>Creato da Nicco per Gianluca.</span></div><p>Start clear. Add one useful function. Speak with structure.</p></footer>
    {notice&&<div className="toast" role="status">{notice}</div>}
  </div>
}

function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <label className="toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><i aria-hidden="true"/></label>}
function ModuleCard({id,topic,active,onToggle,onDrag}:{id:ModuleId;topic:(typeof topics)[number];active:boolean;onToggle:(id:ModuleId)=>void;onDrag:(id:ModuleId|null)=>void}){const m=metadata[id];const fragment=id==='precision'?topic.preciseSubject:id==='contrast'?topic.concession:topic[id];const translation=id==='precision'?topic.italian.preciseSubject:id==='contrast'?topic.italian.concession:topic.italian[id];return <button className={`module-card ${active?'active':''}`} onClick={()=>onToggle(id)} draggable onDragStart={e=>{e.dataTransfer.effectAllowed='copy';onDrag(id)}} onDragEnd={()=>onDrag(null)} aria-pressed={active}><span className="module-top"><b>{m.name}</b><em>{active?'✓ Active':m.level}</em></span><q>{fragment}</q><span className="fragment-translation">{translation}</span><small>{m.explanation}</small><span className="module-action">{active?'Remove module':'＋ Add module'}</span></button>}
function QualityMeters({values}:{values:ReturnType<typeof quality>}){return <section className="quality-card"><div><p className="kicker">Argument quality</p><h2>Four dimensions</h2></div>{(Object.keys(values) as (keyof typeof values)[]).map(k=><div className="meter" key={k}><div><span>{k}</span><b>{values[k]}/5</b></div><div className="meter-track" aria-label={`${k} ${values[k]} out of 5`}>{[1,2,3,4,5].map(n=><i key={n} className={n<=values[k]?'filled':''}/>)}</div></div>)}</section>}
function TeacherPanel({active,selected}:{active:ModuleId[];selected:ModuleId|null}){const id=selected&&active.includes(selected)?selected:active.at(-1);if(!id)return <section className="teacher-panel"><p className="kicker">Teacher mode</p><h2>Add a module to reveal teaching notes.</h2></section>;const m=metadata[id];return <section className="teacher-panel"><div className="section-head"><div><p className="kicker">Teacher mode · {m.level}</p><h2>{m.name}</h2></div><span className="teacher-badge">Teaching notes</span></div><div className="teacher-grid"><div><span>Spiegazione in italiano</span><p>{m.explanation}</p></div><div><span>Grammar structure</span><p>{m.grammar}</p></div><div><span>Follow-up question</span><p>{m.followUp}</p></div><div><span>Correction task</span><p>{m.correction}</p></div></div></section>}

export default App;
