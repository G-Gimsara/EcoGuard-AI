import dynamic from "next/dynamic";

const HeatRiskMap = dynamic(() => import("../components/HeatRiskMapClient"), {
  ssr: false,
});

export default HeatRiskMap;

