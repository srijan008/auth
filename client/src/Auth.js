import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    // const [needsSignup, setNeedsSignup] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const response = await axios.post('http://localhost:8000/auth/login', {
                email,
                password,
            }, {
                withCredentials: true,
            });

            setMessage(response.data.message || 'Login successful!');
            cookies.set('access_token', response.data.access_token);
        } catch (err) {
            if (err.response?.status === 402) {
                setError('Login with Google');
                return;
            }
            else if (err.response?.status === 401) {
                setError('Invalid credentials');
                return;
            }
            setError(err.response?.data?.message || 'Login failed');
        }
    };


    // const handleSignup = async (e) => {
    //     e.preventDefault();
    //     setMessage('');
    //     setError('');

    //     // Ensure passwords match
    //     if (password !== confirmPassword) {
    //         setError('Passwords do not match');
    //         return;
    //     }

    //     try {
    //         const response = await axios.post('http://localhost:8000/auth/signup', {
    //             name,
    //             email,
    //             password,
    //             googleId: email, // Use the email or Google ID to link
    //         });

    //         setMessage(response.data.message || 'Signup successful! You can log in now.');
    //         setIsLogin(true);
    //         setName('');
    //         setEmail('');
    //         setPassword('');
    //         setConfirmPassword('');
    //     } catch (err) {
    //         setError(err.response?.data?.message || 'Signup failed');
    //     }
    // };

    // const handleGoogleLogin = async () => {
    //     try {
    //         const response = await axios.get('http://localhost:8000/auth/google', {
    //             withCredentials: true,
    //         });

    //         window.location.href = response.data.url;
    //     } catch (err) {
    //         setError(err.response?.data?.message || 'Google login failed');
    //     }
    // };

    // const handleGoogleResponse = (response) => {
    //     if (response.needsSignup) {
    //         // setNeedsSignup(true);
    //         setName(response.name); // Set the name from the Google profile
    //         setEmail(response.email); // Set the email from the Google profile
    //     }
    // };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
                {message && <div className="mb-4 text-center text-green-600">{message}</div>}
                {error && <div className="mb-4 text-center text-red-600">{error}</div>}
                {/* <form onSubmit={isLogin ? handleLogin : handleSignup}> */}
                <form onSubmit={handleLogin}>
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-gray-700">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="mt-1 block w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                            />
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                        />
                    </div>
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-gray-700">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="mt-1 block w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
                    >
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <button
                        onClick={() => window.location.href="http://localhost:8000/auth/google"}
                        className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 focus:outline-none focus:ring focus:ring-red-300"
                    >
                        {isLogin ? 'Login with Google' : 'Sign Up with Google'}
                    </button>
                </div>
                <div className="mt-4 text-center">
                    {/* <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-500 hover:underline"
                    >
                        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default Auth;
