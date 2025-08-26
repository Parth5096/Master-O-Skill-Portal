import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="container">
      <div className="row">
        <div className="card" style={{flex:"1 1 300px"}}>
          <h3>Questions</h3>
          <p>Manage questions for each skill.</p>
          <Link className="btn" to="/admin/questions">Open</Link>
        </div>
        <div className="card" style={{flex:"1 1 300px"}}>
          <h3>Reports</h3>
          <p>View user performance and skill gaps.</p>
          <Link className="btn" to="/admin/reports">Open</Link>
        </div>
      </div>
    </div>
  );
}
