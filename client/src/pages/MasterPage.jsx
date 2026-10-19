import React from 'react';
import { Helmet } from 'react-helmet-async';
import MasterDataManager from '../components/master/MasterDataManager.jsx';

export default function MasterPage() {
  return (
    <section className="space-y-4">
      <Helmet>
        <title>Master Catalogs & 24h Cache | Lab Expert LIS</title>
        <meta
          name="description"
          content="Administration console for test catalogs, doctor referrals, branches, and 24-hour AWS cache management."
        />
      </Helmet>
      <MasterDataManager />
    </section>
  );
}
