import { BASE_URI } from "@/app/constants";

import QRCode from "react-qr-code";

const FrontCard = () => {
  return (
    <div className="p-4 text-center bg-white rounded-md w-75 max-sm:w-70 aspect-400/320 sm:aspect-400/350 flex flex-col items-center justify-center">
      <h1 className="font-semibold tracking-wide leading-4">Scan Me</h1>
      <p className="text-sm font-medium mb-3">Scan to connect your device</p>
      <div className="flex-1 w-full h-full">
        <QRCode
          value={`${BASE_URI}/SHAD47?mode=receiver`}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default FrontCard;
