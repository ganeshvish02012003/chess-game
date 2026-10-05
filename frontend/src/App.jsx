import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChessGame from "./pages/ChessGame";

function App() {
  const { user, loading: authLoading } = useAuth();

  const [authPage, setAuthPage] = useState("login");

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    if (authPage === "login") {
      return (
        <Login
          onSwitchToSignup={() => setAuthPage("signup")}
        />
      );
    }

    return (
      <Signup
        onSwitchToLogin={() => setAuthPage("login")}
      />
    );
  }

  return <ChessGame />;
}

export default App;