import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { QuestionAPI, AttemptAPI } from "../api/client";

export default function TakeQuiz() {
  const { attemptId } = useParams();
  const [sp] = useSearchParams();
  const skillId = sp.get("skillId");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("loading");
  const [result, setResult] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    QuestionAPI.list(`?skillId=${skillId}&page=1&limit=50`).then(r => {
      setQuestions(r.data || []);
      setStatus("ready");
    }).catch(() => setStatus("error"));
  }, [skillId]);

  const current = questions[index];
  const options = useMemo(() => (current?.options || []).sort((a,b) => a.position-b.position), [current]);

  async function answerAndNext() {
    if (!current || !selected) return;
    await AttemptAPI.answer(attemptId, { questionId: current.id, selectedOptionId: Number(selected), timeSpentSeconds: 5 });
    setSelected(null);
    if (index + 1 < questions.length) setIndex(index + 1);
    else await submitAttempt();
  }

  async function submitAttempt() {
    const res = await AttemptAPI.submit(attemptId);
    setResult(res.data);
  }

  if (status === "loading") return <div className="container"><div className="card">Loading…</div></div>;
  if (status === "error") return <div className="container"><div className="card">Failed to load questions.</div></div>;

  if (result) {
    return (
      <div className="container">
        <div className="card" style={{maxWidth:600, margin:"30px auto", textAlign:"center"}}>
          <h2>Quiz submitted</h2>
          <p>Score: <b>{Number(result.scorePercent)}%</b></p>
          <button className="btn" onClick={() => nav("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!current) return <div className="container"><div className="card">No questions available for this skill.</div></div>;

  return (
    <div className="container">
      <div className="card" style={{maxWidth:800, margin:"0 auto"}}>
        <div className="small">Question {index+1} of {questions.length}</div>
        <h3 style={{marginTop:8}}>{current.questionText}</h3>
        <div style={{marginTop:8}}>
          {options.map(o => (
            <label key={o.id} style={{display:"block", marginBottom:8}}>
              <input type="radio" name="opt" value={o.id}
                     checked={String(selected)===String(o.id)}
                     onChange={()=>setSelected(o.id)} />
              <span style={{marginLeft:8}}>{o.optionText}</span>
            </label>
          ))}
        </div>
        <div className="row" style={{justifyContent:"space-between", marginTop:12}}>
          <button className="btn secondary" onClick={() => setIndex(Math.max(0, index-1))} disabled={index===0}>Back</button>
          <button className="btn" onClick={answerAndNext}>{index+1<questions.length ? "Next" : "Submit"}</button>
        </div>
      </div>
    </div>
  );
}
