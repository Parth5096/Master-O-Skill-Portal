import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  function doLogout() { logout(); nav("/login"); }

  return (
    <nav>
      <div className="container">
        <Link to="/" style={{fontWeight:800}}>Skill Portal</Link>
        <div className="links">
          {user && (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
            </>
          )}
        </div>
        <div>
          {!user ? (
            <>
              <NavLink to="/login">Login</NavLink>{" · "}
              <NavLink to="/register">Register</NavLink>
            </>
          ) : (
            <>
              <span className="badge" style={{marginRight:8}}>{user.role}</span>
              <button className="btn secondary" onClick={doLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
