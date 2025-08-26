import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try { await register(fullName, email, password); nav("/dashboard"); }
    catch (e) { setErr(e.message || "Registration failed"); }
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth:480, margin:"40px auto"}}>
        <h2>Register</h2>
        <form className="form" onSubmit={onSubmit}>
          <div><label>Full name</label><input value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
          <div><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
          {err && <div className="small" style={{color:"#ef4444"}}>{err}</div>}
          <button className="btn" type="submit">Create account</button>
        </form>
        <hr/>
        <div className="small">Have an account? <Link to="/login">Login</Link></div>
      </div>
    </div>
  );
}
