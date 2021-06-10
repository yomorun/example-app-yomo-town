import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
    render() {
        return (
            <Html lang='en'>
                <Head>
                    <link rel='apple-touch-icon' sizes='76x76' href='/favicons/apple-touch-icon.png' />
                    <link
                        rel='icon'
                        type='image/png'
                        sizes='32x32'
                        href='/favicons/favicon-32x32.png'
                    />
                    <link
                        rel='icon'
                        type='image/png'
                        sizes='16x16'
                        href='/favicons/favicon-16x16.png'
                    />
                    <link rel='manifest' href='/favicons/site.webmanifest' />
                    <link rel='mask-icon' href='/favicons/safari-pinned-tab.svg' color='#5bbad5' />
                    <meta name='msapplication-TileColor' content='#000000' />
                    <meta name='theme-color' content='#000000' />
                    <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
                    <link href='https://fonts.googleapis.com/css2?family=Exo+2:wght@400&display=swap' rel='stylesheet' />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument
