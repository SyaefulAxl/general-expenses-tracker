// icons.jsx — Lucide-style stroke icons inline (so no network deps)
// 24x24 viewBox, 1.75 stroke; pass size + className.

const I = ({ children, size = 16, className = '', style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
       className={`icon ${className}`} style={style} aria-hidden="true">
    {children}
  </svg>
);

const IconHome     = (p) => <I {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h4v-6h6v6h4V10"/></I>;
const IconList     = (p) => <I {...p}><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></I>;
const IconCoins    = (p) => <I {...p}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></I>;
const IconHistory  = (p) => <I {...p}><path d="M3 12a9 9 0 1 0 3-6.74"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></I>;
const IconShield   = (p) => <I {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></I>;
const IconPlus     = (p) => <I {...p}><path d="M12 5v14"/><path d="M5 12h14"/></I>;
const IconSearch   = (p) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></I>;
const IconFilter   = (p) => <I {...p}><path d="M3 4h18l-7 9v7l-4-2v-5L3 4z"/></I>;
const IconDownload = (p) => <I {...p}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></I>;
const IconUpload   = (p) => <I {...p}><path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/></I>;
const IconCheck    = (p) => <I {...p}><path d="m5 12 5 5 9-11"/></I>;
const IconX        = (p) => <I {...p}><path d="m18 6-12 12"/><path d="m6 6 12 12"/></I>;
const IconEdit     = (p) => <I {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></I>;
const IconTrash    = (p) => <I {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></I>;
const IconMore     = (p) => <I {...p}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></I>;
const IconEye      = (p) => <I {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></I>;
const IconSend     = (p) => <I {...p}><path d="m22 2-7 20-4-9-9-4 20-7z"/></I>;
const IconArrowRt  = (p) => <I {...p}><path d="M5 12h14"/><path d="m13 5 7 7-7 7"/></I>;
const IconArrowDn  = (p) => <I {...p}><path d="M12 5v14"/><path d="m5 13 7 7 7-7"/></I>;
const IconArrowUp  = (p) => <I {...p}><path d="M12 19V5"/><path d="m5 11 7-7 7 7"/></I>;
const IconCalendar = (p) => <I {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/></I>;
const IconUser     = (p) => <I {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></I>;
const IconUsers    = (p) => <I {...p}><circle cx="9" cy="8" r="4"/><circle cx="17" cy="9" r="3"/><path d="M2 21c0-4 3.5-7 7-7s7 3 7 7"/><path d="M16 14c3 0 6 2 6 6"/></I>;
const IconWallet   = (p) => <I {...p}><path d="M4 7V6a2 2 0 0 1 2-2h12v4"/><path d="M2 9h18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z"/><circle cx="17" cy="14.5" r="1.2"/></I>;
const IconReceipt  = (p) => <I {...p}><path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2V3z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></I>;
const IconPaperclip= (p) => <I {...p}><path d="m21 12-9 9a5 5 0 0 1-7-7L13 6a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l8-8"/></I>;
const IconChevDn   = (p) => <I {...p}><path d="m6 9 6 6 6-6"/></I>;
const IconChevRt   = (p) => <I {...p}><path d="m9 6 6 6-6 6"/></I>;
const IconLogout   = (p) => <I {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></I>;
const IconBell     = (p) => <I {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></I>;
const IconMoon     = (p) => <I {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></I>;
const IconSun      = (p) => <I {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></I>;
const IconBan      = (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></I>;
const IconBank     = (p) => <I {...p}><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 10v11"/><path d="M19 10v11"/><path d="M9 10v11"/><path d="M15 10v11"/><path d="m12 3 9 6H3l9-6z"/></I>;
const IconCash     = (p) => <I {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v.01"/><path d="M18 14v.01"/></I>;
const IconAlert    = (p) => <I {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></I>;
const IconInfo     = (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></I>;
const IconRefresh  = (p) => <I {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></I>;
const IconTrend    = (p) => <I {...p}><path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/></I>;
const IconColumns  = (p) => <I {...p}><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></I>;
const IconPie      = (p) => <I {...p}><path d="M21 12A9 9 0 1 1 12 3v9h9z"/><path d="M12 3a9 9 0 0 1 9 9h-9V3z" fill="currentColor" opacity=".15"/></I>;
const IconSpark    = (p) => <I {...p}><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m5.6 5.6 2.1 2.1"/><path d="m16.3 16.3 2.1 2.1"/><path d="m5.6 18.4 2.1-2.1"/><path d="m16.3 7.7 2.1-2.1"/></I>;
const IconCog      = (p) => <I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></I>;
const IconExternal = (p) => <I {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></I>;

Object.assign(window, {
  IconHome, IconList, IconCoins, IconHistory, IconShield, IconPlus, IconSearch,
  IconFilter, IconDownload, IconUpload, IconCheck, IconX, IconEdit, IconTrash,
  IconMore, IconEye, IconSend, IconArrowRt, IconArrowDn, IconArrowUp, IconCalendar,
  IconUser, IconUsers, IconWallet, IconReceipt, IconPaperclip, IconChevDn, IconChevRt,
  IconLogout, IconBell, IconMoon, IconSun, IconBan, IconBank, IconCash, IconAlert,
  IconInfo, IconRefresh, IconTrend, IconColumns, IconPie, IconSpark, IconCog, IconExternal,
});
