import { useEffect, useMemo, useState } from "react";
import { UserAPI, ReportAPI } from "../../api/client";
import BarChart from "../../components/BarChart";

export default function Reports() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [perf, setPerf] = useState([]);
  const [gap, setGap] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => { UserAPI.list("?page=1&limit=50").then(r => setUsers(r.data || [])); }, []);
  useEffect(() => {
    if (!userId) { setPerf([]); setGap([]); setSummary(null); return; }
    ReportAPI.userPerformance(`?userId=${userId}`).then(r => setPerf(r.data || []));
    ReportAPI.skillGap(`?userId=${userId}`).then(r => setGap(r.data || []));
    ReportAPI.time(`?period=week&userId=${userId}`).then(r => setSummary(r.summary || null));
  }, [userId]);

  const chartData = useMemo(() => (perf || []).map(p => ({ label: p.skillName || p.skillId, value: p.avgScorePercent })), [perf]);

  return (
    <div className="container">
      <div className="card">
        <h3>User Reports</h3>
        <div style={{maxWidth:320}}>
          <label>User</label>
          <select value={userId} onChange={e=>setUserId(e.target.value)}>
            <option value="">-- Select user --</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
          </select>
        </div>
      </div>

      {userId && (
        <>
          <div className="row" style={{marginTop:12}}>
            <div className="card" style={{flex:"2 1 520px"}}>
              <h4>Average score by skill</h4>
              <BarChart data={chartData} />
            </div>
            <div className="card" style={{flex:"1 1 320px"}}>
              <h4>Last week summary</h4>
              {!summary ? <div className="small">Loading…</div> : (
                <ul>
                  <li>Attempts: <b>{summary.attempts}</b></li>
                  <li>Avg Score %: <b>{Math.round(summary.avgScorePercent)}</b></li>
                </ul>
              )}
              <div className="small">Time window: last 7 days</div>
            </div>
          </div>

          <div className="card" style={{marginTop:12}}>
            <h4>Performance table</h4>
            <table>
              <thead><tr><th>Skill</th><th>Attempts</th><th>Avg %</th><th>Total Correct</th><th>Total Questions</th></tr></thead>
              <tbody>
                {perf.map(p => (
                  <tr key={p.skillId}>
                    <td>{p.skillName || p.skillId}</td>
                    <td>{p.attempts}</td>
                    <td>{Math.round(p.avgScorePercent)}</td>
                    <td>{p.totalCorrect}</td>
                    <td>{p.totalQuestions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{marginTop:12}}>
            <h4>Skill gaps (lowest avg first)</h4>
            <table>
              <thead><tr><th>Skill</th><th>Avg %</th></tr></thead>
              <tbody>
                {gap.map(g => (
                  <tr key={g.skillId}>
                    <td>{g.skillName || g.skillId}</td>
                    <td>{Math.round(g.avgScorePercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
