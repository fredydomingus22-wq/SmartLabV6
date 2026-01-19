/// <reference types="react" />

declare global {
    namespace JSX {
        interface UI5HTMLElement extends React.HTMLAttributes<HTMLElement> {
            slot?: string;
            class?: string;
            style?: React.CSSProperties;
        }

        interface UI5ShellBar extends UI5HTMLElement {
            'primary-title'?: string;
            'secondary-title'?: string;
            'show-notifications'?: boolean;
        }

        interface UI5Button extends UI5HTMLElement {
            icon?: string;
            design?: 'Default' | 'Emphasized' | 'Positive' | 'Negative' | 'Transparent' | 'Attention';
            disabled?: boolean;
            onClick?: (e: any) => void;
        }

        interface UI5Avatar extends UI5HTMLElement {
            icon?: string;
            shape?: 'Circle' | 'Square';
            'color-scheme'?: string;
        }

        interface UI5SideNavigation extends UI5HTMLElement {
            collapsed?: boolean;
        }

        interface UI5SideNavigationItem extends UI5HTMLElement {
            text?: string;
            icon?: string;
            selected?: boolean;
            expanded?: boolean;
            onClick?: (e: any) => void;
        }

        interface UI5DynamicPage extends UI5HTMLElement {
            'header-snapped-on-scroll'?: boolean;
            'show-footer'?: boolean;
        }

        interface UI5DynamicPageTitle extends UI5HTMLElement { }
        interface UI5DynamicPageHeader extends UI5HTMLElement { }

        interface UI5Breadcrumbs extends UI5HTMLElement { }
        interface UI5BreadcrumbsItem extends UI5HTMLElement { }

        interface UI5Card extends UI5HTMLElement { }
        interface UI5CardHeader extends UI5HTMLElement {
            title?: string;
            subtitle?: string;
            status?: string;
        }

        interface UI5Table extends UI5HTMLElement {
            mode?: 'None' | 'SingleSelect' | 'MultiSelect';
        }
        interface UI5TableHeaderRow extends UI5HTMLElement { }
        interface UI5TableHeaderCell extends UI5HTMLElement { }
        interface UI5TableRow extends UI5HTMLElement { }
        interface UI5TableCell extends UI5HTMLElement { }

        interface UI5Input extends UI5HTMLElement {
            value?: string | number;
            placeholder?: string;
            'value-state'?: 'None' | 'Success' | 'Warning' | 'Error' | 'Information' | 'Critical';
            disabled?: boolean;
            readonly?: boolean;
            required?: boolean;
            type?: string;
            onInput?: (e: any) => void;
        }

        interface UI5Label extends UI5HTMLElement {
            'show-colon'?: boolean;
            required?: boolean;
        }

        interface UI5Tag extends UI5HTMLElement {
            design?: 'Neutral' | 'Positive' | 'Negative' | 'Critical' | 'Set1' | 'Set2';
            'color-scheme'?: string;
        }

        interface UI5Icon extends UI5HTMLElement {
            name?: string;
            color?: string;
        }

        interface UI5MessageStrip extends UI5HTMLElement {
            design?: 'Information' | 'Positive' | 'Negative' | 'Warning';
            'hide-close-button'?: boolean;
            icon?: string;
        }

        interface UI5Wizard extends UI5HTMLElement { }
        interface UI5WizardStep extends UI5HTMLElement {
            title?: string;
            icon?: string;
            selected?: boolean;
            disabled?: boolean;
        }

        interface UI5Select extends UI5HTMLElement { }
        interface UI5Option extends UI5HTMLElement {
            selected?: boolean;
        }

        interface UI5Checkbox extends UI5HTMLElement {
            text?: string;
            checked?: boolean;
        }

        interface IntrinsicElements {
            'ui5-shellbar': UI5ShellBar;
            'ui5-button': UI5Button;
            'ui5-avatar': UI5Avatar;
            'ui5-avatar-group': any;
            'ui5-side-navigation': UI5SideNavigation;
            'ui5-side-navigation-item': UI5SideNavigationItem;
            'ui5-side-navigation-sub-item': UI5SideNavigationItem;
            'ui5-side-navigation-group': any;
            'ui5-dynamic-page': UI5DynamicPage;
            'ui5-dynamic-page-title': UI5DynamicPageTitle;
            'ui5-dynamic-page-header': UI5DynamicPageHeader;
            'ui5-breadcrumbs': UI5Breadcrumbs;
            'ui5-breadcrumbs-item': UI5BreadcrumbsItem;
            'ui5-tag': UI5Tag;
            'ui5-icon': UI5Icon;
            'ui5-card': UI5Card;
            'ui5-card-header': UI5CardHeader;
            'ui5-bar': UI5HTMLElement;
            'ui5-table': UI5Table;
            'ui5-table-header-row': UI5TableHeaderRow;
            'ui5-table-header-cell': UI5TableHeaderCell;
            'ui5-table-row': UI5TableRow;
            'ui5-table-cell': UI5TableCell;
            'ui5-input': UI5Input;
            'ui5-label': UI5Label;
            'ui5-busy-indicator': UI5HTMLElement & { active?: boolean; size?: string };
            'ui5-menu': any;
            'ui5-menu-item': any;
            'ui5-menu-separator': any;
            'ui5-popover': any;
            'ui5-responsive-popover': any;
            'ui5-timeline': any;
            'ui5-timeline-item': any;
            'ui5-tabcontainer': UI5HTMLElement & { collapsed?: boolean; fixed?: boolean };
            'ui5-tab': UI5HTMLElement & { text?: string; icon?: string; selected?: boolean };
            'ui5-tab-separator': any;
            'ui5-checkbox': UI5Checkbox;
            'ui5-select': UI5Select;
            'ui5-option': UI5Option;
            'ui5-datepicker': any;
            'ui5-daterange-picker': any;
            'ui5-datetime-picker': any;
            'ui5-time-picker': any;
            'ui5-message-strip': UI5MessageStrip;
            'ui5-toast': UI5HTMLElement & { duration?: number; placement?: string; onClose?: () => void };
            'ui5-wizard': UI5Wizard;
            'ui5-wizard-step': UI5WizardStep;
            'ui5-dialog': any;
            'ui5-list': UI5HTMLElement & { mode?: string };
            'ui5-li': UI5HTMLElement & { icon?: string; description?: string; 'additional-text'?: string; selected?: boolean; onClick?: (e: any) => void };
            'ui5-li-custom': any;
            'ui5-li-group': any;
            'ui5-panel': any;
            'ui5-switch': any;
            'ui5-textarea': any;
            'ui5-title': UI5HTMLElement & { level?: string };
            'ui5-link': any;
            'ui5-progress-indicator': any;
            'ui5-rating-indicator': any;
            'ui5-segment-button': any;
            'ui5-segmented-button-item': any;
            'ui5-slider': any;
            'ui5-range-slider': any;
            'ui5-step-input': any;
            'ui5-file-uploader': any;
            'ui5-multi-combobox': any;
            'ui5-color-palette': any;
            'ui5-color-picker': any;
            'ui5-combo-box': any;
            'ui5-combo-box-item': any;
            'ui5-combo-box-group-item': any;
            'ui5-multi-input': any;
            'ui5-token': any;
        }
    }
}
