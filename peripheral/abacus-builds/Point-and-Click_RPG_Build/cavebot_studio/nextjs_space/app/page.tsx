import dynamic from 'next/dynamic';

const StudioApp = dynamic(() => import('@/components/studio/studio-app'), { ssr: false });

export default function Home() {
  return <StudioApp />;
}
