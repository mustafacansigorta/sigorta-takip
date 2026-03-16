import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import MainApp from "./MainApp";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return session ? <MainApp /> : <Login />;
}