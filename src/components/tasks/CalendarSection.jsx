import { useState, useRef, useEffect } from 'react'

const H0 = 8, H1 = 20, ROW_H = 46

function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function sundayOf(d) {
  const m = new Date(d); m.setHours(0, 0, 0, 0)
  const dow = m.getDay(); m.setDate(m.getDate() - dow); return m
}
function hourLabel(hf) {
  const h = Math.floor(hf), m = Math.round((hf - h) * 60)
  const ap = h < 12 ? 'AM' : 'PM'; let hh = h % 12; if (hh === 0) hh = 12
  return hh + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap
}
function hexAlpha(hex, a) {
  if (!hex || hex.startsWith('var')) return `rgba(136,136,136,${a})`
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
  return `rgba(${r},${g},${b},${a})`
}
function loadCal() {
  try { const r = localStorage.getItem('tt_cal_v1'); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveCal(evs) { try { localStorage.setItem('tt_cal_v1', JSON.stringify(evs)) } catch {} }

export default function CalendarSection({ categories }) {
  const [events,   setEvents]   = useState(loadCal)
  const [viewDate, setViewDate] = useState(new Date())
  const [adding,   setAdding]   = useState(false)
  const [form,     setForm]     = useState({ title:'', date: ymd(new Date()), start:9, end:10, kind:'task', catId:null })
  const evRef = useRef(events)
  useEffect(() => { evRef.current = events }, [events])

  const now = new Date()
  const sun = sundayOf(viewDate)
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const weekDays = DAY_NAMES.map((nm, i) => {
    const dt = new Date(sun); dt.setDate(sun.getDate() + i)
    return { nm, date: dt.getDate(), isToday: dt.toDateString() === now.toDateString(), dstr: ymd(dt) }
  })
  const last = new Date(sun); last.setDate(sun.getDate() + 6)
  const weekLabel = sun.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' → ' + last.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ', ' + sun.getFullYear()

  const hours = []; for (let h = H0; h < H1; h++) hours.push(h)
  const gridH = (H1 - H0) * ROW_H
  const timeOpts = []; for (let h = H0; h <= H1; h += 0.5) timeOpts.push({ v:h, l:hourLabel(h) })

  function persist(evs) { setEvents(evs); evRef.current = evs; saveCal(evs) }

  function addEvent() {
    const title = form.title.trim() || (form.kind === 'meeting' ? 'Meeting' : 'Task')
    const dur = Math.max(0.5, form.end - form.start)
    persist([...evRef.current, { id:'e'+Math.random().toString(36).slice(2,8), ...form, dur, title }])
    const parts = form.date.split('-')
    setViewDate(new Date(+parts[0], +parts[1]-1, +parts[2]))
    setForm(f => ({ ...f, title:'' })); setAdding(false)
  }

  function deleteEvent(id) { persist(evRef.current.filter(e => e.id !== id)) }

  function startResize(e, evId, dur, start) {
    e.stopPropagation(); e.preventDefault()
    const sy = e.clientY
    const move = (me) => {
      let nd = dur + (me.clientY - sy) / ROW_H
      nd = Math.max(0.5, Math.round(nd * 2) / 2); nd = Math.min(nd, H1 - start)
      const next = evRef.current.map(x => x.id === evId ? { ...x, dur: nd } : x)
      setEvents(next); evRef.current = next
    }
    const up = () => { saveCal(evRef.current); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }

  function clickCell(dstr, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    let h = H0 + (e.clientY - rect.top) / ROW_H
    h = Math.max(H0, Math.min(H1-1, Math.floor(h*2)/2))
    setForm(f => ({ ...f, date:dstr, start:h, end:Math.min(H1, h+1), catId: f.catId || categories[0]?.id || null }))
    setAdding(true)
  }

  function layoutDay(dstr) {
    const dayEvs = events.filter(ev => ev.date === dstr).slice().sort((a,b)=>a.start-b.start)
    const ends = []
    dayEvs.forEach(ev => {
      let placed = false
      for (let i = 0; i < ends.length; i++) {
        if (ends[i] <= ev.start + 0.001) { ev._col = i; ends[i] = ev.start + ev.dur; placed = true; break }
      }
      if (!placed) { ev._col = ends.length; ends.push(ev.start + ev.dur) }
    })
    return { dayEvs, n: Math.max(1, ends.length) }
  }

  const navBtn = { width:32, height:32, borderRadius:'var(--rsm)', border:'1px solid var(--line)', background:'var(--surface)', color:'var(--ink)', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, flexWrap:'wrap' }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:21, fontWeight:800, letterSpacing:'-.01em', color:'var(--ink)' }}>Schedule</h2>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button style={navBtn} onClick={() => { const d=new Date(viewDate); d.setMonth(d.getMonth()-1); setViewDate(d) }}>«</button>
          <button style={navBtn} onClick={() => { const d=new Date(viewDate); d.setDate(d.getDate()-7); setViewDate(d) }}>‹</button>
          <button onClick={() => setViewDate(new Date())} style={{ height:32, padding:'0 14px', borderRadius:'var(--rsm)', border:'1px solid var(--line)', background:'var(--surface)', color:'var(--ink)', fontSize:12.5, fontWeight:700, cursor:'pointer' }}>Today</button>
          <button style={navBtn} onClick={() => { const d=new Date(viewDate); d.setDate(d.getDate()+7); setViewDate(d) }}>›</button>
          <button style={navBtn} onClick={() => { const d=new Date(viewDate); d.setMonth(d.getMonth()+1); setViewDate(d) }}>»</button>
        </div>
        <span style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{weekLabel}</span>
        <div style={{ flex:1 }} />
        <button onClick={() => { setAdding(v=>!v); if (!form.catId && categories[0]) setForm(f=>({...f,catId:categories[0].id})) }}
          style={{ height:32, padding:'0 14px', borderRadius:'var(--rsm)', border:'none', background:'var(--accentGrad)', color:'#fff', fontSize:12.5, fontWeight:700, cursor:'pointer' }}>
          + Add to calendar
        </button>
      </div>

      {/* Add event form */}
      {adding && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:'18px 18px 16px', marginBottom:14, boxShadow:'var(--shadow)', animation:'pop .18s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Add an event…"
              style={{ flex:1, minWidth:200, border:'none', borderBottom:'1px solid var(--line)', background:'transparent', fontSize:19, fontWeight:700, color:'var(--ink)', outline:'none', paddingBottom:4 }} />
            <div style={{ display:'flex', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:999, padding:3 }}>
              {['task','meeting'].map(k => (
                <div key={k} onClick={()=>setForm(f=>({...f,kind:k}))} style={{ cursor:'pointer', padding:'7px 18px', borderRadius:999, fontSize:13, fontWeight:700, background: form.kind===k?'var(--accentGrad)':'transparent', color: form.kind===k?'#fff':'var(--muted)' }}>
                  {k[0].toUpperCase()+k.slice(1)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height:1, background:'var(--line)', margin:'14px 0' }} />
          <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <Pill label="When"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{ border:'none', background:'transparent', fontSize:13.5, fontWeight:600, color:'var(--ink)', outline:'none', cursor:'pointer' }} /></Pill>
            <Pill label="From">
              <select value={form.start} onChange={e=>setForm(f=>({...f,start:parseFloat(e.target.value)}))} style={{ border:'none', background:'transparent', fontSize:13.5, fontWeight:600, color:'var(--ink)', outline:'none', cursor:'pointer', appearance:'none', paddingRight:16 }}>
                {timeOpts.filter(o=>o.v < H1).map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Pill>
            <Pill label="To">
              <select value={form.end} onChange={e=>setForm(f=>({...f,end:parseFloat(e.target.value)}))} style={{ border:'none', background:'transparent', fontSize:13.5, fontWeight:600, color:'var(--ink)', outline:'none', cursor:'pointer', appearance:'none', paddingRight:16 }}>
                {timeOpts.filter(o=>o.v > form.start).map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Pill>
            {form.kind === 'task' && categories.length > 0 && (
              <Pill label="Category">
                <select value={form.catId||''} onChange={e=>setForm(f=>({...f,catId:e.target.value}))} style={{ border:'none', background:'transparent', fontSize:13.5, fontWeight:600, color:'var(--ink)', outline:'none', cursor:'pointer', appearance:'none', paddingRight:16 }}>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Pill>
            )}
            <div style={{ flex:1 }} />
            <button onClick={()=>setAdding(false)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, fontWeight:600, cursor:'pointer', padding:'8px 10px' }}>Cancel</button>
            <button onClick={addEvent} style={{ height:40, padding:'0 24px', borderRadius:999, border:'none', background:'var(--accentGrad)', color:'#fff', fontSize:13.5, fontWeight:700, cursor:'pointer' }}>Add event</button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:14, fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:10, flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:12,height:12,borderRadius:3,background:'#8b5cf6',opacity:.5,display:'inline-block' }}/>Task</span>
        <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:12,height:12,borderRadius:3,background:'var(--accentGrad)',display:'inline-block' }}/>Meeting</span>
        <span style={{ fontSize:11 }}>double-click a block to remove · drag lower edge to extend</span>
      </div>

      {/* Grid */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:14, boxShadow:'var(--shadow)', overflowX:'auto' }}>
        <div style={{ minWidth:680 }}>
          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'48px repeat(7,1fr)' }}>
            <div/>
            {weekDays.map((d,i) => (
              <div key={i} style={{ textAlign:'center', paddingBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)' }}>{d.nm}</div>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:'50%', fontSize:14, fontWeight:700, marginTop:3, color: d.isToday?'var(--surface)':'var(--ink)', background: d.isToday?'var(--ink)':'transparent' }}>{d.date}</div>
              </div>
            ))}
          </div>
          {/* Time grid */}
          <div style={{ display:'grid', gridTemplateColumns:'48px repeat(7,1fr)', position:'relative' }}>
            {/* Hour labels */}
            <div>
              {hours.map(h => (
                <div key={h} style={{ height:ROW_H, fontSize:10.5, fontWeight:600, color:'var(--muted)', textAlign:'right', paddingRight:8, transform:'translateY(-6px)' }}>{hourLabel(h)}</div>
              ))}
            </div>
            {/* Day columns */}
            {weekDays.map((d,i) => {
              const { dayEvs, n } = layoutDay(d.dstr)
              return (
                <div key={i} onClick={e=>clickCell(d.dstr,e)} style={{ position:'relative', borderLeft:'1px solid var(--line)', height:gridH, cursor:'copy' }}>
                  {hours.map((_,hi) => (
                    <div key={hi} style={{ position:'absolute', left:0, right:0, top:hi*ROW_H, borderTop:'1px solid var(--line)', opacity:.5 }} />
                  ))}
                  {dayEvs.map(ev => {
                    const cat = ev.catId ? categories.find(c=>c.id===ev.catId) : null
                    const isTask = ev.kind === 'task'
                    const w = 100/n, gap = 1.5
                    return (
                      <div key={ev.id}
                        onDoubleClick={e=>{e.stopPropagation(); deleteEvent(ev.id)}}
                        onClick={e=>e.stopPropagation()}
                        style={{ position:'absolute', top:(ev.start-H0)*ROW_H, height:Math.max(20,ev.dur*ROW_H-3), left:`${ev._col*w+0.5}%`, width:`${w-gap}%`, padding:'5px 7px', borderRadius:7, overflow:'hidden', background: isTask?hexAlpha(cat?.color||'#8b5cf6',0.16):'var(--accentGrad)', borderLeft: isTask?`3px solid ${cat?.color||'#8b5cf6'}`:'3px solid transparent', boxShadow:'0 1px 2px rgba(0,0,0,.06)' }}>
                        <div style={{ fontSize:10, fontWeight:600, lineHeight:1.2, color: isTask?(cat?.color||'#8b5cf6'):'rgba(255,255,255,.7)' }}>{hourLabel(ev.start)}</div>
                        <div style={{ fontSize:11.5, fontWeight:700, lineHeight:1.25, marginTop:1, color: isTask?'var(--ink)':'#fff' }}>{ev.title}</div>
                        <div onMouseDown={e=>startResize(e,ev.id,ev.dur,ev.start)} style={{ position:'absolute', left:0, right:0, bottom:0, height:8, cursor:'ns-resize' }} />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Pill({ label, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 2px' }}>
      <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--muted)' }}>{label}</span>
      {children}
    </div>
  )
}
