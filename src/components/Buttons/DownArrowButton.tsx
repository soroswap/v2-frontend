export default function DownArrowButton() {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 z-20">
        <div className="bg-[#CFFFD9] rounded-full p-2 flex items-center justify-center border-4 border-[#181A25]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#232136"
            className="h-6 w-6"
          >
            <line
              x1="12"
              y1="5"
              x2="12"
              y2="19"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <polyline
              points="19 12 12 19 5 12"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }