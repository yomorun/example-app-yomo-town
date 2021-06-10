import 'styles/globals.css'

import Head from 'next/head'
import { DefaultSeo } from 'next-seo'
import { SEO } from 'components/SEO'
import DefaultLayout from 'components/DefaultLayout'

function MyApp({ Component, pageProps }) {
    const Layout = Component.Layout || DefaultLayout
    return (
        <Layout>
            <Head>
                <meta content='width=device-width, initial-scale=1' name='viewport' />
            </Head>
            <DefaultSeo {...SEO} />
            <Component {...pageProps} />
        </Layout>
    )
}

export default MyApp
