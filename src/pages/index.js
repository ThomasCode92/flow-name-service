import Navbar from '@/components/Navbar';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Flow Name Service</title>
        <meta name="description" content="Decentralized Naming Service" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
    </>
  );
}
