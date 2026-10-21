import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '../desktop/dashboard/Sidebar';
import { TopBar } from '../desktop/dashboard/TopBar';
import { FileExplorer, type SortDirection, type SortField } from '../desktop/dashboard/FileExplorer';
import { DriveFrame } from '../desktop/dashboard/DriveFrame';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { DEFAULT_SEARCH_FILTERS, type FileSearchFilters } from '../../services/fileSearch';
import type { FolderGroup, SmartView, TelegramFile, TelegramFolder } from '../../types';

/**
 * Development-only preview of the desktop shell with representative content.
 *
 * The shipped dashboard needs a live Telegram session, so this fixture mounts
 * the same chrome components with sample data. It exists for UI review and for
 * capturing before/after screenshots while the shell is redesigned.
 */

const folders: TelegramFolder[] = [
  { id: 10, name: 'Product', is_public: true, username: 'shelf_product' },
  { id: 11, name: 'Design', group_id: 1, display_order: 1 },
  { id: 12, name: 'Trips', display_order: 2 },
  { id: 13, name: 'Archive', display_order: 3 },
];

const groups: FolderGroup[] = [{ id: 1, name: 'Work', color_hex: '#3B82F6', display_order: 1 }];

const files: TelegramFile[] = [
  { id: 1, name: 'Getting Started', size: 0, sizeStr: '', type: 'folder', folder_id: 10 },
  { id: 2, name: 'Q3 launch plan.pdf', size: 2_450_000, sizeStr: '2.4 MB', type: 'file', file_ext: 'pdf', created_at: '2026-09-04' },
  { id: 3, name: 'Brand board.png', size: 5_100_000, sizeStr: '5.1 MB', type: 'file', file_ext: 'png', created_at: '2026-09-11' },
  { id: 4, name: 'Homepage walkthrough.mp4', size: 184_000_000, sizeStr: '184 MB', type: 'file', file_ext: 'mp4', created_at: '2026-09-18' },
  { id: 5, name: 'Shelf pricing.xlsx', size: 320_000, sizeStr: '320 KB', type: 'file', file_ext: 'xlsx', created_at: '2026-09-21' },
  { id: 6, name: 'Sprint notes.md', size: 24_000, sizeStr: '24 KB', type: 'file', file_ext: 'md', created_at: '2026-09-24' },
  { id: 7, name: 'Release 4.0.1.zip', size: 68_000_000, sizeStr: '68 MB', type: 'file', file_ext: 'zip', created_at: '2026-09-27' },
  { id: 8, name: 'Offsite photos', size: 0, sizeStr: '', type: 'folder', folder_id: 12 },
  { id: 9, name: 'Onboarding deck.key', size: 12_000_000, sizeStr: '12 MB', type: 'file', file_ext: 'key', created_at: '2026-09-29' },
];

export default function ShellPreview() {
  const { t } = useTranslation();
  const { updateSetting } = useSettings();
  useTheme();
  const query = new URLSearchParams(window.location.search);
  const initialView = query.get('view') === 'list' ? 'list' : 'grid';

  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [activeSmartView, setActiveSmartView] = useState<SmartView | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters] = useState<FileSearchFilters>(DEFAULT_SEARCH_FILTERS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialView);
  const [cardScale, setCardScale] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const noop = () => undefined;
  const asyncNoop = async () => undefined;

  return (
    <DndContext>
      <div className="desktop-shell drive-shell h-screen w-full">
        <DriveFrame
          sidebar={
            <Sidebar
              folders={folders}
              groups={groups}
              activeFolderId={activeFolderId}
              setActiveFolderId={setActiveFolderId}
              onDelete={noop}
              onRename={noop}
              onToggleVisibility={noop}
              onExportInvite={noop}
              onCreate={asyncNoop}
              isSyncing={false}
              isConnected
              onSync={noop}
              onLogout={noop}
              bandwidth={null}
              onAssignFolderToGroup={asyncNoop}
              onCreateGroup={asyncNoop}
              onUpdateGroup={asyncNoop}
              onDeleteGroup={asyncNoop}
              activeSmartView={activeSmartView}
              onSmartViewChange={setActiveSmartView}
              onUpload={noop}
            />
          }
        >
          <TopBar
            currentFolderName={activeSmartView ? t('common.all_files') : t('common.saved_messages')}
            selectedIds={selectedIds}
            onShowMoveModal={noop}
            onBulkDownload={noop}
            onBulkDelete={noop}
            onBulkShare={noop}
            onDownloadFolder={noop}
            onClearSelection={() => setSelectedIds([])}
            onUploadClick={noop}
            viewMode={viewMode}
            setViewMode={setViewMode}
            cardScale={cardScale}
            onCardScaleChange={setCardScale}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={(field) => {
              if (field === sortField) setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'));
              else { setSortField(field); setSortDirection('asc'); }
            }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchFilters={searchFilters}
            onSearchFiltersChange={noop}
            onSettingsClick={noop}
            onRemoteUploadClick={noop}
            onNewFolderClick={noop}
            onShowShortcuts={noop}
            onShowHelp={noop}
          />
          <FileExplorer
            folders={folders}
            files={files}
            loading={false}
            error={null}
            viewMode={viewMode}
            selectedIds={selectedIds}
            activeFolderId={activeFolderId}
            onFileClick={(_event, file) => {
              setSelectedIds(current => (current.includes(file.id) ? current.filter(id => id !== file.id) : [file.id]));
            }}
            onDelete={noop}
            onDownload={noop}
            onPreview={noop}
            onManualUpload={noop}
            onFolderUpload={noop}
            showFolderUpload
            onToggleSelection={(id) => setSelectedIds(current => (current.includes(id) ? current.filter(value => value !== id) : [...current, id]))}
            onShare={noop}
            onRename={noop}
            onFileMove={noop}
            cardScale={cardScale}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={(field) => {
              if (field === sortField) setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'));
              else { setSortField(field); setSortDirection('asc'); }
            }}
            onToggleFavorite={noop}
            onTogglePinned={noop}
            selectionDisabled={false}
          />
        </DriveFrame>
      </div>
      {/* Keep the settings writer referenced so the fixture types stay honest. */}
      <button type="button" hidden onClick={() => updateSetting('viewMode', viewMode)} />
    </DndContext>
  );
}
