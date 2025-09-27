interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
}

export default function VideoModal({ isOpen, onClose, videoSrc }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-lg max-w-3xl w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 text-gray-600 hover:text-pink-500 transition text-2xl font-bold"
        >
          ✕
        </button>

        <div className="w-full">
          <video
            src={videoSrc}
            controls
            autoPlay
            className="w-full rounded-b-2xl"
          />
        </div>
      </div>
    </div>
  );
}