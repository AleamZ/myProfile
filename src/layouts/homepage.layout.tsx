/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import MHeader from '../components/header/header'
import HomepageBanner from '../components/homepageBanner/homepageBanner'
import Background from '../components/background/background.hompage'
import { Layout } from 'antd'
const homepage = () => {
    return (
        <div className='homepage'>
            <Background />
            <Layout.Header className="mHeader">
                <MHeader />
            </Layout.Header>
            <Layout.Content>
                <div className="content-container">
                    <HomepageBanner />
                </div>
            </Layout.Content>
        </div>
    )
}

export default homepage