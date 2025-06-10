import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [fullname, setFullname] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userLogin, setUserLogin] = useState(null);
    const navigate = useNavigate();

    const FLASK_HOST = 'https://06ad-103-182-234-178.ngrok-free.app';

    useEffect(() => {
        checkToken();
        fetchUsers();
    }, []);

    const checkToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
        } else {
            try {
                const res = await fetch(`${FLASK_HOST}/check_token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token'),
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ token: localStorage.getItem('token') }),
                });
                if (!res.ok) {
                    localStorage.removeItem('token');
                    navigate('/');
                } else {
                    const data = await res.json();
                    setUserLogin(data.user);
                }
            } catch (error) {
                console.error('Token check error:', error);
                localStorage.removeItem('token');
                navigate('/');
            }
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${FLASK_HOST}/user/all`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleDelete = async (username) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Delete'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await fetch(`${FLASK_HOST}/user/delete/${username}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token'),
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                if (res.ok) {
                    Swal.fire('Deleted!', 'User has been deleted.', 'success');
                    fetchUsers();
                } else {
                    Swal.fire('Error', 'Failed to delete user', 'error');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Failed to delete user', 'error');
            }
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${FLASK_HOST}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ fullname, username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                Swal.fire('Error', data.message || 'Registration failed', 'error');
            } else {
                Swal.fire('Success', 'User registered successfully', 'success');
                setFullname('');
                setUsername('');
                setPassword('');
                fetchUsers();
            }
        } catch (error) {
            console.error('Register error:', error);
            Swal.fire('Error', 'Failed to register user', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md mb-6">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">Lumbar Degenerative Disease Predictor</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600"><strong>{userLogin?.fullname}</strong></span>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                Swal.fire('Logged out', '', 'info');
                                navigate('/');
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md text-sm"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Registered Users</h2>
                    {users.length === 0 ? (
                        <p className="text-gray-500">No users found.</p>
                    ) : (
                        <ul className="space-y-4">
                            {users.map((user, i) => (
                                <li
                                    key={i}
                                    className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-md border"
                                >
                                    <div>
                                        <p className="font-medium">{user.fullname}</p>
                                        <p className="text-sm text-gray-500">{user.username}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(user.username)}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Register New User</h2>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Full Name</label>
                            <input
                                type="text"
                                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Username</label>
                            <input
                                type="text"
                                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Password</label>
                            <input
                                type="password"
                                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                        >
                            Register User
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Admin;
