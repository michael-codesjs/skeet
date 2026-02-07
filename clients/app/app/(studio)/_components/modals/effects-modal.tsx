import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface EffectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackIndex: number;
  clipIndex: number;
}

export function EffectsModal({ isOpen, onClose, trackIndex, clipIndex }: EffectsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Effects"
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} className="hover:bg-white/10 text-white">
            Close
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 py-4 px-6">
        {['Blur', 'Grayscale', 'Sepia', 'Glitch', 'Zoom'].map((effect) => (
          <button
            key={effect}
            className="h-20 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-sm font-medium text-white"
          >
            {effect}
          </button>
        ))}
      </div>
    </Modal>
  );
}
