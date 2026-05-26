import type { AppProps } from 'next/app';
// import '../styles/globals.css';  // Comment out for now

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}