"use client";

import React, { useEffect } from "react";

/**
 * UI5Provider: Initializes the SAP UI5 Web Components environment.
 * UI5 components are Custom Elements and require client-side registration.
 */
export function UI5Provider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initUI5 = async () => {
            // Import global assets (theme, i18n, icons)
            await import("@ui5/webcomponents/dist/Assets.js");
            await import("@ui5/webcomponents-fiori/dist/Assets.js");
            await import("@ui5/webcomponents-icons/dist/Assets.js");

            // Register essential components for the POC
            await import("@ui5/webcomponents/dist/Table.js");
            await import("@ui5/webcomponents/dist/TableColumn.js");
            await import("@ui5/webcomponents/dist/TableCell.js");
            await import("@ui5/webcomponents/dist/TableRow.js");
            await import("@ui5/webcomponents/dist/Input.js");
            await import("@ui5/webcomponents/dist/Button.js");
            await import("@ui5/webcomponents/dist/Badge.js");
            await import("@ui5/webcomponents/dist/Card.js");
            await import("@ui5/webcomponents/dist/Label.js");
            await import("@ui5/webcomponents-fiori/dist/ShellBar.js");
            await import("@ui5/webcomponents-fiori/dist/Timeline.js");
        };

        initUI5();
    }, []);

    return <>{children}</>;
}
