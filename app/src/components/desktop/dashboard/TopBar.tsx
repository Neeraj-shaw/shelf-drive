import {
    ArrowDown,
    ArrowUp,
    Download,
    Files,
    FolderInput,
    FolderPlus,
    Filter,
    Globe,
    HardDrive,
    HelpCircle,
    LayoutGrid,
    List,
    Moon,
    MoreHorizontal,
    Settings,
    Share2,
    Keyboard,
    Sun,
    Trash2,
    UploadCloud,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { useSettings } from '../../../context/SettingsContext';
import { Button, IconButton, MenuItem, MenuPanel, SearchField } from '../../ui';
import type { SortDirection, SortField } from './FileExplorer';
import type { FileSearchFilters } from '../../../services/fileSearch';
import { useTopBarController } from './useTopBarController';
import i18n from '../../../i18n';

interface TopBarProps {
    currentFolderName: string;
    selectedIds: number[];
    onShowMoveModal: () => void;
    onBulkDownload: () => void;
    onBulkDelete: () => void;
    onBulkShare: () => void;
    onDownloadFolder: () => void;
    onClearSelection: () => void;
    onUploadClick: () => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    cardScale: number;
    onCardScaleChange: (scale: number) => void;
    sortField: SortField;
    sortDirection: SortDirection;
    onSortChange: (field: SortField) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onSettingsClick: () => void;
    onRemoteUploadClick: () => void;
    onNewFolderClick: () => void;
    onShowShortcuts: () => void;
    onShowHelp: () => void;
    searchFilters: FileSearchFilters;
    onSearchFiltersChange: (filters: FileSearchFilters) => void;
    /** Optional shortcut back to the user's own library, surfaced in the overflow menu. */
    onOpenLibrary?: () => void;
}

export function TopBar({
    currentFolderName,
    selectedIds,
    onShowMoveModal,
    onBulkDownload,
    onBulkDelete,
    onBulkShare,
    onDownloadFolder,
    onClearSelection,
    onUploadClick,
    viewMode,
    setViewMode,
    cardScale,
    onCardScaleChange,
    sortField,
    sortDirection,
    onSortChange,
    searchTerm,
    onSearchChange,
    onSettingsClick,
    onRemoteUploadClick,
    onNewFolderClick,
    onShowShortcuts,
    onShowHelp,
    searchFilters,
    onSearchFiltersChange,
    onOpenLibrary,
}: TopBarProps) {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();
    const { settings } = useSettings();
    const {
        proxyStatus,
        showMore,
        showViewOptions,
        showSearchFilters,
        moreRef,
        viewRef,
        filterRef,
        toggleSearchFilters,
        toggleViewOptions,
        toggleMore,
        runMoreAction,
    } = useTopBarController(settings.proxyEnabled, settings.proxyLiveStateEnabled);
    const hasSelection = selectedIds.length > 0;

    const filtersActive = searchFilters.type !== 'all' || searchFilters.size !== 'any' || searchFilters.date !== 'any';

    return (
        <>
            <header
                className="drive-header"
                onClick={(event) => event.stopPropagation()}
            >
                {hasSelection ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <button
                            type="button"
                            onClick={onClearSelection}
                            className="drive-icon-btn"
                            aria-label={t('files.clear_selection')}
                            title={t('files.clear_selection')}
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span className="me-1 min-w-0 truncate text-ui font-semibold text-app-text">
                            {t('files.items_selected', { count: selectedIds.length })}
                        </span>
                        <Button size="sm" onClick={onShowMoveModal} leadingIcon={<FolderInput className="h-3.5 w-3.5" />}>
                            {t('files.move_to')}
                        </Button>
                        <Button size="sm" onClick={onBulkDownload} leadingIcon={<Download className="h-3.5 w-3.5" />}>
                            {t('files.download')}
                        </Button>
                        <Button size="sm" onClick={onBulkShare} leadingIcon={<Share2 className="h-3.5 w-3.5" />}>
                            {t('files.share')}
                        </Button>
                        <Button size="sm" variant="danger" onClick={onBulkDelete} leadingIcon={<Trash2 className="h-3.5 w-3.5" />}>
                            {t('files.delete')}
                        </Button>
                    </div>
                ) : (
                    <>
                        <h1
                            className="drive-title max-w-[13rem] shrink-0 truncate"
                            title={currentFolderName}
                        >
                            {currentFolderName}
                        </h1>

                        <div ref={filterRef} className="relative flex min-w-0 flex-1 items-center gap-1">
                            <SearchField
                                data-drive-search
                                data-file-search
                                containerClassName="drive-search min-w-0 flex-1"
                                placeholder={t('common.search_placeholder')}
                                value={searchTerm}
                                onChange={(event) => onSearchChange(event.target.value)}
                            />
                            <button
                                type="button"
                                onClick={toggleSearchFilters}
                                aria-expanded={showSearchFilters}
                                className="drive-icon-btn"
                                data-state={showSearchFilters || filtersActive ? 'open' : undefined}
                                aria-label="Search filters"
                                title="Search filters"
                            >
                                <Filter className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {showSearchFilters && (
                                <MenuPanel className="absolute end-0 top-11 z-50 w-72 space-y-3 p-3">
                                    <label className="block text-xs font-medium text-app-text-secondary">Search scope
                                        <select value={searchFilters.scope} onChange={(event) => onSearchFiltersChange({ ...searchFilters, scope: event.target.value as FileSearchFilters['scope'] })} className="quiet-control mt-1 h-8 w-full border border-app-border bg-app-surface-sunken px-2 text-sm text-app-text">
                                            <option value="folder">Current folder / view</option>
                                            <option value="all">All Shelf Drive folders</option>
                                        </select>
                                    </label>
                                    <label className="block text-xs font-medium text-app-text-secondary">File type
                                        <select value={searchFilters.type} onChange={(event) => onSearchFiltersChange({ ...searchFilters, type: event.target.value as FileSearchFilters['type'] })} className="quiet-control mt-1 h-8 w-full border border-app-border bg-app-surface-sunken px-2 text-sm text-app-text">
                                            <option value="all">All types</option><option value="image">Images</option><option value="video">Videos</option><option value="audio">Audio</option><option value="document">Documents</option><option value="archive">Archives</option><option value="other">Other</option>
                                        </select>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="block text-xs font-medium text-app-text-secondary">{i18n.t("common.size")}
                                            <select value={searchFilters.size} onChange={(event) => onSearchFiltersChange({ ...searchFilters, size: event.target.value as FileSearchFilters['size'] })} className="quiet-control mt-1 h-8 w-full border border-app-border bg-app-surface-sunken px-2 text-sm text-app-text">
                                                <option value="any">Any</option><option value="small">Under 10 MB</option><option value="medium">10–100 MB</option><option value="large">100 MB+</option>
                                            </select>
                                        </label>
                                        <label className="block text-xs font-medium text-app-text-secondary">{i18n.t("common.date")}
                                            <select value={searchFilters.date} onChange={(event) => onSearchFiltersChange({ ...searchFilters, date: event.target.value as FileSearchFilters['date'] })} className="quiet-control mt-1 h-8 w-full border border-app-border bg-app-surface-sunken px-2 text-sm text-app-text">
                                                <option value="any">Any</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="1y">Last year</option>
                                            </select>
                                        </label>
                                    </div>
                                    <button type="button" onClick={() => onSearchFiltersChange({ scope: 'folder', type: 'all', size: 'any', date: 'any' })} className="quiet-control w-full px-3 py-2 text-xs font-medium text-app-text-secondary hover:text-app-text">Reset filters</button>
                                </MenuPanel>
                            )}
                        </div>

                        <div className="drive-actions">
                            {settings.proxyEnabled && settings.proxyLiveStateEnabled && (
                                <div
                                    className="drive-status"
                                    title={!proxyStatus
                                        ? 'Proxy status: checking…'
                                        : proxyStatus.reachable
                                            ? `Proxy active: ${proxyStatus.latency_ms}ms latency`
                                            : 'Proxy status: unreachable'}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                        !proxyStatus ? 'bg-app-warning animate-pulse' : proxyStatus.reachable ? 'bg-app-success' : 'bg-app-danger'
                                    }`} />
                                    <span className="font-mono">
                                        {!proxyStatus ? '…' : proxyStatus.reachable ? `${proxyStatus.latency_ms}ms` : 'Offline'}
                                    </span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={onNewFolderClick}
                                className="drive-pill-btn"
                                data-tone="secondary"
                            >
                                <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
                                {t('common.create_folder')}
                            </button>

                            <button
                                type="button"
                                onClick={onUploadClick}
                                className="drive-pill-btn"
                                data-tone="primary"
                            >
                                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                                {t('common.upload')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="drive-icon-btn"
                                aria-label={viewMode === 'grid' ? t('files.switch_list') : t('files.switch_grid')}
                                title={viewMode === 'grid' ? t('files.switch_list') : t('files.switch_grid')}
                            >
                                {viewMode === 'grid'
                                    ? <List className="h-4 w-4" aria-hidden="true" />
                                    : <LayoutGrid className="h-4 w-4" aria-hidden="true" />}
                            </button>

                            <div className="relative" ref={moreRef}>
                                <button
                                    type="button"
                                    onClick={toggleMore}
                                    aria-expanded={showMore}
                                    className="drive-icon-btn"
                                    data-state={showMore ? 'open' : undefined}
                                    aria-label={t('common.preferences')}
                                    title={t('common.preferences')}
                                >
                                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                </button>
                                {showMore && (
                                    <MenuPanel className="absolute end-0 top-11 z-50 w-56">
                                        {onOpenLibrary && (
                                            <MenuItem onClick={() => runMoreAction(onOpenLibrary)}>
                                                <Files className="h-3.5 w-3.5 text-app-text-secondary" />
                                                {t('workspace.title')}
                                            </MenuItem>
                                        )}
                                        <MenuItem onClick={() => runMoreAction(onDownloadFolder)}>
                                            <HardDrive className="h-3.5 w-3.5 text-app-text-secondary" />
                                            {t('files.download_folder')}
                                        </MenuItem>
                                        <MenuItem onClick={() => runMoreAction(onRemoteUploadClick)}>
                                            <Globe className="h-3.5 w-3.5 text-app-text-secondary" />
                                            {t('files.remote_upload')}
                                        </MenuItem>
                                        <MenuItem onClick={() => runMoreAction(toggleTheme)}>
                                            {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-app-text-secondary" /> : <Moon className="h-3.5 w-3.5 text-app-text-secondary" />}
                                            {theme === 'dark' ? t('common.light_mode') : t('common.dark_mode')}
                                        </MenuItem>
                                        <MenuItem onClick={() => runMoreAction(onShowShortcuts)}>
                                            <Keyboard className="h-3.5 w-3.5 text-app-text-secondary" />
                                            Keyboard shortcuts
                                        </MenuItem>
                                        <MenuItem onClick={() => runMoreAction(onShowHelp)}>
                                            <HelpCircle className="h-3.5 w-3.5 text-app-text-secondary" />
                                            Help &amp; FAQ
                                        </MenuItem>
                                        <div className="my-1 h-px bg-app-border-subtle" />
                                        <MenuItem onClick={() => runMoreAction(onSettingsClick)}>
                                            <Settings className="h-3.5 w-3.5 text-app-text-secondary" />
                                            {t('common.settings')}
                                        </MenuItem>
                                    </MenuPanel>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </header>

            {!hasSelection && (
                <div className="drive-sortbar">
                    <span className="drive-sort-label">Sort files</span>
                    <div className="relative" ref={viewRef}>
                        <button
                            type="button"
                            onClick={toggleViewOptions}
                            aria-expanded={showViewOptions}
                            aria-label="Sort files"
                            className="drive-sort-btn"
                            data-state={showViewOptions ? 'open' : undefined}
                        >
                            <span className="truncate">{t(`common.${sortField}`)}</span>
                            {sortDirection === 'asc'
                                ? <ArrowUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                                : <ArrowDown className="h-3 w-3 shrink-0" aria-hidden="true" />}
                        </button>
                        {showViewOptions && (
                            <MenuPanel className="absolute start-0 top-9 z-50 w-64">
                                <div className="grid grid-cols-3 gap-1 p-1" role="group" aria-label="Sort files">
                                    {(['name', 'size', 'date'] as const).map((field) => (
                                        <button
                                            key={field}
                                            type="button"
                                            onClick={() => onSortChange(field)}
                                            className={`quiet-control flex h-8 min-w-0 items-center justify-center gap-1 px-1.5 text-metadata font-medium ${sortField === field ? 'bg-app-selected text-app-accent' : 'text-app-text-secondary hover:text-app-text'}`}
                                        >
                                            <span className="truncate">{t(`common.${field}`)}</span>
                                            {sortField === field && (sortDirection === 'asc'
                                                ? <ArrowUp className="h-3 w-3 shrink-0" />
                                                : <ArrowDown className="h-3 w-3 shrink-0" />)}
                                        </button>
                                    ))}
                                </div>

                                {viewMode === 'grid' && (
                                    <>
                                        <div className="my-1 h-px bg-app-border-subtle" />
                                        <div className="flex h-8 items-center gap-1 px-1">
                                            <IconButton
                                                size="xs"
                                                label="Smaller thumbnails"
                                                onClick={() => onCardScaleChange(Math.max(0.5, cardScale - 0.25))}
                                                disabled={cardScale <= 0.5}
                                            >
                                                <ZoomOut className="h-3.5 w-3.5" />
                                            </IconButton>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="2"
                                                step="0.25"
                                                value={cardScale}
                                                onChange={(event) => onCardScaleChange(parseFloat(event.target.value))}
                                                className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-app-border [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-app-accent"
                                                aria-label="Thumbnail size"
                                            />
                                            <IconButton
                                                size="xs"
                                                label="Larger thumbnails"
                                                onClick={() => onCardScaleChange(Math.min(2, cardScale + 0.25))}
                                                disabled={cardScale >= 2}
                                            >
                                                <ZoomIn className="h-3.5 w-3.5" />
                                            </IconButton>
                                            <span className="w-9 text-end text-badge tabular-nums text-app-text-tertiary">{Math.round(cardScale * 100)}%</span>
                                        </div>
                                    </>
                                )}
                            </MenuPanel>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
