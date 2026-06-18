import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/auth';
import Login from './pages/Login';
import Discover from './pages/Discover';
import Room from './pages/Room';

export default function App() {
  const { user, loading, init } = useAuth();

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-500">Loading…</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {user ? (
          <>
            <Route path="/" element={<Discover />} />
            <Route path="/room/:id" element={<Room />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
