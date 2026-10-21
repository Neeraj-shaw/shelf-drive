import type { ReactNode } from 'react';

interface DriveFrameProps {
    sidebar: ReactNode;
    children: ReactNode;
}

/**
 * Desktop window frame: one floating rounded window holding the navigation
 * column and the content column. Shared by the live dashboard and the
 * development shell preview so both stay pixel-identical.
 */
export function DriveFrame({ sidebar, children }: DriveFrameProps) {
    return (
        <div className="drive-window">
            <div className="drive-window-sidebar">
                {sidebar}
            </div>
            <main className="drive-window-main">
                {children}
            </main>
        </div>
    );
}
