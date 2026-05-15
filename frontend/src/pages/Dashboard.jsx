import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import ViewerDashboard from "./ViewerDashboard";
import InvestigatorDashboard from "./InvestigatorDashboard";

export default function Dashboard() {
  const { role } = useAuth();

  if (role === "superadmin" || role === "judge") return <AdminDashboard />;
  if (role === "viewer") return <ViewerDashboard />;
  if (role === "investigator") return <InvestigatorDashboard />;
  
  return null;
}
// import { useAuth } from "../context/AuthContext"
// import AdminDashboard from "./AdminDashboard"
// import AuditorDashboard from "./AuditorDashboard"
// import ViewerDashboard from "./ViewerDashboard"

// export default function Dashboard() {
//   const { user } = useAuth()

//   if (user.role === "MAIN_ADMIN") return <AdminDashboard />
//   if (user.role === "AUDITOR") return <AuditorDashboard />
//   return <ViewerDashboard />
// }
