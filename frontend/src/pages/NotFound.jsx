import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="container">
      <div className="card" style={{maxWidth:600, margin:"40px auto", textAlign:"center"}}>
        <h2>404</h2>
        <p>Page not found</p>
        <Link className="btn" to="/">Back home</Link>
      </div>
    </div>
  );
}
