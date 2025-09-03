import { TheButton } from "@/shared/components/buttons/TheButton";
import { Modal } from "@/shared/components/Modal";
import { addUserToken } from "@/shared/lib/utils";
import { TriangleAlert } from "lucide-react";
import { AssetInfo } from "@soroswap/sdk";

export const TokenSelectorCustomAssetModal = ({
  isOpen,
  onClose,
  onSelect,
  customAsset,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (token: AssetInfo | null) => void;
  customAsset: AssetInfo;
}) => {
  const handleConfirmAddToken = async () => {
    try {
      await addUserToken(customAsset);
      onSelect?.(customAsset);
      onClose();
    } catch (error) {
      console.error("Error adding user token:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <div>
            <TriangleAlert className="size-16 text-red-400" />
          </div>
          <h3 className="text-primary text-lg font-semibold">Warning</h3>
        </div>

        <p className="text-secondary flex text-center text-sm">
          This token isn&apos;t traded on leading U.S. centralized exchanges or
          frequently swapped on Soroswap. Always conduct your own research
          before trading.
        </p>

        <div className="flex gap-2">
          {/* <TheButton onClick={handleConfirmAddToken} className="text-white"> */}
          <TheButton onClick={handleConfirmAddToken} className="text-white">
            I understand
          </TheButton>
        </div>
      </div>
    </Modal>
  );
};

//NUNA:CAPIOPSODD5QP4SJNIS4ASUWML4LH7ZEKTAPBJYZSMKXCATEKDZFKLHK
