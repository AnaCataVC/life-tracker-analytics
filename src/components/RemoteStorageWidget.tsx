import React, { useEffect, useRef } from 'react';
import Widget from 'remotestorage-widget';
import { rs } from '../utils/remoteStorage';

export default function RemoteStorageWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the official remoteStorage widget
    const widget = new Widget(rs, {
      leaveOpen: false,
      autoCloseAfter: 2000
    });

    // Attach it to the specific DOM node
    if (widgetRef.current) {
      widget.attach(widgetRef.current);
    }

    return () => {
      // Cleanup: Since the widget might not have a clean detach method, 
      // we can clear the inner HTML if the component unmounts to prevent duplicates.
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center p-2">
      <div ref={widgetRef} id="remotestorage-widget-anchor"></div>
    </div>
  );
}
