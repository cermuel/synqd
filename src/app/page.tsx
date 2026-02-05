import BackCard from "@/components/faces/back";
import FrontCard from "@/components/faces/front";
import AppWrapper from "@/components/layout/app-wrapper";
import ShareCard from "@/context/share-card";
import { createRoom } from "@/services/synqd.service";

export default async function Home() {
  // const room = await createRoom();

  return (
    <AppWrapper>
      <div className="flex-1 h-full flex-col flex items-center py-6">
        <h1 className="text-3xl sm:text-5xl md:text-6xl mb-10 font-bold tracking-tight text-white text-center">
          Share files instantly
          <br />
          <span className="text-[#C79101] text-3xl sm:text-4xl md:text-5xl">
            no cloud, no limits
          </span>
        </h1>
        <ShareCard frontContent={<FrontCard />} backContent={<BackCard />} />
      </div>
    </AppWrapper>
  );
}
