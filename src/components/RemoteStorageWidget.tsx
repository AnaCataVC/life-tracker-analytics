import React, { useEffect, useRef } from 'react';
import Widget from 'remotestorage-widget';
import { rs } from '../utils/remoteStorage';

export default function RemoteStorageWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (widgetRef.current && widgetRef.current.children.length === 0) {
      // Initialize the official remoteStorage widget only if not already attached
      const widget = new Widget(rs, {
        leaveOpen: false,
        autoCloseAfter: 2000
      });

      // Attach it to the specific DOM node
      widget.attach(widgetRef.current);
    }

    return () => {
      // Intentionally do not clear innerHTML here. 
      // This allows the widget to survive React Strict Mode's mount/unmount cycle without duplicating.
    };
  }, []);

  return (
    <div className="flex items-center justify-center p-2">
      <div ref={widgetRef} id="remotestorage-widget-anchor"></div>
    </div>
  );
}
