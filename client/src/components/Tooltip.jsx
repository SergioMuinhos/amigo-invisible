import { useId, useRef, useState } from 'react';

/**
 * Modern Tooltip component using the Popover API and CSS Anchor Positioning.
 * 
 * Follows modern-web-guidance:
 * - Guides: `ui-atoms/position-aware-tooltips`, `ui-behaviors/interest-triggered-tooltips`
 * - Renders in the browser's top-layer via `popover="hint"` (never clipped by overflow:hidden).
 * - Spatially anchors to the trigger via CSS Anchor Positioning (`position-area: block-start`, `position-try-fallbacks: flip-block`).
 * - Accessible: exposes `role="tooltip"`, `aria-describedby`, and manages hover/focus states.
 */
export default function Tooltip({ children, text, className = '' }) {
  const rawId = useId();
  // Generate safe CSS identifier without colons
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const tooltipId = `tooltip-${cleanId}`;
  const anchorName = `--anchor-${cleanId}`;

  const popoverRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const show = () => {
    setIsOpen(true);
    if (popoverRef.current) {
      try {
        if (typeof popoverRef.current.showPopover === 'function') {
          popoverRef.current.showPopover();
        }
      } catch {
        // Popover might already be open or unsupported
      }
    }
  };

  const hide = () => {
    setIsOpen(false);
    if (popoverRef.current) {
      try {
        if (typeof popoverRef.current.hidePopover === 'function') {
          popoverRef.current.hidePopover();
        }
      } catch {
        // Popover might already be closed
      }
    }
  };

  if (!text) return children;

  return (
    <span
      className={`inline-flex items-center relative ${className}`}
      style={{ anchorName }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={isOpen ? tooltipId : undefined}
    >
      {children}
      <div
        ref={popoverRef}
        id={tooltipId}
        popover="hint"
        role="tooltip"
        className="modern-tooltip"
        style={{
          positionAnchor: anchorName,
        }}
      >
        <span className="modern-tooltip-content">
          {text}
        </span>
      </div>
    </span>
  );
}
