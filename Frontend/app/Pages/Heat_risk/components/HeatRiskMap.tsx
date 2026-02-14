import dynamic from "next/dynamic";

const HeatRiskMap = dynamic(() => import("./HeatRiskMapClient"), {
  ssr: false,
});

export default HeatRiskMap;

