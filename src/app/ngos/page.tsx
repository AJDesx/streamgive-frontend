import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { NgoExplorer } from '@/components/ngos/NgoExplorer';
import { getNgo, getNgos, type NgoProfile } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Explore NGOs',
  description: 'Browse verified NGOs accepting recurring, streaming donations on Stellar.',
};

export default async function NgosPage() {
  let ngos: NgoProfile[] = [];
  let loadError = false;

  try {
    const list = await getNgos();
    // No aggregate stats on the list endpoint — fetch each profile for its
    // stats. Same N+1 tradeoff already accepted on the platform impact page.
    //
    // allSettled, not all: one NGO's profile 5xx-ing or timing out must not
    // blank out the entire explorer (issue #213) — the rest of the list
    // still loaded fine and should still render.
    const results = await Promise.allSettled(list.map((ngo) => getNgo(ngo.id)));
    ngos = results
      .filter(
        (result): result is PromiseFulfilledResult<NgoProfile | null> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value)
      .filter((profile): profile is NgoProfile => profile !== null);
  } catch {
    loadError = true;
  }

  return (
    <>
      <Header />
      <main id="main" className="px-6 py-16 sm:px-12">
        <h1 className="text-2xl font-bold">Explore NGOs</h1>

        {loadError && (
          <p className="mt-4 text-red-600 dark:text-red-400">
            Couldn&apos;t reach the StreamGive API. Is the backend running?
          </p>
        )}

        {!loadError && (
          // NgoExplorer reads useSearchParams() to restore/sync filters in
          // the URL, which requires a Suspense boundary — otherwise it
          // forces the whole route into client-side rendering.
          <Suspense fallback={null}>
            <NgoExplorer ngos={ngos} />
          </Suspense>
        )}
      </main>
      <Footer />
    </>
  );
}
