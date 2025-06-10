import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import Slider from "react-slick";

const ImageSlider = ({
    title,
    images,
    onSlideChange,
    start = 0,
    choosedImage,
    setChoosedImage,
    selectedDisc = -1,
    isSag,
    sliderRef = useRef()
}) => {
    const [currentSlide, setCurrentSlide] = useState(start);

    useEffect(() => {
        images = [...images.map(async (url) => {
            const res = await fetch(url, {
                headers: {
                    "ngrok-skip-browser-warning": true
                }
            });
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            url = objectUrl;
        })];
    }, []);

    const settings = {
        dots: false,
        infinite: true,
        speed: 400,
        slidesToShow: 3,
        centerMode: true,
        centerPadding: "0px",
        initialSlide: start,
        arrows: false,
        afterChange: (index) => {
            setCurrentSlide(index);
            if (isSag) setChoosedImage(index + 1);
            if (onSlideChange) {
                onSlideChange(index);
            }
        }
    };

    const handleRadioChange = () => {
        if (!isSag) {
            choosedImage[selectedDisc] = currentSlide + 1;
            setChoosedImage([...choosedImage]);
        }
    };

    if (!images || images.length === 0) return null;

    return (
        <>
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-center">{title}</h2>
                <p>{currentSlide + 1} / {images.length}</p>
            </div>
            <div className="relative w-full flex items-center justify-center">
                <ArrowLeft
                    onClick={() => currentSlide > 0 && sliderRef.current.slickPrev()}
                    className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer z-10 
                                ${currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-black text-gray-700'}`}
                />
                <div className="w-full px-10">
                    <Slider ref={sliderRef} {...settings}>
                        {images.map((url, index) => (
                            <div
                                key={index}
                                className="flex justify-center transition-transform duration-300"
                            >
                                <img
                                    src={url}
                                    alt={`${title} ${index + 1}`}
                                    className={`rounded shadow-md transition-all duration-300
                                        ${index === currentSlide
                                            ? " max-h-[70vh] opacity-100 scale-100"
                                            : (currentSlide === 0 && index === images.length - 1) ||
                                                (currentSlide === images.length - 1 && index === 0) ||
                                                (currentSlide === images.length - 2 && index === 0) ||
                                                (currentSlide === 1 && index === images.length - 1)
                                                ? " opacity-0"
                                                : " max-h-[50vh] opacity-50 scale-70"
                                        }`}
                                />
                            </div>
                        ))}
                    </Slider>
                </div>
                <ArrowRight
                    onClick={() => currentSlide < images.length - 1 && sliderRef.current.slickNext()}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 cursor-pointer z-10 
                                ${currentSlide === images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-black text-gray-700'}`}
                />
            </div>
            {!isSag && (
                <div className="mt-4 text-center">
                    <label className="inline-flex items-center space-x-2">
                        <input
                            type="radio"
                            onChange={handleRadioChange}
                            checked={choosedImage[selectedDisc] === currentSlide + 1}
                            disabled={choosedImage.includes(currentSlide + 1) && choosedImage[selectedDisc] !== currentSlide + 1}
                        />
                        {!choosedImage.includes(currentSlide + 1) && <span className="text-sm text-gray-700">Select this image</span>}
                        {choosedImage[selectedDisc] === currentSlide + 1 && <span className="text-sm text-gray-700">Image Selected</span>}
                        {choosedImage.includes(currentSlide + 1) && choosedImage[selectedDisc] !== currentSlide + 1 &&
                            <span className="text-sm text-gray-700">
                                Image Used On Disc {choosedImage.indexOf(currentSlide + 1) + 1}
                            </span>
                        }
                    </label>
                </div>
            )}
        </>
    );
};

export default ImageSlider;
