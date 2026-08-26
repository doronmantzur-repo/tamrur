// React

// External libraries

// Internal application modules

// Styles

/**
 * The reports-folder card's "בחר תיקייה"/"שנה תיקייה" action — a 3D
 * hover-open folder animation. Self-contained: styles are injected via its
 * own `<style>` tag and scaled through a `--folder-scale` CSS variable
 * derived from `size` (default 240, the original design's native size),
 * rather than hardcoded pixel values — so it can be resized via a prop
 * instead of rewriting CSS. Colors are the original hand-picked amber/gray
 * palette, not yet reskinned to the app's own CSS variables.
 *
 * @param {{
 *   size?: number,
 *   label?: string,
 *   onClick: () => void,
 *   className?: string,
 * }} props
 * @returns {JSX.Element} The 3D folder button.
 */
const Folder3DButton = ({ size = 240, label, onClick, className = "", ...rest }) => {
  const scale = size / 240;

  return (
    <>
      <style>{`
        .app-folder3d {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
          font-family: inherit;
          color: var(--app-color-text);
        }

        .app-folder3d-file {
          position: relative;
          display: block;
          width: calc(240px * var(--folder-scale));
          height: calc(160px * var(--folder-scale));
          transform-origin: bottom;
          perspective: calc(1500px * var(--folder-scale));
        }

        .app-folder3d-back {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          background: #d97706;
          border-radius: calc(18px * var(--folder-scale));
          border-top-left-radius: 0;
          transition: 0.3s ease;
        }

        .app-folder3d-back::after {
          content: "";
          position: absolute;
          bottom: 99%;
          left: 0;
          width: calc(80px * var(--folder-scale));
          height: calc(16px * var(--folder-scale));
          background: #d97706;
          border-radius: calc(16px * var(--folder-scale)) calc(16px * var(--folder-scale)) 0 0;
        }

        .app-folder3d-back::before {
          content: "";
          position: absolute;
          top: calc(-15px * var(--folder-scale));
          left: calc(75.5px * var(--folder-scale));
          width: calc(16px * var(--folder-scale));
          height: calc(16px * var(--folder-scale));
          background: #d97706;
          clip-path: polygon(0 35%, 0% 100%, 50% 100%);
        }

        .app-folder3d-paper {
          position: absolute;
          display: block;
          inset: calc(4px * var(--folder-scale));
          border-radius: calc(18px * var(--folder-scale));
          transform-origin: bottom;
          transition: 0.3s ease;
        }

        .app-folder3d-paper-3 { background: #c7c7d1; }
        .app-folder3d-paper-2 { background: #e4e4e7; }
        .app-folder3d-paper-1 { background: #f4f4f5; }

        .app-folder3d-front {
          position: absolute;
          bottom: 0;
          left: 0;
          display: block;
          width: 100%;
          height: calc(156px * var(--folder-scale));
          background: linear-gradient(to top, #f59e0b, #fbbf24);
          border-radius: calc(18px * var(--folder-scale));
          border-top-right-radius: 0;
          transform-origin: bottom;
          transition: 0.3s ease;
        }

        .app-folder3d-front::after {
          content: "";
          position: absolute;
          bottom: 99%;
          right: 0;
          width: calc(146px * var(--folder-scale));
          height: calc(16px * var(--folder-scale));
          background: #fbbf24;
          border-radius: calc(16px * var(--folder-scale)) calc(16px * var(--folder-scale)) 0 0;
        }

        .app-folder3d-front::before {
          content: "";
          position: absolute;
          top: calc(-10px * var(--folder-scale));
          right: calc(142px * var(--folder-scale));
          width: calc(12px * var(--folder-scale));
          height: calc(12px * var(--folder-scale));
          background: #fbbf24;
          clip-path: polygon(100% 14%, 50% 100%, 100% 100%);
        }

        .app-folder3d:hover .app-folder3d-back,
        .app-folder3d:focus-visible .app-folder3d-back {
          box-shadow: 0 calc(20px * var(--folder-scale)) calc(40px * var(--folder-scale)) rgba(0, 0, 0, 0.2);
        }

        .app-folder3d:hover .app-folder3d-paper-3,
        .app-folder3d:focus-visible .app-folder3d-paper-3 { transform: rotateX(-20deg); }
        .app-folder3d:hover .app-folder3d-paper-2,
        .app-folder3d:focus-visible .app-folder3d-paper-2 { transform: rotateX(-30deg); }
        .app-folder3d:hover .app-folder3d-paper-1,
        .app-folder3d:focus-visible .app-folder3d-paper-1 { transform: rotateX(-38deg); }

        .app-folder3d:hover .app-folder3d-front,
        .app-folder3d:focus-visible .app-folder3d-front {
          transform: rotateX(-46deg) translateY(1px);
          box-shadow:
            inset 0 calc(20px * var(--folder-scale)) calc(40px * var(--folder-scale)) #fbbf24,
            inset 0 calc(-20px * var(--folder-scale)) calc(40px * var(--folder-scale)) #d97706;
        }

        .app-folder3d-label {
          /* Deliberately not scaled by --folder-scale, unlike everything else
             here — at button-size (scale ~0.2) proportional text becomes
             unreadably small. Real label now (the same choose/change-folder
             text PickFolderButton shows), not the original decorative
             "Hover over" hint, so it's fully opaque, not faded. */
          font-size: 0.75rem;
          font-weight: 600;
          color: currentColor;
          white-space: nowrap;
        }
      `}</style>

      <button
        type="button"
        className={`app-folder3d ${className}`}
        style={{ "--folder-scale": scale }}
        aria-label={label ?? "בחר תיקייה"}
        onClick={onClick}
        {...rest}
      >
        <span className="app-folder3d-file">
          <span className="app-folder3d-back" />
          <span className="app-folder3d-paper app-folder3d-paper-3" />
          <span className="app-folder3d-paper app-folder3d-paper-2" />
          <span className="app-folder3d-paper app-folder3d-paper-1" />
          <span className="app-folder3d-front" />
        </span>
        {label ? <span className="app-folder3d-label">{label}</span> : null}
      </button>
    </>
  );
};

export default Folder3DButton;
