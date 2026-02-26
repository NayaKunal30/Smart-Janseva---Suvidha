import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md">
      <div className="loader-container">
        <div className="jimu-primary-loading" />
      </div>
      <style>{`
        .loader-container {
          position: relative;
          width: 60px;
          height: 40px;
        }

        .jimu-primary-loading:before,
        .jimu-primary-loading:after {
          position: absolute;
          top: 0;
          content: '';
        }

        .jimu-primary-loading:before {
          left: -20px;
        }

        .jimu-primary-loading:after {
          left: 20px;
          animation-delay: 0.32s !important;
        }

        .jimu-primary-loading:before,
        .jimu-primary-loading:after,
        .jimu-primary-loading {
          background: #cc5500; /* Theme Saffron (Orangish) */
          animation: loading-keys-app-loading 0.8s infinite ease-in-out;
          width: 12px;
          height: 32px;
          border-radius: 4px;
        }

        .jimu-primary-loading {
          text-indent: -9999em;
          margin: auto;
          position: absolute;
          right: calc(50% - 6px);
          top: calc(50% - 16px);
          animation-delay: 0.16s !important;
        }

        @keyframes loading-keys-app-loading {
          0%,
          80%,
          100% {
            opacity: .75;
            box-shadow: 0 0 #cc5500;
            height: 32px;
            background: #cc5500;
          }

          40% {
            opacity: 1;
            box-shadow: 0 -8px rgba(204, 85, 0, 0.3);
            height: 40px;
            background: #e65100; /* Deeper Orange highlight */
          }
          
          60% {
            background: #ff8f00; /* Vibrant Orange accent */
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
