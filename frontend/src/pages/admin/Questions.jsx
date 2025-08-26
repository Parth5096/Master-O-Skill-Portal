import { useEffect, useState } from "react";
import { SkillAPI, QuestionAPI } from "../../api/client";

function OptionRow({opt, onChange, onRemove}) {
  return (
    <div className="row" style={{alignItems:"center"}}>
      <div style={{flex:"0 0 80px"}}>
        <label>Pos</label>
        <input type="number" value={opt.position} onChange={e=>onChange({...opt, position:Number(e.target.value)})}/>
      </div>
      <div style={{flex:1}}>
        <label>Text</label>
        <input value={opt.optionText} onChange={e=>onChange({...opt, optionText:e.target.value})}/>
      </div>
      <div style={{flex:"0 0 120px"}}>
        <label>Correct?</label>
        <select value={String(opt.isCorrect)} onChange={e=>onChange({...opt, isCorrect:e.target.value==="true"})}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>
      <div><button className="btn danger" onClick={onRemove}>Remove</button></div>
    </div>
  );
}

export default function Questions() {
  const [skills, setSkills] = useState([]);
  const [skillId, setSkillId] = useState("");
  const [list, setList] = useState([]);
  const [qText, setQText] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState([
    { position:1, optionText:"", isCorrect:false },
    { position:2, optionText:"", isCorrect:true }
  ]);
  const [err, setErr] = useState("");

  useEffect(() => { SkillAPI.list("?page=1&limit=100").then(r => setSkills(r.data || [])); }, []);
  useEffect(() => { if(skillId) load(); }, [skillId]);

  async function load() {
    const r = await QuestionAPI.list(`?skillId=${skillId}&page=1&limit=50`);
    setList(r.data || []);
  }

  function addOption() { setOptions([...options, { position: options.length+1, optionText:"", isCorrect:false }]); }
  function updateOpt(i, newOpt) { const arr = [...options]; arr[i] = newOpt; setOptions(arr); }
  function removeOpt(i) { setOptions(options.filter((_,idx)=>idx!==i)); }
  function ensureOneCorrect(arr) { return arr.filter(o=>o.isCorrect).length === 1; }

  async function createQuestion() {
    setErr("");
    try {
      if (!skillId || !qText) throw new Error("Skill and question text required");
      if (!ensureOneCorrect(options)) throw new Error("Exactly one option must be marked correct");
      const payload = { skillId: Number(skillId), questionText: qText, difficulty, explanation, options };
      await QuestionAPI.create(payload);
      setQText(""); setExplanation(""); setOptions([{position:1, optionText:"", isCorrect:false}, {position:2, optionText:"", isCorrect:true}]);
      await load();
      alert("Question created");
    } catch (e) { setErr(e.message || "Failed to create"); }
  }

  async function del(id) { if (!confirm("Delete this question?")) return; await QuestionAPI.remove(id); await load(); }
  async function quickEdit(id) {
    const newText = prompt("New question text?"); if (!newText) return;
    await QuestionAPI.update(id, { questionText: newText }); await load();
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Manage Questions</h3>
        <div className="row">
          <div style={{flex:"0 0 280px"}}>
            <label>Skill</label>
            <select value={skillId} onChange={e=>setSkillId(e.target.value)}>
              <option value="">-- Select --</option>
              {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {skillId && (
        <div className="row" style={{marginTop:12}}>
          <div className="card" style={{flex:"2 1 480px"}}>
            <h4>Existing Questions</h4>
            <table>
              <thead><tr><th>ID</th><th>Question</th><th>Difficulty</th><th>Actions</th></tr></thead>
              <tbody>
                {list.map(q => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td>{q.questionText}</td>
                    <td><span className="badge">{q.difficulty}</span></td>
                    <td>
                      <button className="btn secondary" onClick={()=>quickEdit(q.id)}>Edit</button>{" "}
                      <button className="btn danger" onClick={()=>del(q.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{flex:"1 1 360px"}}>
            <h4>Add Question</h4>
            <div><label>Question text</label><textarea rows={3} value={qText} onChange={e=>setQText(e.target.value)} /></div>
            <div className="row">
              <div style={{flex:1}}>
                <label>Difficulty</label>
                <select value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </div>
            </div>
            <div><label>Explanation (optional)</label><textarea rows={2} value={explanation} onChange={e=>setExplanation(e.target.value)} /></div>
            <div><label>Options</label></div>
            {options.map((o,i)=>(
              <OptionRow key={i} opt={o} onChange={v=>updateOpt(i,v)} onRemove={()=>removeOpt(i)} />
            ))}
            <div className="row" style={{justifyContent:"space-between", marginTop:8}}>
              <button className="btn secondary" onClick={addOption}>+ Add option</button>
              {err && <div className="small" style={{color:"#ef4444"}}>{err}</div>}
              <button className="btn" onClick={createQuestion}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
