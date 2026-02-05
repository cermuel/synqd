import { BASE_URI } from "@/app/constants";

const BackCard = () => {
  return (
    <div className="p-4 text-center bg-white rounded-md w-75 max-sm:w-70 aspect-square flex flex-col items-center justify-center">
      <h1 className="font-semibold tracking-wide leading-4">Manual</h1>
      <p className="text-sm font-medium mb-3">
        Use this URL on the other device
      </p>
      <div className="flex-1 w-full h-full bg-[#F5F5F5] flex flex-col justify-center gap-5 py-6">
        <h1 className="font-semibold tracking- text-[15px] leading-4">
          {BASE_URI}/synq
        </h1>
        <p className="text-sm font-medium">Enter the code below</p>
        <div>
          <h1 className="font-bold tracking-wide text-2xl leading-4 ">
            SHA-D47
          </h1>
          <p className="text-xs font-medium tracking-wide mt-1 text-[#444]">
            Expires in 30s
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackCard;
