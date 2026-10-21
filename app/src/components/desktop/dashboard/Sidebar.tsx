import { useEffect, useState } from 'react';
import { HardDrive, Folder, Plus, RefreshCw, LogOut, ChevronLeft, ChevronRight, Settings2, Trash2, Check, X, Eye, EyeOff, Clock3, Star, FileWarning, Copy, Database, Files, Image, Film, FileText, UploadCloud, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SidebarItem } from './SidebarItem';
import { BandwidthWidget } from './BandwidthWidget';
import { TelegramFolder, BandwidthStats, FolderGroup, type SmartView } from '../../../types';
import { useSettings } from '../../../context/SettingsContext';
import {
    SortableContext,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { quietMetrics } from '../../../design/contracts';
import { CreateFolderDialog } from './CreateFolderDialog';
import { SyncStatusBadge } from '../sync/SyncStatusBadge';

const PRESET_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Orange
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#EF4444', // Red
];

interface GroupTabProps {
    id: string;
    groupId: number | null | 'all';
    label: string;
    colorHex?: string;
    active: boolean;
    onClick: () => void;
    onEdit?: () => void;
    isSortable?: boolean;
}

function GroupTab({ id, groupId, label, colorHex, active, onClick, onEdit, isSortable = true }: GroupTabProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        data: { kind: 'sidebar-group', groupId },
        disabled: !isSortable ? { draggable: true, droppable: false } : false,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`flex h-7 flex-shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-full border px-2.5 text-badge font-medium transition-colors ${
                active
                    ? 'border-app-border-strong bg-app-surface-raised text-app-text'
                    : 'border-app-border-subtle bg-transparent text-app-text-secondary hover:bg-app-hover hover:text-app-text'
            }`}
        >
            {colorHex && (
                <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colorHex }}
                />
            )}
            <span className="truncate max-w-[80px]">{label}</span>
            {onEdit && active && groupId !== 'all' && groupId !== null && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="rounded p-0.5 text-app-text-secondary hover:bg-app-hover hover:text-app-text"
                >
                    <Settings2 className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}

interface SidebarProps {
    folders: TelegramFolder[];
    groups: FolderGroup[];
    activeFolderId: number | null;
    setActiveFolderId: (id: number | null) => void;
    onDelete: (id: number, name: string) => void;
    onRename: (id: number, name: string) => void;
    onToggleVisibility: (id: number, name: string, isPublic: boolean) => void;
    onExportInvite: (id: number, name: string) => void;
    onCreate: (name: string) => Promise<void>;
    isSyncing: boolean;
    isConnected: boolean;
    onSync: () => void;
    onLogout: () => void;
    bandwidth: BandwidthStats | null;
    onAssignFolderToGroup: (folderId: number, groupId: number | null) => Promise<void>;
    onCreateGroup: (name: string, colorHex: string) => Promise<void>;
    onUpdateGroup: (groupId: number, name: string, colorHex: string) => Promise<void>;
    onDeleteGroup: (groupId: number) => Promise<void>;
    createFolderRequest?: number;
    activeSmartView?: SmartView | null;
    onSmartViewChange?: (view: SmartView | null) => void;
    onUpload?: () => void;
}

