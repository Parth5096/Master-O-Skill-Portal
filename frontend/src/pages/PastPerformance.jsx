import { useEffect, useState } from "react";
import { AttemptAPI } from "../api/client";

export default function PastPerformance() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    AttemptAPI.list("?status=submitted&page=1&limit=50")
      .then(r => setRows(r.data || []))
      .catch(()=>{});
  }, []);
  return (
    <div className="container">
      <div className="card">
        <h3>Past Attempts</h3>
        <table>
          <thead><tr><th>Skill</th><th>Score %</th><th>Submitted</th></tr></thead>
          <tbody>
            {rows.map(a => (
              <tr key={a.id}>
                <td>{a.skill?.name}</td>
                <td>{Number(a.scorePercent)}</td>
                <td>{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
