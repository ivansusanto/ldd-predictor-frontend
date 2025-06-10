import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ImageSlider from "../components/ImageSlider";
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, LucideHistory } from 'lucide-react';

const Home = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [model1, setModel1] = useState('sagittal-disc-YOLOv11_v4');
    const [model2, setModel2] = useState('axial-spinal-cord-YOLOv11_v3');
    const [model3, setModel3] = useState('pfirrmann-Inception-V3-C_v1');
    const [model4, setModel4] = useState('schizas-EfficientViT-L2-C_v1');
    const [resultImages, setResultImages] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [choosedSagittal, setChoosedSagittal] = useState(0);
    const [choosedAxial, setChoosedAxial] = useState([]);
    const [processed, setProcessed] = useState(null);
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [userLogin, setUserLogin] = useState(null);
    const [selectedDisc, setSelectedDisc] = useState(0);

    const sliderRef = useRef();
    const navigate = useNavigate();

    const FLASK_HOST = 'https://06ad-103-182-234-178.ngrok-free.app';

    useEffect(() => {
        checkToken();
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

    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            setPreview(URL.createObjectURL(uploadedFile));
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setPreview(URL.createObjectURL(droppedFile));
        }
    };

    const handleUpload = async () => {
        if (!file) return alert('Please choose a file first!');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('model1', model1);
        formData.append('model2', model2);
        formData.append('model3', model3);
        formData.append('model4', model4);
        setLoading(true);

        try {
            const response = await axios.post(`${FLASK_HOST}/upload`, formData, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (response.data) {
                setData(response.data);
                try {
                    const res = await axios.get(
                        `${FLASK_HOST}/get-sagittal-axial/${response.data.id}/${response.data.series[0]}`,
                        {
                            headers: {
                                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                                'ngrok-skip-browser-warning': 'true'
                            }
                        }
                    );

                    const data = res.data;

                    const sagittalUrl = await Promise.all(
                        data.sagittal_url.map(async (url) => {
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
                    data.sagittal_url = sagittalUrl;

                    const axialUrl = await Promise.all(
                        data.sagittal_url.map(async (url) => {
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
                    data.axial_url = axialUrl;

                    setResultImages(data);
                    setSelectedSeries(response.data.series[0]);
                    setPreview(false);
                    setChoosedSagittal(parseInt(res.data.sagittal_url.length / 2));
                } catch (error) {
                    console.error(error);
                    alert('Fetch images failed. Check backend.');
                }
            }
        } catch (error) {
            console.error(error);
            alert('Upload failed. Check backend.');
        } finally {
            setLoading(false);
        }
    };

    const handleSeriesChange = async (e) => {
        const currentSelectedSeries = e.target.value;
        setSelectedSeries(currentSelectedSeries);
        try {
            const res = await axios.get(
                `${FLASK_HOST}/get-sagittal-axial/${data.id}/${currentSelectedSeries}`,
                {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token'),
                        'ngrok-skip-browser-warning': 'true'
                    }
                }
            );

            const data = res.data;

            const sagittalUrl = await Promise.all(
                data.sagittal_url.sort((a, b) => a.localeCompare(b)).map(async (url) => {
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
            data.sagittal_url = sagittalUrl;

            const axialUrl = await Promise.all(
                data.axial_url.sort((a, b) => a.localeCompare(b)).map(async (url) => {
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
            data.axial_url = axialUrl;

            setResultImages(data);
            setPreview(false);
            setChoosedSagittal(parseInt(res.data.sagittal_url.length / 2));
        } catch (error) {
            console.error(error);
            alert('Fetch images failed. Check backend.');
        }
    };

    function fillSelectedAxial(axial, disc) {
        const selectedIndices = [];
        const step = axial / disc;

        for (let i = 0; i < disc; i++) {
            const index = Math.floor((i + 0.5) * step);
            if (index < axial) {
                selectedIndices.push(index);
            } else {
                selectedIndices.push(axial - 1);
            }
        }

        return selectedIndices.map(i => i + 1);
    }

    const handleSagittalProcess = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${FLASK_HOST}/results/sagittal/${data.id}/${selectedSeries}`, {
                sagittal: choosedSagittal
            }, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (response.data) {
                const data = response.data;

                try {
                    const res = await fetch(data.sagittal.result, {
                        headers: {
                            'ngrok-skip-browser-warning': 'true'
                        }
                    });
                    if (!res.ok) throw new Error("Image load failed");
                    const blob = await res.blob();
                    data.sagittal.result = URL.createObjectURL(blob);
                } catch (err) {
                    console.error("Image fetch failed", data.sagittal.result, err);
                    return null;
                }

                const sagittalView = await Promise.all(
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
                data.sagittal.view = sagittalView;

                console.log(data);
                setProcessed({
                    ...data
                });

                const choosed_axial_result = fillSelectedAxial(
                    resultImages.axial_url.length,
                    response.data.sagittal.cropped.length
                );
                setChoosedAxial(choosed_axial_result);
            }
        } catch (error) {
            console.error(error);
            alert('Process failed. Check backend.');
        } finally {
            setLoading(false);
        }
    }

    const handleAxialProcess = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${FLASK_HOST}/results/axial/${data.id}/${selectedSeries}`, {
                axial: choosedAxial
            }, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (response.data) {
                setProcessed({
                    ...processed,
                    ...response.data
                });
            }
        } catch (error) {
            console.error(error);
            alert('Process failed. Check backend.');
        } finally {
            setLoading(false);
            navigate(`/detail/${data.id}`);
        }
    }

    return (
        <div className="mx-auto text-center bg-gray-100 min-h-screen h-full">
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

            <div className="max-w-full text-center mx-auto">
                {data === null && <>
                    <div className="flex w-1/2 gap-3 mx-auto mb-5">
                        <div className="w-full flex items-center justify-center">
                            <p className='w-1/2 text-end pe-5'>Sagittal Disc Detection :</p>
                            <select name="series" id="series" className="w-1/2 text-left block py-2.5 px-0 text-sm text-gray-800 bg-transparent border-0 border-b-2 border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-200 peer mx-auto" onChange={async (e) => {setModel1(e.target.value)}} disabled={!processed ? false : true}>
                                {[
                                    'sagittal-disc-YOLOv11_v1',
                                    'sagittal-disc-YOLOv11_v2',
                                    'sagittal-disc-YOLOv11_v3',
                                    'sagittal-disc-YOLOv11_v4'
                                ].map((series, i) =>
                                    <option key={i} value={series} selected={series == model1 ? true : false}>
                                        {series}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="w-full flex items-center justify-center">
                            <p className='w-1/2 text-end pe-5'>Axial Spinal Cord Detection :</p>
                            <select name="series" id="series" className="w-1/2 text-left block py-2.5 px-0 text-sm text-gray-800 bg-transparent border-0 border-b-2 border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-200 peer mx-auto" onChange={async (e) => {setModel2(e.target.value)}} disabled={!processed ? false : true}>
                                {[
                                    'axial-spinal-cord-YOLOv11_v1',
                                    'axial-spinal-cord-YOLOv11_v2',
                                    'axial-spinal-cord-YOLOv11_v3'
                                ].map((series, i) =>
                                    <option key={i} value={series} selected={series == model2 ? true : false}>
                                        {series}
                                    </option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="flex w-1/2 gap-3 mx-auto">
                        <div className="w-full flex items-center justify-center">
                            <p className='w-1/2 text-end pe-5'>Pfirrmann Classification :</p>
                            <select name="series" id="series" className="w-1/2 text-left block py-2.5 px-0 text-sm text-gray-800 bg-transparent border-0 border-b-2 border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-200 peer mx-auto" onChange={async (e) => {setModel3(e.target.value)}} disabled={!processed ? false : true}>
                                {[
                                    'pfirrmann-EfficientViT-B2-C_v1',
                                    'pfirrmann-EfficientViT-B2-C_v2',
                                    'pfirrmann-EfficientViT-B2-R_v3',
                                    'pfirrmann-EfficientViT-L2-C_v1',
                                    'pfirrmann-EfficientViT-L2-R_v2',
                                    'pfirrmann-Inception-V3-C_v1',
                                    'pfirrmann-Inception-V3-R_v2'
                                ].map((series, i) =>
                                    <option key={i} value={series} selected={series == model3 ? true : false}>
                                        {series}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="w-full flex items-center justify-center">
                            <p className='w-1/2 text-end pe-5'>Schizas Classification :</p>
                            <select name="series" id="series" className="w-1/2 text-left block py-2.5 px-0 text-sm text-gray-800 bg-transparent border-0 border-b-2 border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-200 peer mx-auto" onChange={async (e) => {setModel4(e.target.value)}} disabled={!processed ? false : true}>
                                {[
                                    'schizas-EfficientViT-B2-C_v1',
                                    'schizas-EfficientViT-L2-C_v1',
                                    'schizas-EfficientViT-L2-R_v2',
                                    'schizas-Inception-V3-C_v1',
                                    'schizas-Inception-V3-R_v2',
                                ].map((series, i) =>
                                    <option key={i} value={series} selected={series == model4 ? true : false}>
                                        {series}
                                    </option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="max-w-3xl mt-10 mx-auto border-4 border-dashed rounded-xl p-8 cursor-pointer bg-pink-50 hover:bg-pink-100 text-center"
                    >
                        <p className="text-gray-600">Drag & Drop your .zip DICOM file here or choose manually</p>

                        <input
                            id="file-upload"
                            type="file"
                            accept=".zip"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <label
                            htmlFor="file-upload"
                            className="inline-block text-gray-600 mt-4 px-6 py-2 rounded-lg cursor-pointer transition"
                        >
                            {file ? `Choosen File: ${file.name}` : 'Choose File: No File Choosen'}
                        </label>
                    </div>
                </>}

                {preview && (
                    <div className="text-sm text-gray-500">
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="bg-pink-500 text-white px-4 py-2 mt-4 rounded hover:bg-pink-600 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Process File'}
                        </button>
                    </div>
                )}

                {resultImages && !processed?.axial && <div className="w-full">
                    <select name="series" id="series" className="w-1/3 text-left block py-2.5 px-0 text-sm text-gray-800 bg-transparent border-0 border-b-2 border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-200 peer mx-auto" onChange={handleSeriesChange} disabled={!processed ? false : true}>
                        {data.series.map((series, i) =>
                            <option key={i} value={series}>
                                {series}
                            </option>
                        )}
                    </select>
                    <div className="w-full grid grid-cols-2 mt-3">
                        <div className="bg-white shadow-md m-10 me-5 p-5 pt-10 rounded-lg">
                            {!processed && !processed?.sagittal && <>
                                <ImageSlider
                                    title="Sagittal View"
                                    images={resultImages.sagittal_url}
                                    start={parseInt(resultImages.sagittal_url.length / 2)}
                                    choosedImage={choosedSagittal}
                                    setChoosedImage={setChoosedSagittal}
                                    isSag={true}
                                    sliderRef={sliderRef}
                                />
                                <button
                                    onClick={handleSagittalProcess}
                                    disabled={loading}
                                    className="bg-pink-500 text-white px-4 py-2 mt-4 mb-3 rounded hover:bg-pink-600 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Process Sagittal'}
                                </button>
                            </>}
                            {processed && processed?.sagittal && <div className='w-full'>
                                <h2 className="text-xl font-semibold text-center mb-5">Sagittal View</h2>
                                <div className="flex justify-center items-center mb-10 gap-10">
                                    <img
                                        src={processed.sagittal.result}
                                        key="main_sagittal"
                                        alt="Sagittal Result"
                                        className="rounded-xl border shadow mt-2 max-w-[45%] h-auto object-contain"
                                    />
                                    <img
                                        src={processed.sagittal.view[selectedDisc]}
                                        key="disc"
                                        alt="Sagittal Disc"
                                        className="rounded-xl border shadow mt-2 max-w-[45%] h-auto object-contain"
                                    />
                                </div>
                                <div className="flex gap-2 justify-center">
                                    {processed.sagittal.cropped.map((d, i) =>
                                        <button
                                            onClick={() => {
                                                setSelectedDisc(i);
                                                sliderRef.current.slickGoTo(choosedAxial[i] - 1);
                                            }}
                                            className={`${i === selectedDisc ? 'bg-pink-500' : 'bg-pink-300'} text-white px-5 py-2 rounded-lg text-md`}
                                            title={`View Disc ${i + 1}`}
                                            key={"view_disc_" + i}
                                        >
                                            <p>{i + 1}</p>
                                        </button>
                                    )}
                                </div>
                            </div>}
                        </div>
                        <div className={`bg-white shadow-md m-10 ms-5 p-5 ${!processed ? 'pt-5' : 'pt-15'} rounded-lg items-center`}>
                            {!processed && !processed?.sagittal && <div className="h-full flex items-center justify-center">
                                <p>Process the sagittal first ...</p>
                            </div>}
                            {processed && processed?.sagittal && <>
                                <ImageSlider
                                    title="Axial View"
                                    images={resultImages.axial_url}
                                    start={choosedAxial[0] - 1}
                                    choosedImage={choosedAxial}
                                    setChoosedImage={setChoosedAxial}
                                    selectedDisc={selectedDisc}
                                    isSag={false}
                                    sliderRef={sliderRef}
                                />
                                <button
                                    onClick={handleAxialProcess}
                                    disabled={loading}
                                    className="bg-pink-500 text-white px-4 py-2 mt-4 mb-3 rounded hover:bg-pink-600 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Process Axial'}
                                </button>
                            </>}
                        </div>
                    </div>
                </div>}
            </div>
        </div>
    );
}

export default Home;
