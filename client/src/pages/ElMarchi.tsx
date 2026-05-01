import React, { useState } from "react";
import { motion } from "framer-motion";
import { ar } from "@/locales/ar";
import { Check, X, ShoppingCart, Utensils, Store, Smartphone, Film, Music } from "lucide-react";
import { toast } from "sonner";

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: React.ElementType;
}

const mockRewards: Reward[] = [
  {
    id: "jumia-100",
    name: "بطاقة جوميا",
    description: "رصيد 100 دينار",
    points: 200,
    icon: ShoppingCart,
  },
  {
    id: "glovo-50",
    name: "بطاقة جلوفو",
    description: "رصيد 50 دينار",
    points: 150,
    icon: Utensils,
  },
  {
    id: "carrefour-75",
    name: "بطاقة كارفور",
    description: "رصيد 75 دينار",
    points: 180,
    icon: Store,
  },
  {
    id: "ooredoo-30",
    name: "رصيد أوريدو",
    description: "رصيد 30 دينار",
    points: 100,
    icon: Smartphone,
  },
  {
    id: "netflix-month",
    name: "نتفليكس شهر",
    description: "اشتراك شهر كامل",
    points: 250,
    icon: Film,
  },
  {
    id: "spotify-3months",
    name: "سبوتيفاي 3 أشهر",
    description: "اشتراك ثلاثة أشهر",
    points: 300,
    icon: Music,
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
        className="max-w-3xl mx-auto px-5 pt-12 pb-8"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-12">
          <p className="label-red mb-3">Marketplace</p>
          <h1 className="text-5xl font-bold text-white mb-2">السوق</h1>
          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-[#888] text-sm">رصيدك:</span>
            <span className="text-white text-2xl font-bold">{userPoints}</span>
            <span className="text-[#555] text-sm">نقطة</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="section-divider mb-10" />

        {/* Rewards Grid */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
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
                className={`text-center py-8 px-4 border transition-colors flex flex-col items-center justify-center ${
                  isPurchased
                    ? "border-green-800 bg-green-900/10"
                    : canAfford
                    ? "border-[#222] hover:border-[#ED1C24]/50"
                    : "border-[#151515] opacity-40"
                }`}
              >
                <reward.icon size={32} className="text-white/40 mb-4" />
                <h3 className="text-white font-semibold text-sm mb-1">{reward.name}</h3>
                <p className="text-[#666] text-xs mb-4">{reward.description}</p>
                <div className="text-[#ED1C24] font-bold text-sm">
                  {isPurchased ? (
                    <span className="text-green-500 flex items-center justify-center gap-1">
                      <Check size={14} />
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
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-5 z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm border border-[#222] bg-black p-8"
          >
            <div className="text-center flex flex-col items-center">
              <selectedReward.icon size={48} className="text-[#ED1C24] mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">
                تأكيد الشراء
              </h2>
              <p className="text-[#888] text-sm mb-6">{selectedReward.name}</p>

              <div className="border border-[#222] py-4 px-6 mb-8">
                <span className="text-[#ED1C24] font-bold text-2xl">
                  {selectedReward.points}
                </span>
                <span className="text-[#666] text-sm mr-2">نقطة</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={purchaseState.status === "loading"}
                  className="flex-1 border border-[#333] text-[#888] hover:text-white hover:border-[#555] py-3 transition-colors text-sm font-medium"
                >
                  {ar.cancel}
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={purchaseState.status === "loading"}
                  className="flex-1 bg-[#ED1C24] hover:bg-[#D91920] text-white py-3 transition-colors text-sm font-semibold"
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
