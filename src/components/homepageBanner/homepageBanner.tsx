import React from 'react'
import Lighthouse from '../lighthouse/lighthouse'

const homepageBanner = () => {
    return (
        <div className="homepageBanner">
            <div className='role'>
                <text>frontend developer - react framework </text>
            </div>
            <div className='myName'>
                <text>NGUYENTIENDAT</text>
                <div className='lighthouse-container'>
                    <Lighthouse />
                </div>
            </div>
            <div className='myDescription'>
                <text>
                    reactjs
                </text>
                <div className="arrow-container">
                    <div className="arrow-down"></div>
                </div>
                <text>
                    nodejs
                </text>
                <div className="arrow-container">
                    <div className="arrow-down"></div>
                </div>
                <text>
                    typescript
                </text>
                <div className="arrow-container">
                    <div className="arrow-down"></div>
                </div>
                <text>
                    blockchain
                </text>
            </div>
        </div>
    )
}

export default homepageBanner