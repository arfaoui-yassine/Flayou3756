import React, { useState } from "react";
import { motion } from "framer-motion";
import { ar } from "@/locales/ar";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  imageUrl: string;
}

const mockRewards: Reward[] = [
  {
    id: "jumia-100",
    name: "بطاقة جوميا",
    description: "رصيد 100 دينار",
    points: 200,
    imageUrl: "/assets/beji/jumia.png",
  },
  {
    id: "glovo-50",
    name: "بطاقة جلوفو",
    description: "رصيد 50 دينار",
    points: 150,
    imageUrl: "/assets/beji/glovo.png",
  },
  {
    id: "carrefour-75",
    name: "بطاقة كارفور",
    description: "رصيد 75 دينار",
    points: 180,
    imageUrl: "/assets/beji/carrefour.png",
  },
  {
    id: "ooredoo-30",
    name: "رصيد أوريدو",
    description: "رصيد 30 دينار",
    points: 100,
    imageUrl: "/assets/beji/ooredoo.png",
  },
  {
    id: "netflix-month",
    name: "نتفليكس شهر",
    description: "اشتراك شهر كامل",
    points: 250,
    imageUrl: "/assets/beji/netflix.png",
  },
  {
    id: "spotify-3months",
    name: "سبوتيفاي 3 أشهر",
    description: "اشتراك ثلاثة أشهر",
    points: 300,
    imageUrl: "/assets/beji/spotify.png",
  },
];

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ElMarchi() {
  const [userPoints, setUserPoints] = useState(250);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [purchaseState, setPurchaseState] = useState<{
    rewardId: string | null;
    status: "idle" | "loading" | "success";
  }>({ rewardId: null, status: "idle" });

  const handlePurchaseClick = (reward: Reward) => {
    if (userPoints >= reward.points) {
      setSelectedReward(reward);
    } else {
      toast.error("نقاط غير كافية");
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedReward) return;

    setPurchaseState({ rewardId: selectedReward.id, status: "loading" });

    setTimeout(() => {
      setUserPoints(prev => prev - selectedReward.points);
      setPurchaseState({ rewardId: selectedReward.id, status: "success" });
      toast.success(`تم شراء ${selectedReward.name} بنجاح`);

      setTimeout(() => {
        setSelectedReward(null);
        setPurchaseState({ rewardId: null, status: "idle" });
      }, 1500);
    }, 1200);
  };

  const handleCancel = () => {
    setPurchaseState({ rewardId: null, status: "idle" });
    setSelectedReward(null);
  };

  return (
    <div className="min-h-screen">
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="max-w-lg mx-auto px-5 pt-10 pb-8"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-8 flex items-center gap-4">
          <img src="/assets/beji/marketplace.png" alt="السوق" className="w-14 h-14 object-contain" draggable={false} />
          <div>
            <p className="text-[#ED1C24] text-[10px] uppercase tracking-[0.2em] font-black mb-1">عَمّ الباجي</p>
            <h1 className="text-3xl font-bold text-white">السوق</h1>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[#888] text-xs">رصيدك:</span>
              <span className="text-white text-xl font-bold">{userPoints}</span>
              <span className="text-[#555] text-xs">نقطة</span>
            </div>
          </div>
        </motion.div>

        {/* Rewards Grid */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-2 gap-3"
        >
          {mockRewards.map(reward => {
            const canAfford = userPoints >= reward.points;
            const isPurchased = purchaseState.status === "success" && purchaseState.rewardId === reward.id;

            return (
              <motion.button
                key={reward.id}
                variants={fadeUp}
                onClick={() => !isPurchased && handlePurchaseClick(reward)}
                disabled={isPurchased}
                className={`text-center py-5 px-3 border rounded-xl transition-all flex flex-col items-center justify-center gap-2 ${
                  isPurchased
                    ? "border-green-800 bg-green-900/10"
                    : canAfford
                    ? "border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#ED1C24]/40 hover:bg-[#0f0f0f]"
                    : "border-[#111] bg-[#080808] opacity-40"
                }`}
              >
                {/* Brand Logo */}
                <div className="w-14 h-14 rounded-xl bg-[#111] border border-[#1a1a1a] flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>

                <h3 className="text-white font-bold text-xs">{reward.name}</h3>
                <p className="text-[#555] text-[10px]">{reward.description}</p>

                <div className="text-[#ED1C24] font-black text-xs mt-1">
                  {isPurchased ? (
                    <span className="text-green-500 flex items-center justify-center gap-1">
                      <Check size={12} />
                      تم
                    </span>
                  ) : (
                    `${reward.points} نقطة`
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Purchase Confirmation Overlay */}
      {selectedReward && purchaseState.status !== "success" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-sm border border-[#222] bg-[#0a0a0a] rounded-xl p-8"
          >
            <div className="text-center flex flex-col items-center">
              {/* Brand Logo */}
              <div className="w-20 h-20 rounded-2xl bg-[#111] border border-[#1a1a1a] flex items-center justify-center p-3 mb-5 overflow-hidden">
                <img
                  src={selectedReward.imageUrl}
                  alt={selectedReward.name}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>

              <h2 className="text-lg font-bold text-white mb-1">
                تأكيد الشراء
              </h2>
              <p className="text-[#888] text-sm mb-5">{selectedReward.name}</p>

              <div className="border border-[#1a1a1a] rounded-lg py-3 px-6 mb-6 bg-[#080808]">
                <span className="text-[#ED1C24] font-black text-2xl">
                  {selectedReward.points}
                </span>
                <span className="text-[#666] text-sm mr-2">نقطة</span>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancel}
                  disabled={purchaseState.status === "loading"}
                  className="flex-1 border border-[#222] hover:border-[#333] text-[#888] hover:text-white py-3 rounded-lg transition-colors text-sm font-medium"
                >
                  {ar.cancel}
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={purchaseState.status === "loading"}
                  className="flex-1 bg-[#ED1C24] hover:bg-[#D91920] text-white py-3 rounded-lg transition-colors text-sm font-semibold"
                >
                  {purchaseState.status === "loading" ? "جاري..." : "تأكيد"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
