import { useEffect, useState } from "react";
import { SkillAPI, AttemptAPI } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const [skills, setSkills] = useState([]);
  const [selected, setSelected] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    SkillAPI.list("?page=1&limit=100").then(r => setSkills(r.data || [])).catch(e => setErr(e.message));
    refreshAttempts();
  }, []);

  function refreshAttempts() {
    AttemptAPI.list("?status=submitted&page=1&limit=20").then(r => setAttempts(r.data || [])).catch(()=>{});
  }

  async function startQuiz() {
    setErr("");
    if (!selected) { setErr("Select a skill first"); return; }
    try {
      const res = await AttemptAPI.start({ skillId: Number(selected) });
      nav(`/quiz/${res.data.id}?skillId=${selected}`);
    } catch (e) { setErr(e.message || "Unable to start quiz"); }
  }

  return (
    <div className="container">
      <div className="row">
        <div className="card" style={{flex:"1 1 400px"}}>
          <h3>Take a quiz</h3>
          <div><label>Skill</label>
            <select value={selected} onChange={e=>setSelected(e.target.value)}>
              <option value="">-- Select --</option>
              {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {err && <div className="small" style={{color:"#ef4444"}}>{err}</div>}
          <button className="btn" onClick={startQuiz}>Start</button>
        </div>

        <div className="card" style={{flex:"3 1 500px"}}>
          <h3>Past performance</h3>
          <table>
            <thead><tr><th>Skill</th><th>Score %</th><th>Submitted</th></tr></thead>
            <tbody>
              {attempts.map(a => (
                <tr key={a.id}>
                  <td>{a.skill?.name || a.skillId}</td>
                  <td>{Number(a.scorePercent)}</td>
                  <td>{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="small">Tip: take more quizzes to improve your skill averages.</div>
        </div>
      </div>
    </div>
  );
}
