import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadEvidence from "./pages/UploadEvidence";
import VerifyEvidence from "./pages/VerifyEvidence";
import BlockchainExplorer from "./pages/BlockchainExplorer";
import MonitoringDashboard from "./pages/MonitoringDashboard";
import ManageWallets from "./pages/ManageWallets";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadEvidence />
              </ProtectedRoute>
            }
          />

          <Route
            path="/verify"
            element={
              <ProtectedRoute>
                <VerifyEvidence />
              </ProtectedRoute>
            }
          />

          <Route
            path="/explorer"
            element={
              <ProtectedRoute>
                <BlockchainExplorer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/monitoring"
            element={
              <ProtectedRoute>
                <MonitoringDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manage-wallets"
            element={
              <ProtectedRoute>
                <ManageWallets />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

