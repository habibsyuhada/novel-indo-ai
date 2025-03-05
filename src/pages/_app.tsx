import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { initGTM, trackPageView } from '../lib/gtm';
import { Provider } from 'react-redux';
import { store } from '../store/store';

// Initialize GTM with your container ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
          function(registration) {
            console.log('Service Worker registration successful with scope: ', registration.scope);
          },
          function(err) {
            console.log('Service Worker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  useEffect(() => {
    // Initialize GTM
    if (GTM_ID) {
      initGTM(GTM_ID);
    }
  }, []);

  useEffect(() => {
    // Track page views
    if (router.isReady) {
      trackPageView(router.asPath);
    }
  }, [router.isReady, router.asPath]);

  return (
    <Provider store={store}>
      <Layout>
        <Head>
          <title>Baca Novel Indo - Read Your Favorite Novels</title>
          <meta name="description" content="Read your favorite novels online" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Component {...pageProps} />
      </Layout>
    </Provider>
  );
}

export default MyApp;
