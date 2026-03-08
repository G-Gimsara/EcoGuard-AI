import HeatAlertDashboard from "../components/AleartDashboard";
import Navigation from "../components/Navigation";

export default function RegisterPage() {
  return (
    // Changed to flex-col to stack Nav and Dashboard vertically
    // Removed items-center/justify-center from the main wrapper so Nav stays at the top
    <div className="min-h-screen bg-gray-100 flex flex-col">
      
      {/* 1. Navigation stays at the very top */}
      <Navigation />
      
      {/* 2. Container for the Dashboard */}
      <div className="flex-1 flex items-center justify-center p-4">
         <HeatAlertDashboard />
      </div>
      
    </div>
  );
}