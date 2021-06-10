import { NextSeo, ArticleJsonLd } from 'next-seo'

export const SEO = {
    title: process.env.NEXT_PUBLIC_TITLE,
    description: process.env.NEXT_PUBLIC_DESCRIPTION,
    canonical: process.env.NEXT_PUBLIC_SITEURL,
    openGraph: {
        type: 'website',
        locale: process.env.NEXT_PUBLIC_LANGUAGE,
        url: process.env.NEXT_PUBLIC_SITEURL,
        title: process.env.NEXT_PUBLIC_TITLE,
        description: process.env.NEXT_PUBLIC_DESCRIPTION,
        images: [
            {
                url: `${process.env.NEXT_PUBLIC_SITEURL}${process.env.NEXT_PUBLIC_SOCIALBANNER}`,
                alt: process.env.NEXT_PUBLIC_TITLE,
                width: 600,
                height: 600,
            },
        ],
    },
    twitter: {
        handle:  process.env.NEXT_PUBLIC_TWITTER,
        site:  process.env.NEXT_PUBLIC_TWITTER,
        cardType: 'summary_large_image',
    },
    additionalMetaTags: [
        {
            name: 'author',
            content: process.env.NEXT_PUBLIC_AUTHOR,
        },
    ],
}

export const PageSeo = ({ title, description, url }) => {
    return (
        <NextSeo
            title={`${title} – ${siteMetadata.title}`}
            description={description}
            canonical={url}
            openGraph={{
                url,
                title,
                description,
            }}
        />
    )
}
