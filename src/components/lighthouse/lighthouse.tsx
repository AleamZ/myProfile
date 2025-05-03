import React, { useState, useEffect, useRef } from 'react';
import './lighthouse.scss';

const Lighthouse: React.FC = () => {
    const [lightOn, setLightOn] = useState(true);
    const [doorOpen, setDoorOpen] = useState(false);
    const [windowsOpen, setWindowsOpen] = useState({
        left1: false,
        right: false,
        left2: false
    });

    const lighthouseRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const adjustLighthouse = () => {
            const parentHeight = containerRef.current?.parentElement?.clientHeight || 0;
            if (lighthouseRef.current && parentHeight) {
                // Calculate the scale needed to make the lighthouse match parent height
                const baseHeight = 470; // Approximate base height of lighthouse without scaling
                const scale = parentHeight / baseHeight;
                lighthouseRef.current.style.transform = `scale(${scale * 0.6})`;
            }
        };

        adjustLighthouse();
        window.addEventListener('resize', adjustLighthouse);

        return () => {
            window.removeEventListener('resize', adjustLighthouse);
        };
    }, []);

    const toggleLight = () => {
        setLightOn(!lightOn);
    };

    const toggleDoor = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDoorOpen(!doorOpen);
    };

    const toggleWindow = (windowName: 'left1' | 'right' | 'left2') => (e: React.MouseEvent) => {
        e.stopPropagation();
        setWindowsOpen(prev => ({
            ...prev,
            [windowName]: !prev[windowName]
        }));
    };

    return (
        <div className="lighthouse-container" ref={containerRef}>
            <div className="lighthouse" ref={lighthouseRef}>
                {/* Lantern room with light */}
                <div className="lighthouse-lantern" onClick={toggleLight}>
                    <div className={`light-source ${lightOn ? 'active' : ''}`}></div>
                    <div className={`beam-container ${lightOn ? 'active' : ''}`}>
                        <div className={`light-beam ${lightOn ? 'active' : ''}`}></div>
                    </div>
                    <div className="lantern-roof"></div>
                </div>

                {/* Top section with railing */}
                <div className="lighthouse-top" onClick={toggleLight}>
                    <div className="railing"></div>
                </div>

                {/* Main tower with stripes and alternating windows */}
                <div className="lighthouse-tower">
                    <div className="stripe">
                        {/* Window with interior */}
                        <div
                            className={`window window-left ${windowsOpen.left1 ? 'open' : ''}`}
                            onClick={toggleWindow('left1')}
                        ></div>
                        <div className="window-interior left"></div>
                    </div>
                    <div className="stripe">
                        {/* Window with interior */}
                        <div
                            className={`window window-right ${windowsOpen.right ? 'open' : ''}`}
                            onClick={toggleWindow('right')}
                        ></div>
                        <div className="window-interior right"></div>
                    </div>
                    <div className="stripe">
                        {/* Window with interior */}
                        <div
                            className={`window window-left ${windowsOpen.left2 ? 'open' : ''}`}
                            onClick={toggleWindow('left2')}
                        ></div>
                        <div className="window-interior left"></div>
                    </div>
                </div>

                {/* Base of the lighthouse with door and interior */}
                <div className="lighthouse-base">
                    <div
                        className={`door ${doorOpen ? 'open' : ''}`}
                        onClick={toggleDoor}
                    ></div>
                    <div className="door-interior"></div>
                </div>
            </div>

            {/* Long shadow for the lighthouse */}
            <div className="lighthouse-shadow"></div>
        </div>
    );
};

export default Lighthouse;