export function Sidebar({
    folders, groups = [], activeFolderId, setActiveFolderId, onDelete, onRename, onToggleVisibility, onExportInvite, onCreate,
    isSyncing, isConnected, onSync, onLogout, bandwidth,
    onAssignFolderToGroup, onCreateGroup, onUpdateGroup, onDeleteGroup, createFolderRequest = 0, activeSmartView = null, onSmartViewChange,
    onUpload,
}: SidebarProps) {
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const { t } = useTranslation();
    const { settings, updateSetting } = useSettings();

    // Grouping States
    const [activeGroupId, setActiveGroupId] = useState<number | null | 'all'>('all');
    const [showGroupEditor, setShowGroupEditor] = useState(false);
    const [editingGroup, setEditingGroup] = useState<FolderGroup | null>(null); // null means creating
    const [groupName, setGroupName] = useState("");
    const [groupColor, setGroupColor] = useState("#3B82F6");

    useEffect(() => {
        if (createFolderRequest > 0) setShowNewFolderInput(true);
    }, [createFolderRequest]);

    const handleSaveGroup = async () => {
        if (!groupName.trim()) return;
        if (editingGroup) {
            await onUpdateGroup(editingGroup.id, groupName, groupColor);
        } else {
            await onCreateGroup(groupName, groupColor);
        }
        setShowGroupEditor(false);
        setEditingGroup(null);
        setGroupName("");
        setGroupColor("#3B82F6");
    };

    const handleDeleteGroupClick = async (groupId: number) => {
        await onDeleteGroup(groupId);
        if (activeGroupId === groupId) {
            setActiveGroupId('all');
        }
        setShowGroupEditor(false);
        setEditingGroup(null);
        setGroupName("");
        setGroupColor("#3B82F6");
    };

    const filteredFolders = folders.filter(folder => {
        if (settings.hideGroups || activeGroupId === 'all') return true;
        if (activeGroupId === null) return folder.group_id === null || folder.group_id === undefined;
        return folder.group_id === activeGroupId;
    });

    /** Focus the shared search field in the header so the sidebar shortcut
     *  lands on the single source of truth for the query. */
    const focusSearch = () => {
        const input = document.querySelector<HTMLInputElement>('input[data-file-search]');
        if (!input) return;
        input.focus();
        input.select();
    };

    const openSettings = () => window.dispatchEvent(new Event('shelf-drive-open-settings'));
    const collapsed = settings.sidebarCollapsed;

    return (
        <aside
            className="drive-sidebar shrink-0"
            style={{ width: collapsed ? quietMetrics.sidebarWidth.collapsed : quietMetrics.sidebarWidth.expanded }}
            onClick={e => e.stopPropagation()}
        >
            {/* Identity: brand tile, workspace name, collapse control */}
            <div className={collapsed ? 'flex flex-col items-center gap-1 py-3' : 'drive-sidebar-head'}>
                <span className="drive-logo-tile">
                    <img
                        src="/logo.png"
                        alt=""
                        aria-hidden="true"
                        className={collapsed ? 'h-5 w-5' : 'h-6 w-6'}
                    />
                </span>
                {!collapsed && (
                    <span className="drive-sidebar-identity">
                        <span className="drive-sidebar-name truncate">{t('common.app_title')}</span>
                        <span className="drive-sidebar-sub truncate">{t('workspace.title')}</span>
                    </span>
                )}
                <button
                    type="button"
                    onClick={() => updateSetting('sidebarCollapsed', !collapsed)}
                    className={`drive-collapse ${collapsed ? '' : 'ms-auto'}`}
                    aria-label={collapsed ? t('common.expand_sidebar') || 'Expand sidebar' : t('common.collapse_sidebar') || 'Collapse sidebar'}
                    title={collapsed ? t('common.expand_sidebar') || 'Expand sidebar' : t('common.collapse_sidebar') || 'Collapse sidebar'}
                >
                    {collapsed
                        ? <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        : <ChevronLeft className="h-4 w-4" aria-hidden="true" />}
                </button>
            </div>

            {/* Primary action and quick tools */}
            {!collapsed && (
                <div className="drive-sidebar-actions">
                    {onUpload && (
                        <button type="button" onClick={onUpload} className="drive-upload">
                            <UploadCloud className="h-4 w-4" aria-hidden="true" />
                            {t('common.upload')}
                        </button>
                    )}
                    <div className="flex items-center gap-1.5 px-0.5">
                        <button
                            type="button"
                            onClick={focusSearch}
                            className="drive-icon-circle"
                            aria-label={t('common.search_placeholder')}
                            title={t('common.search_placeholder')}
                        >
                            <Search className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={openSettings}
                            className="drive-icon-circle"
                            aria-label={t('common.settings')}
                            title={t('common.settings')}
                        >
                            <Settings2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}

            {/* Group filters */}
            {!collapsed && (
                <div className="flex shrink-0 items-center justify-between px-3.5 pt-1.5">
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-app-text-tertiary">
                        {t('common.groups') || 'Groups'}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            onClick={() => updateSetting('hideGroups', !settings.hideGroups)}
                            className="drive-mini-btn"
                            aria-label={settings.hideGroups ? t('common.show_groups') || 'Show groups' : t('common.hide_groups') || 'Hide groups'}
                            title={settings.hideGroups ? t('common.show_groups') || 'Show groups' : t('common.hide_groups') || 'Hide groups'}
                        >
                            {settings.hideGroups ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                        </button>
                        {!settings.hideGroups && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingGroup(null);
                                    setGroupName('');
                                    setGroupColor('#3B82F6');
                                    setShowGroupEditor(true);
                                }}
                                className="drive-mini-btn"
                                aria-label={t('common.create_group') || 'Create group'}
                                title={t('common.create_group') || 'Create group'}
                            >
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!collapsed && showGroupEditor && !settings.hideGroups && (
                <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-app-border-subtle bg-app-surface/70 p-2.5">
                    <div>
                        <label className="mb-1 block text-badge font-medium text-app-text-secondary">
                            {editingGroup ? t('common.edit_group_name') : t('common.new_group_name')}
                        </label>
                        <input
                            autoFocus
                            type="text"
                            className="quiet-control h-8 w-full border border-app-border bg-app-surface-sunken/50 px-2 text-ui text-app-text outline-none"
                            placeholder={t('common.enter_group_name')}
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-badge font-medium text-app-text-secondary">
                            {t('common.theme_color')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    aria-label={color}
                                    onClick={() => setGroupColor(color)}
                                    className={`h-5 w-5 rounded-full border transition-transform ${
                                        groupColor === color
                                            ? 'scale-110 border-app-accent'
                                            : 'border-transparent hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-1 flex justify-end gap-2">
                        {editingGroup && (
                            <button
                                type="button"
                                onClick={() => handleDeleteGroupClick(editingGroup.id)}
                                className="mr-auto rounded p-1.5 text-app-danger transition-colors hover:bg-app-danger/10"
                                aria-label={t('common.delete_group')}
                                title={t('common.delete_group')}
                            >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setShowGroupEditor(false);
                                setEditingGroup(null);
                            }}
                            className="quiet-control flex h-7 items-center gap-1 px-2 text-badge font-medium text-app-text-secondary hover:text-app-text"
                        >
                            <X className="h-3 w-3" aria-hidden="true" />
                            {t('common.cancel') || 'Cancel'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveGroup}
                            disabled={!groupName.trim()}
                            className="quiet-control flex h-7 items-center gap-1 bg-app-accent px-2.5 text-badge font-medium text-app-accent-contrast hover:bg-app-accent-hover disabled:opacity-50"
                        >
                            <Check className="h-3 w-3" aria-hidden="true" />
                            {t('common.save') || 'Save'}
                        </button>
                    </div>
                </div>
            )}

            {!collapsed && !settings.hideGroups && (
                <div
                    className="group-tabs-scroll flex items-center gap-1.5 overflow-x-auto px-3.5 pb-2 pt-1.5"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style>{`
                        .group-tabs-scroll::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    <GroupTab
                        id="group-tab-all"
                        groupId="all"
                        label={t('common.all') || 'All'}
                        active={activeGroupId === 'all'}
                        onClick={() => setActiveGroupId('all')}
                        isSortable={false}
                    />
                    <GroupTab
                        id="group-tab-unassigned"
                        groupId={null}
                        label={t('common.unassigned') || 'Unassigned'}
                        active={activeGroupId === null}
                        onClick={() => setActiveGroupId(null)}
                        isSortable={false}
                    />
                    <SortableContext
                        items={groups.map(g => `group-tab-${g.id}`)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {groups.map(group => (
                            <GroupTab
                                key={group.id}
                                id={`group-tab-${group.id}`}
                                groupId={group.id}
                                label={group.name}
                                colorHex={group.color_hex}
                                active={activeGroupId === group.id}
                                onClick={() => setActiveGroupId(group.id)}
                                onEdit={() => {
                                    setEditingGroup(group);
                                    setGroupName(group.name);
                                    setGroupColor(group.color_hex || '#3B82F6');
                                    setShowGroupEditor(true);
                                }}
                            />
                        ))}
                    </SortableContext>
                </div>
            )}

            {/* Navigation */}
            <div className={collapsed ? 'drive-sidebar-scroll items-center px-1.5' : 'drive-sidebar-scroll'}>
                {([
                    ['recents', Clock3, t('common.recents')],
                    ['favorites', Star, t('common.favorites')],
                    ['offline', Database, t('common.offline_files')],
                ] as const).map(([view, Icon, label]) => (
                    <button
                        key={view}
                        type="button"
                        onClick={() => onSmartViewChange?.(view)}
                        title={label}
                        aria-current={activeSmartView === view ? 'page' : undefined}
                        data-active={activeSmartView === view}
                        className={`drive-nav-row ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                        <Icon className="drive-nav-icon h-4 w-4 shrink-0" aria-hidden="true" />
                        {!collapsed && <span className="truncate">{label}</span>}
                    </button>
                ))}

                {!collapsed && <div className="drive-divider" />}

                {([
                    ['all', Files, t('common.all_files')],
                    ['photos', Image, t('common.photos')],
                    ['videos', Film, t('common.videos')],
                    ['documents', FileText, t('common.documents')],
                ] as const).map(([view, Icon, label]) => (
                    <button
                        key={view}
                        type="button"
                        onClick={() => onSmartViewChange?.(view)}
                        title={label}
                        aria-current={activeSmartView === view ? 'page' : undefined}
                        data-active={activeSmartView === view}
                        className={`drive-nav-row ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                        <Icon className="drive-nav-icon h-4 w-4 shrink-0" aria-hidden="true" />
                        {!collapsed && <span className="truncate">{label}</span>}
                    </button>
                ))}

                {!collapsed && (
                    <p className="drive-nav-label">{t('common.storage_insights')}</p>
                )}

                {([
                    ['large', FileWarning, t('common.large_files')],
                    ['duplicates', Copy, t('common.duplicates')],
                ] as const).map(([view, Icon, label]) => (
                    <button
                        key={view}
                        type="button"
                        onClick={() => onSmartViewChange?.(view)}
                        title={label}
                        aria-current={activeSmartView === view ? 'page' : undefined}
                        data-active={activeSmartView === view}
                        className={`drive-nav-row ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                        <Icon className="drive-nav-icon h-4 w-4 shrink-0" aria-hidden="true" />
                        {!collapsed && <span className="truncate">{label}</span>}
                    </button>
                ))}

                {!collapsed && <div className="drive-divider" />}
                {!collapsed && <p className="drive-nav-label">{t('common.folders')}</p>}

                <SidebarItem
                    icon={HardDrive}
                    label={t('common.saved_messages')}
                    active={activeFolderId === null && !activeSmartView}
                    onClick={() => { onSmartViewChange?.(null); setActiveFolderId(null); }}
                    folderId={null}
                    collapsed={collapsed}
                />
                <SortableContext
                    items={filteredFolders.map(folder => `folder-${folder.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    {filteredFolders.map(folder => (
                        <SidebarItem
                            key={folder.id}
                            icon={Folder}
                            label={folder.name}
                            active={activeFolderId === folder.id && !activeSmartView}
                            onClick={() => { onSmartViewChange?.(null); setActiveFolderId(folder.id); }}
                            onDelete={() => onDelete(folder.id, folder.name)}
                            onRename={() => onRename(folder.id, folder.name)}
                            onToggleVisibility={() => onToggleVisibility(folder.id, folder.name, !!(folder.is_public || folder.username))}
                            onExportInvite={() => onExportInvite(folder.id, folder.name)}
                            folderId={folder.id}
                            isPublic={!!(folder.is_public || folder.username)}
                            collapsed={collapsed}
                            groups={groups}
                            onAssignFolderToGroup={onAssignFolderToGroup}
                        />
                    ))}
                </SortableContext>
            </div>

            {/* Create folder stays one click away, above the footer */}
            {!collapsed && (
                <div className="drive-sidebar-utility">
                    <button
                        type="button"
                        onClick={() => setShowNewFolderInput(true)}
                        className="drive-new-folder"
                    >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('common.create_folder')}
                    </button>
                </div>
            )}

            {showNewFolderInput && (
                <CreateFolderDialog onClose={() => setShowNewFolderInput(false)} onCreate={onCreate} />
            )}

            <div className={collapsed ? 'flex flex-col items-center gap-2 border-t border-app-border-subtle py-3' : 'drive-sidebar-footer'}>
                {collapsed ? (
                    <>
                        <span
                            className={`h-2 w-2 flex-shrink-0 rounded-full ${isConnected ? 'bg-app-success' : 'bg-app-danger'}`}
                            title={isConnected ? t('common.connected_telegram') : t('common.disconnected_telegram')}
                        />
                        <button
                            type="button"
                            onClick={onSync}
                            disabled={isSyncing}
                            className="drive-icon-circle"
                            aria-label={isSyncing ? t('common.syncing') : t('common.sync')}
                            title={isSyncing ? t('common.syncing') : t('common.sync')}
                        >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="drive-icon-circle"
                            aria-label={t('common.logout')}
                            title={t('common.logout')}
                        >
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </>
                ) : (
                    <>
                        <SyncStatusBadge collapsed={false} />

                        <div className="drive-status">
                            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-app-success' : 'bg-app-danger'}`} aria-hidden="true" />
                            <span className="truncate">
                                {isConnected ? t('common.connected_telegram') : t('common.disconnected_telegram')}
                            </span>
                        </div>

                        <div className="drive-footer-actions">
                            <button
                                type="button"
                                onClick={onSync}
                                disabled={isSyncing}
                                className="drive-footer-btn"
                                title={t('common.sync')}
                            >
                                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
                                {isSyncing ? t('common.syncing') : t('common.sync')}
                            </button>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="drive-footer-btn"
                                data-tone="danger"
                                title={t('common.logout')}
                            >
                                <LogOut className="h-3 w-3" aria-hidden="true" />
                                {t('common.logout')}
                            </button>
                        </div>

                        {bandwidth && <BandwidthWidget bandwidth={bandwidth} />}
                    </>
                )}
            </div>
        </aside>
    );
}
