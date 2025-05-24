import { useState, useEffect } from 'react';
import { supabase } from './supabase/client';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
                setUser(session.user);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
            setLoading(false); // Set loading to false after checking auth
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (session) {
                    setIsAuthenticated(true);
                    setUser(session.user);
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { isAuthenticated, user, loading }; // Return loading state
}
