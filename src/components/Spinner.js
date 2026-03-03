import React from 'react';
import '../css/Spinner.css';

const Spinner = ({ fullPage = false, text = "Yükleniyor..." }) => {
    if (fullPage) {
        return (
            <div className="spinner-overlay">
                <div className="spinner-modern">
                    <div className="spinner-dot"></div>
                    <div className="spinner-dot"></div>
                    <div className="spinner-dot"></div>
                </div>
                <span className="spinner-text">{text}</span>
            </div>
        );
    }

    return (
        <div className="spinner-inline">
            <div className="spinner-modern">
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
                <div className="spinner-dot"></div>
            </div>
        </div>
    );
};

export default Spinner;
