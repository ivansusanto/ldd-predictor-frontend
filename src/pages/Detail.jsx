import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';
import { Home, LogOut, LucideHistory } from 'lucide-react';

const Detail = () => {
    const [processed, setProcessed] = useState(null);
    const [userLogin, setUserLogin] = useState(null);
    const { history_id } = useParams();

    const navigate = useNavigate();

    const FLASK_HOST = 'https://cool-narwhal-genuinely.ngrok-free.app';

    useEffect(() => {
        checkToken();
        fetchData();
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

    const fetchData = async () => {
        try {
            const res = await fetch(`${FLASK_HOST}/history/${history_id}`, {
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

            const sagittalViewImages = await Promise.all(
                data.sagittal.view.map(async (url) => {
                    try {
                        const res = await fetch(url, {
                            headers: {
                                'ngrok-skip-browser-warning': 'true'
                            }
                        });
                        if (!res.ok) throw new Error("Image load failed");
                        const blob = await res.blob();
                        return URL.createObjectURL(blob);
                    } catch (err) {
                        console.error("Image fetch failed", url, err);
                        return null;
                    }
                })
            );
            data.sagittal.view = sagittalViewImages;

            const sagittalCroppedImages = await Promise.all(
                data.sagittal.cropped.map(async (cropped) => {
                    try {
                        const res = await fetch(cropped.url, {
                            headers: {
                                'ngrok-skip-browser-warning': 'true'
                            }
                        });
                        if (!res.ok) throw new Error("Image load failed");
                        const blob = await res.blob();
                        return { ...cropped, url: URL.createObjectURL(blob) };
                    } catch (err) {
                        console.error("Image fetch failed", cropped.url, err);
                        return null;
                    }
                })
            );
            data.sagittal.cropped = sagittalCroppedImages;

            const axialImages = await Promise.all(
                data.axial.map(async (axial) => {
                    try {
                        const res = await fetch(axial.result, {
                            headers: {
                                'ngrok-skip-browser-warning': 'true'
                            }
                        });
                        if (!res.ok) throw new Error("Image load failed");
                        const blob = await res.blob();

                        const cropped = await Promise.all(axial.cropped.map(async (cropped) => {
                            const cropped_res = await fetch(cropped.url, {
                                headers: {
                                    'ngrok-skip-browser-warning': 'true'
                                }
                            });
                            if (!cropped_res.ok) throw new Error("Image load failed");
                            const cropped_blob = await cropped_res.blob();

                            return { ...cropped, url: URL.createObjectURL(cropped_blob) }
                        }))

                        return { ...axial, cropped: cropped, result: URL.createObjectURL(blob) };
                    } catch (err) {
                        console.error("Image fetch failed", axial.result, err);
                        return null;
                    }
                })
            );
            data.axial = axialImages;

            setProcessed(data);
        } catch (error) {
            Swal.fire('History not found', '', 'error');
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
                    <h1 className="text-2xl font-bold text-gray-800">Lumbar Degenerative Disease Predictor</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600"><strong>{userLogin?.fullname}</strong></span>
                        <button
                            onClick={() => {
                                navigate('/history');
                            }}
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

            {processed && <div className="max-w-full text-center mx-auto">
                <div className="bg-white shadow-md m-10 mx-20 p-5 pt-10 rounded-lg">
                    <h1 className="text-2xl font-semibold text-center mb-10 underline">Result Report</h1>

                    <div className="bg-pink-200 p-10 m-5 rounded-lg">
                        <p className='text-center font-bold'>Pfirrmann and Schizas Grade</p>
                        {
                            processed.axial.map((axial, i) => <div className='w-full my-10 px-10 flex justify-start items-center gap-10' key={"axial_id_container_" + i}>
                                <p
                                    className={`px-5 py-10 text-lg`}
                                >
                                    <span>{i + 1}.</span>
                                </p>
                                <img
                                    src={processed.sagittal.view[i]}
                                    key={"disc" + i}
                                    alt="Sagittal Disc"
                                    className="w-full max-w-[300px] h-auto rounded-xl border shadow mt-2"
                                />
                                <div>
                                    <img
                                        src={processed.sagittal.cropped[i].url}
                                        key={"sagittal_" + i}
                                        alt="Sagittal Cropped"
                                        className="w-full max-w-[200px] h-auto rounded-xl border shadow mt-2"
                                    />
                                    <p className="text-sm text-gray-800 mt-5">{processed.sagittal.cropped[i].result}</p>
                                </div>
                                <img
                                    src={axial.result}
                                    key={"axial_" + i}
                                    alt="Axial Result"
                                    className="w-full max-w-[300px] h-auto rounded-xl border shadow mt-2"
                                />
                                <div>
                                    {axial.cropped.map((cropped_data, j) =>
                                        <div key={"axial_" + i + "_" + j}>
                                            <img
                                                src={cropped_data.url}
                                                alt="Axial Cropped"
                                                className="w-full max-w-[200px] h-auto rounded-xl border shadow mt-2"
                                            />
                                            <p className="text-sm text-gray-800 mt-5">{cropped_data.result}</p>
                                        </div>
                                    )}
                                </div>
                                <p className='text-justify max-w-1/4'>The lumbar disc at <b>number {i + 1}</b> is classified as Pfirrmann classification as <b>{processed.sagittal.cropped[i].result.split('] ')[1]}</b> and Schizas classification as <b>{axial.cropped[0].result.split('] ')[1]}</b>. Therefore, the recommended operative procedure for the patient is <b>{processed.method[i]}</b>.</p>
                            </div>)
                        }
                    </div>
                    <div className="bg-pink-200 p-10 px-20 m-5 rounded-lg">
                        <p className='text-center mb-5 font-bold'>The Conclusion</p>
                        <span className='text-justify px-10 mb-5'>
                            {
                                (() => {
                                    const methods = processed.method;
                                    const methodCounts = {};

                                    methods.forEach(method => {
                                        methodCounts[method] = (methodCounts[method] || 0) + 1;
                                    });

                                    const total = methods.length;
                                    const sortedMethods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);

                                    const lines = [];

                                    lines.push(
                                        <div key={`lines_${lines.length}`}>Out of <strong>{total}</strong> discs analyzed, the following operative procedures are recommended:</div>
                                    );
                                    lines.push(<br key="br-1" />);

                                    sortedMethods.forEach(([method, count], idx) => {
                                        lines.push(
                                            <div key={`line-${idx}`}>
                                                - <strong>{count}</strong> disc{count > 1 ? 's' : ''}: <strong>{method}</strong>
                                            </div>
                                        );
                                    });

                                    const mostCommon = sortedMethods[0];
                                    lines.push(<br key="br-2" />);
                                    lines.push(
                                        <div key={`lines_${lines.length}`}>
                                            The most frequently recommended procedure is <strong>"{mostCommon[0]}"</strong>, which was advised for <strong>{mostCommon[1]}</strong> disc{mostCommon[1] > 1 ? 's' : ''}.
                                        </div>
                                    );

                                    return lines;
                                })()
                            }
                        </span>

                    </div>
                </div>
            </div>}
        </div>
    );
}

export default Detail;
