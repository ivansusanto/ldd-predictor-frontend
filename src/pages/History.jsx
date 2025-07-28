import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut, LucideHistory } from 'lucide-react';

const History = () => {
    const [data, setData] = useState([]);
    const [userLogin, setUserLogin] = useState(null);
    const navigate = useNavigate();

    const FLASK_HOST = 'https://cool-narwhal-genuinely.ngrok-free.app';

    useEffect(() => {
        checkToken();
        fetchHistoryData();
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

    const fetchHistoryData = async () => {
        try {
            const res = await fetch(`${FLASK_HOST}/history`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await res.json();
            setData(data);
        } catch (error) {
            console.error('Fetch history error:', error);
            Swal.fire('Error fetching history', '', 'error');
        }
    }

    return (
        <div className="mx-auto text-center bg-gray-100 min-h-screen h-full">
            <div className='fixed top-5 left-10'>
                <button onClick={() => navigate('/home')}>
                    <Home className="w-6 h-6" />
                </button>
            </div>
            <nav className="bg-white shadow-md mb-6">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">History</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600"><strong>{userLogin?.fullname}</strong></span>
                        <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-md text-sm"
                            title="History"
                        >
                            <LucideHistory className="w-5 h-5" />
                        </button>
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

            <div className="max-w-5xl mx-auto mt-10">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    {data.length === 0 ? (
                        <p className="text-gray-500">No histories found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
                                        <th className="px-4 py-2">No</th>
                                        <th className="px-4 py-2">History ID</th>
                                        <th className="px-4 py-2">Created At</th>
                                        <th className="px-4 py-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((hist, i) => (
                                        <tr key={i} className="border-b text-start">
                                            <td className="px-4 py-2">{i + 1}</td>
                                            <td className="px-4 py-2">{hist.id}</td>
                                            <td className="px-4 py-2">
                                                {(() => {
                                                    const date = new Date(hist.created_at);
                                                    const day = date.getDate();
                                                    const month = date.toLocaleString('en-US', { month: 'long' });
                                                    const year = date.getFullYear();
                                                    const hours = String(date.getHours()).padStart(2, '0');
                                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                                    const seconds = String(date.getSeconds()).padStart(2, '0');
                                                    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
                                                })()}
                                            </td>
                                            <td className="px-4 py-2">
                                                <button
                                                    onClick={() => navigate(`/detail/${hist.id}`)}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

export default History;
