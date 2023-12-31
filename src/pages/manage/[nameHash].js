import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as fcl from '@onflow/fcl';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

import { getDomainInfoByNameHash, getRentCost } from '@/flow/scripts';
import {
  renewDomain,
  updateAddressForDomain,
  updateBioForDomain,
} from '@/flow/transactions';

import styles from '@/styles/ManageDomain.module.css';

// constant representing seconds per year
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export default function ManageDomain() {
  // Next Router to get access to `nameHash` query parameter
  const router = useRouter();

  // Use AuthContext to gather data for current user
  const { currentUser, isInitialized } = useAuth();

  const [domainInfo, setDomainInfo] = useState();
  const [bio, setBio] = useState('');
  const [linkedAddr, setLinkedAddr] = useState('');
  const [renewFor, setRenewFor] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState(0.0);

  // Function to load the domain info
  async function loadDomainInfo() {
    try {
      const info = await getDomainInfoByNameHash(
        currentUser.addr,
        router.query.nameHash
      );
      console.log(info);
      setDomainInfo(info);
    } catch (error) {
      console.error(error);
    }
  }

  // Function which updates the bio transaction
  async function updateBio() {
    try {
      setLoading(true);
      const txId = await updateBioForDomain(router.query.nameHash, bio);
      await fcl.tx(txId).onceSealed();
      await loadDomainInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which updates the address transaction
  async function updateAddress() {
    try {
      setLoading(true);
      const txId = await updateAddressForDomain(
        router.query.nameHash,
        linkedAddr
      );
      await fcl.tx(txId).onceSealed();
      await loadDomainInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which runs the renewal transaction
  async function renew() {
    try {
      setLoading(true);
      if (renewFor <= 0)
        throw new Error('Must be renewing for at least one year');
      const duration = (renewFor * SECONDS_PER_YEAR).toFixed(1).toString();
      const txId = await renewDomain(
        domainInfo.name.replace('.fns', ''),
        duration
      );
      await fcl.tx(txId).onceSealed();
      await loadDomainInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which calculates cost of renewal
  async function getCost() {
    if (
      domainInfo &&
      domainInfo.name.replace('.fns', '').length > 0 &&
      renewFor > 0
    ) {
      const duration = (renewFor * SECONDS_PER_YEAR).toFixed(1).toString();
      const c = await getRentCost(
        domainInfo.name.replace('.fns', ''),
        duration
      );
      setCost(c);
    }
  }

  // Load domain info if user is initialized and page is loaded
  useEffect(() => {
    if (router && router.query && isInitialized) {
      loadDomainInfo();
    }
  }, [router]);

  // Calculate cost every time domainInfo or duration changes
  useEffect(() => {
    getCost();
  }, [domainInfo, renewFor]);

  if (!domainInfo) return null;

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow Name Service - Manage Domain</title>
        <meta name="description" content="Flow Name Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className={styles.main}>
        <div>
          <h1>{domainInfo.name}</h1>
          <p>ID: {domainInfo.id}</p>
          <p>Owner: {domainInfo.owner}</p>
          <p>
            Created At:{' '}
            {new Date(
              parseInt(domainInfo.createdAt) * 1000
            ).toLocaleDateString()}
          </p>
          <p>
            Expires At:{' '}
            {new Date(
              parseInt(domainInfo.expiresAt) * 1000
            ).toLocaleDateString()}
          </p>
          <hr />
          <p>Bio: {domainInfo.bio ? domainInfo.bio : 'Not Set'}</p>
          <p>Address: {domainInfo.address ? domainInfo.address : 'Not Set'}</p>
        </div>
        <div>
          <h1>Update</h1>
          <div className={styles.inputGroup}>
            <span>Update Bio: </span>
            <input
              type="text"
              placeholder="Lorem ipsum..."
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
            <button onClick={updateBio} disabled={loading}>
              Update
            </button>
          </div>
          <br />
          <div className={styles.inputGroup}>
            <span>Update Address: </span>
            <input
              type="text"
              placeholder="0xabcdefgh"
              value={linkedAddr}
              onChange={e => setLinkedAddr(e.target.value)}
            />
            <button onClick={updateAddress} disabled={loading}>
              Update
            </button>
          </div>
          <h1>Renew</h1>
          <div className={styles.inputGroup}>
            <input
              type="number"
              placeholder="1"
              value={renewFor}
              onChange={e => setRenewFor(e.target.value)}
            />
            <span> years</span>
            <button onClick={renew} disabled={loading}>
              Renew Domain
            </button>
          </div>
          <p>Cost: {cost} FLOW</p>
          {loading && <p>Loading...</p>}
        </div>
      </main>
    </div>
  );
}
