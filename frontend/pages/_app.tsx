import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <link
        href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body {
          font-family: 'Bricolage Grotesque', sans-serif;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}