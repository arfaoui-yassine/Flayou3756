import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black px-5">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center mb-10">
          <div className="relative">
            <AlertCircle className="relative h-20 w-20 text-[#ED1C24]" />
          </div>
        </div>

        <p className="label-red mb-4">Error 404</p>
        
        <h1 className="text-6xl font-black text-white leading-[0.95] tracking-tight mb-6">
          PAGE<br />
          <span className="text-outline">NOT FOUND</span>
        </h1>

        <p className="text-[#888] text-lg leading-relaxed mb-12">
          المعذرة، الصفحة اللي تلوج عليها مش موجودة.<br />
          يمكن تبدلت ولا تفسخت.
        </p>

        <button
          onClick={handleGoHome}
          className="w-full bg-[#ED1C24] hover:bg-[#D91920] text-white font-bold py-4 px-8 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          رجع للبيت
        </button>
      </div>
    </div>
  );
}
