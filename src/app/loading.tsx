import AppWrapper from "@/components/layout/app-wrapper";

const LoadingHome = () => {
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

        <div className="p-4 text-center bg-white rounded-md w-75 max-sm:w-70 aspect-400/370 sm:aspect-400/350 flex flex-col items-center justify-center">
          <h1 className="font-bold animate-pulse text-[#C79101]">
            Setting up Synq connection
          </h1>
        </div>
      </div>
    </AppWrapper>
  );
};

export default LoadingHome;
