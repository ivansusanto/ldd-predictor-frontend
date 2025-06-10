import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/Admin';
import History from './pages/History';
import Detail from './pages/Detail';

const NgrokImageLoader = () => {
	const location = useLocation();

	useEffect(() => {
		const images = document.querySelectorAll("img[data-src]");

		images.forEach(img => {
			const imageUrl = img.getAttribute("data-src");
			if (!imageUrl) return;

			fetch(imageUrl, {
				headers: {
					"ngrok-skip-browser-warning": "true",
					"User-Agent": "Mozilla/5.0"
				}
			})
				.then(response => {
					if (!response.ok) throw new Error("Image load failed");
					return response.blob();
				})
				.then(blob => {
					const objectUrl = URL.createObjectURL(blob);
					img.src = objectUrl;
				})
				.catch(error => {
					console.error("Failed to load image:", imageUrl, error);
				});
		});
	}, [location.pathname]);

	return null;
};

const App = () => {
	return (
		<Router>
			<NgrokImageLoader />
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/home" element={<Home />} />
				<Route path="/history" element={<History />} />
				<Route path="/detail/:history_id" element={<Detail />} />
				<Route path="/admin" element={<Admin />} />
			</Routes>
		</Router>
	);
};

export default App;
