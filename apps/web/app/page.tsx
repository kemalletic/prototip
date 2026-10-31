import { Collection } from "@/components/home/Collection";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Lookbook } from "@/components/home/Lookbook";

export default function Home() {
  return (
    <>
      <Hero />
      <Collection />
      <Lookbook />
      <Footer />
    </>
  );
}
