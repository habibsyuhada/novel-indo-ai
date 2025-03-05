import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        <meta name='application-name' content='Baca Novel Indo' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Baca Novel Indo' />
        <meta name='description' content='Baca novel favorit Anda secara online' />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='theme-color' content='#570df8' />
        <meta httpEquiv="Content-Language" content="id" />
        <meta name="language" content="Indonesian" />

        <link rel='apple-touch-icon' href='/icons/icon-192x192.png' />
        <link rel='icon' type='image/png' sizes='32x32' href='/icons/icon-32x32.png' />
        <link rel='icon' type='image/png' sizes='16x16' href='/icons/icon-16x16.png' />
        <link rel='manifest' href='/manifest.json' />
        <link rel='shortcut icon' href='/favicon.ico' />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
