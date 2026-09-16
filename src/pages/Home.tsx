import { Hero } from '../sections/Hero';
import { LiveAuctions } from '../sections/LiveAuctions';
import { Competition } from '../sections/Competition';
import { HowItWorks } from '../sections/HowItWorks';
import { PrivacyCompare } from '../sections/PrivacyCompare';
import { AuctionPreview } from '../sections/AuctionPreview';
import { CreatePreview } from '../sections/CreatePreview';
import { MidnightTech } from '../sections/MidnightTech';
import { FinalCta } from '../sections/FinalCta';

export default function Home() {
  return (
    <>
      <Hero />
      <LiveAuctions />
      <Competition />
      <HowItWorks />
      <PrivacyCompare />
      <AuctionPreview />
      <CreatePreview />
      <MidnightTech />
      <FinalCta />
    </>
  );
}
