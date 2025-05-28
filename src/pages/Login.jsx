import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const FLASK_HOST = 'https://5364-103-182-234-178.ngrok-free.app';

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${FLASK_HOST}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: data.message || 'Username or password is incorrect',
                });
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Login Success',
                timer: 1200,
            });

            localStorage.setItem('token', data.token);

            if (data.role === 'admin') {
                navigate('/admin');
            } else if (data.role === 'user') {
                navigate('/home');
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Unknown Role',
                    text: `Role: ${data.role}`,
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Server Error',
                text: 'System cannot connect with server',
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            id="username"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
                    >
                        LOGIN
                    </button>
                </form>
            </div>
            <div className="fixed left-5 bottom-5">
                <p className="text-gray-500">&copy; 2025 Ivan Susanto - ISTTS</p>
            </div>
        </div>
    );
};

export default Login;
