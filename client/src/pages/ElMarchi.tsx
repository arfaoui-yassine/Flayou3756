import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ar } from "@/locales/ar";
import { useLocation } from "wouter";
import { ArrowRight, ShoppingBag, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: React.ReactNode;
  color: string;
}

const mockRewards: Reward[] = [
  {
    id: "jumia-100",
    name: "بطاقة جوميا",
    description: "رصيد 100 دينار على جوميا",
    points: 200,
    icon: "🛍️",
    color: "from-orange-600 to-orange-700",
  },
  {
    id: "glovo-50",
    name: "بطاقة جلوفو",
    description: "رصيد 50 دينار على جلوفو",
    points: 150,
    icon: "🍔",
    color: "from-green-600 to-green-700",
  },
  {
    id: "carrefour-75",
    name: "بطاقة كارفور",
    description: "رصيد 75 دينار على كارفور",
    points: 180,
    icon: "🏪",
    color: "from-blue-600 to-blue-700",
  },
  {
    id: "ooredoo-30",
    name: "رصيد أوريدو",
    description: "رصيد 30 دينار للهاتف",
    points: 100,
    icon: "📱",
    color: "from-red-600 to-red-700",
  },
  {
    id: "netflix-month",
    name: "نتفليكس شهر",
    description: "اشتراك نتفليكس لشهر كامل",
    points: 250,
    icon: "🎬",
    color: "from-red-700 to-red-800",
  },
  {
    id: "spotify-3months",
    name: "سبوتيفاي 3 أشهر",
    description: "اشتراك سبوتيفاي لثلاثة أشهر",
    points: 300,
    icon: "🎵",
    color: "from-green-700 to-green-800",
  },
];

export default function ElMarchi() {
  const [, setLocation] = useLocation();
  const [userPoints, setUserPoints] = useState(250);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [purchaseState, setPurchaseState] = useState<{
    rewardId: string | null;
    status: "idle" | "loading" | "success" | "error";
  }>({ rewardId: null, status: "idle" });

  const handlePurchaseClick = (reward: Reward) => {
    if (userPoints >= reward.points) {
      setSelectedReward(reward);
    } else {
      toast.error("نقاط غير كافية!");
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedReward) return;

    setPurchaseState({ rewardId: selectedReward.id, status: "loading" });

    setTimeout(() => {
      setUserPoints(prev => prev - selectedReward.points);
      setPurchaseState({ rewardId: selectedReward.id, status: "success" });
      toast.success(`تم شراء ${selectedReward.name} بنجاح!`);

      setTimeout(() => {
        setSelectedReward(null);
        setPurchaseState({ rewardId: null, status: "idle" });
      }, 2000);
    }, 1500);
  };

  const handleCancel = () => {
    setPurchaseState({ rewardId: null, status: "idle" });
    setSelectedReward(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="text-red-500 hover:text-red-600"
          >
            <ArrowRight className="mr-2" size={20} />
            {ar.back}
          </Button>
          <h1 className="text-4xl font-bold text-white">El Marchi</h1>
          <div className="w-20" />
        </div>

        {/* Points Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{ar.marchi.subtitle}</p>
              <p className="text-4xl font-bold mt-2">{userPoints} نقطة</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <ShoppingBag size={32} className="text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Rewards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {mockRewards.map((reward, index) => {
            const canAfford = userPoints >= reward.points;

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-gradient-to-br from-gray-900 to-black border rounded-2xl p-6 shadow-lg transition-all ${
                  canAfford
                    ? "border-white/10 hover:border-red-600/50"
                    : "border-white/5 opacity-60"
                }`}>
                  <div className="text-center">
                    {/* Icon */}
                    <div className="text-5xl mb-4" style={{ filter: 'grayscale(0%)' }}>{reward.icon}</div>

                    {/* Name & Description */}
                    <h3 className="text-white font-bold text-lg mb-2">{reward.name}</h3>
                    <p className="text-gray-400 text-sm mb-6">{reward.description}</p>

                    {/* Points Cost */}
                    <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3 mb-6">
                      <p className="text-red-500 font-bold text-lg">{reward.points} نقطة</p>
                    </div>

                    {/* Buy Button */}
                    {purchaseState.status === "success" && purchaseState.rewardId === reward.id ? (
                      <Button
                        disabled
                        className="w-full bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                      >
                        <Check size={20} />
                        تم الشراء
                      </Button>
                    ) : canAfford ? (
                      <Button
                        onClick={() => handlePurchaseClick(reward)}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg"
                      >
                        {ar.marchi.buy}
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full bg-gray-700 text-gray-400 font-bold rounded-lg flex items-center justify-center gap-2"
                      >
                        <AlertCircle size={20} />
                        نقاط غير كافية
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Purchase Confirmation Modal */}
      {selectedReward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="text-6xl mb-6">{selectedReward.icon}</div>

              <h2 className="text-2xl font-bold text-white mb-4">
                تأكيد الشراء
              </h2>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                <p className="text-white font-bold mb-2">{selectedReward.name}</p>
                <p className="text-red-500 font-bold text-lg">{selectedReward.points} نقطة</p>
              </div>

              <p className="text-gray-400 mb-8">
                هل أنت متأكد من رغبتك في شراء {selectedReward.name}؟
              </p>

              <div className="flex gap-4">
                <Button
                  onClick={handleCancel}
                  disabled={purchaseState.status === "loading"}
                  variant="outline"
                  className="flex-1 rounded-lg border-2 border-white/20 text-white hover:bg-white/5"
                >
                  {ar.cancel}
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  disabled={purchaseState.status === "loading"}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  {purchaseState.status === "loading" ? "جاري..." : ar.marchi.buy}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
