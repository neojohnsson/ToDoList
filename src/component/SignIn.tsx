import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase';
import '../App.css';

function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSignIn(e: React.FormEvent){
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        } else {
            navigate('/instruments');
        }
        setLoading(false);
    }

    async function handleSignUp(){
        setLoading(true);
        setError('')

        const { error } = await supabase.auth.signUp({ email, password });

        if ( error ) setError(error.message);
        setLoading(false);
    }

    return (
        <div className="signin-wrapper">
            <div className="signin-card">
                <h2>Sign In</h2>
                <form onSubmit={handleSignIn}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className="auth-error">{error}</p>}
                    <button className="btn-primary" type="submit" disabled={loading}>Sign In</button>
                    <button className="btn-secondary" type="button" onClick={handleSignUp} disabled={loading}>Sign Up</button>
                </form>
            </div>
        </div>
    );
}

export default SignIn;