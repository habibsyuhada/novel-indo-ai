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
    // Register service worker with better error handling and logging
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
          });
          
          console.log('Service Worker registration successful with scope:', registration.scope);
          
          registration.addEventListener('activate', (event) => {
            console.log('Service Worker activated:', event);
          });

          registration.addEventListener('error', (error) => {
            console.error('Service Worker error:', error);
          });

          // Check if service worker is active
          if (registration.active) {
            console.log('Service Worker is active');
          }

        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      } else {
        console.log('Service Workers are not supported');
      }
    };

    // Call the registration function
    registerServiceWorker();
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
