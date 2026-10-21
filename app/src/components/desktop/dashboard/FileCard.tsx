import { sourceFolder } from '../../../services/fileIdentity';
import { useCallback, useState, useEffect } from 'react';
import { Folder, Eye, Trash2, Link, Check, MoreVertical } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { TelegramFile } from '../../../types';
import { forgetThumbnail, getCachedThumbnail, loadThumbnail } from '../../../services/imagePreviewCache';
import { FileTypeIcon } from '../../shared/FileTypeIcon';
import { useVideoMetadata } from '../../../hooks/useVideoMetadata';
import { useCachedVariants } from '../../../hooks/useCachedVariants';
import { VideoMetaBadge } from '../../shared/VideoMetaBadge';
import { Skeleton } from '../../ui';
import { EncryptionBadge } from '../../shared/EncryptionBadge';
import { describeFileActions } from './fileActionDescriptors';
import i18n from '../../../i18n';

/** Height reserved under the artwork for the name and metadata lines. */
export const FILE_CARD_LABEL_HEIGHT = 46;

type TileTint = 'folder' | 'rose' | 'violet' | 'emerald' | 'sky' | 'amber' | 'slate';

const TINTS_BY_EXTENSION: Record<string, TileTint> = {
    jpg: 'rose', jpeg: 'rose', png: 'rose', gif: 'rose', webp: 'rose', bmp: 'rose', heic: 'rose', avif: 'rose', svg: 'rose',
    mp4: 'violet', mov: 'violet', mkv: 'violet', webm: 'violet', avi: 'violet', m4v: 'violet',
    xls: 'emerald', xlsx: 'emerald', csv: 'emerald', ods: 'emerald', numbers: 'emerald',
    pdf: 'sky', doc: 'sky', docx: 'sky', txt: 'sky', md: 'sky', rtf: 'sky', odt: 'sky', pages: 'sky', ppt: 'sky', pptx: 'sky',
    zip: 'amber', rar: 'amber', '7z': 'amber', tar: 'amber', gz: 'amber', bz2: 'amber',
};

/** Quiet, type-coded wash so tiles read as content without shouting. */
function tileTint(file: TelegramFile, isFolder: boolean): TileTint {
    if (isFolder) return 'folder';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return TINTS_BY_EXTENSION[ext] ?? 'slate';
}

interface FileCardProps {
    file: TelegramFile;
    onDelete: () => void;
    onDownload: () => void;
    onPreview?: () => void;
    onShare?: () => void;
    isSelected: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    activeFolderId?: number | null;
    height?: number;
    onToggleSelection?: () => void;
    selectedIds?: number[];
    disableDrag?: boolean;
}

// Check if file is an image type that can have a thumbnail
function isImageFile(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
}


export function FileCard({ file, onDelete, onDownload, onPreview, onShare, isSelected, onClick, onContextMenu, activeFolderId, height, onToggleSelection, selectedIds, disableDrag = false }: FileCardProps) {
    const sourceFolderId = sourceFolder(file, activeFolderId ?? null);
    const actions = describeFileActions(file);
    const { isFolder } = actions;
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [thumbnailLoading, setThumbnailLoading] = useState(false);
    const [thumbnailReady, setThumbnailReady] = useState(false);
    const fileIds = selectedIds?.includes(file.id) ? selectedIds : [file.id];
    const {
        attributes,
        listeners,
        setNodeRef: setDraggableNodeRef,
        isDragging,
    } = useDraggable({
        id: `telegram-file-${file.folder_id ?? 'home'}-${file.id}`,
        disabled: isFolder || disableDrag,
        data: { kind: 'telegram-files', fileIds, label: file.name },
    });
    const {
        setNodeRef: setDroppableNodeRef,
        isOver,
        active: dragActive,
    } = useDroppable({
        id: `content-folder-${file.id}`,
        disabled: !isFolder,
        data: { kind: 'content-folder', folderId: file.id },
    });
    const setNodeRef = useCallback((node: HTMLDivElement | null) => {
        setDraggableNodeRef(node);
        setDroppableNodeRef(node);
    }, [setDraggableNodeRef, setDroppableNodeRef]);
    const isFileDragOver = isFolder && isOver && dragActive?.data.current?.kind === 'telegram-files';

    // Lazy video metadata badge (.mp4 only)
    const { data: videoMeta, isLoading: videoMetaLoading } = useVideoMetadata(
        file.id,
        sourceFolderId,
        file.name,
    );

    // Cached HLS variants
    const { data: cachedVariants } = useCachedVariants(
        file.id,
        sourceFolderId,
        file.name,
    );
    const cachedQualities = (cachedVariants || []).filter(v => v.available).map(v => v.quality);

    // Lazy load thumbnail for image files
    useEffect(() => {
        if (isFolder || !isImageFile(file.name)) return;

        let cancelled = false;
        const cached = getCachedThumbnail(file.id, sourceFolderId);
        setThumbnail(cached);
        setThumbnailLoading(!cached);
        setThumbnailReady(Boolean(cached));

        loadThumbnail(file.id, sourceFolderId).then((result) => {
            if (!cancelled && result) {
                if (result !== cached) setThumbnailReady(false);
                setThumbnail(result);
            }
        }).catch(() => {
            // Silently fail - will show icon instead
        }).finally(() => {
            if (!cancelled) setThumbnailLoading(false);
        });

        return () => { cancelled = true; };
    }, [file.id, file.name, sourceFolderId, isFolder]);

    const openMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onContextMenu?.(event);
    };

    return (
        <div
            ref={setNodeRef}
            className="file-card-container shelf-card relative min-w-0"
            style={{ opacity: isDragging ? 0.45 : undefined }}
            {...(!isFolder ? attributes : {})}
            {...(!isFolder ? listeners : {})}
            role="group"
            aria-label={file.name}
            data-selected={isSelected}
            data-drag-over={isFileDragOver}
            onContextMenu={onContextMenu}
            onClick={onClick}
        >
            <div
                className="shelf-tile group"
                data-tint={tileTint(file, isFolder)}
                style={height ? { height: `${Math.max(56, height - FILE_CARD_LABEL_HEIGHT)}px` } : { aspectRatio: '4/3' }}
            >
                {/* Artwork: real thumbnail when available, tinted glyph otherwise */}
                {thumbnail ? (
                    <>
                        {!thumbnailReady && <Skeleton className="absolute inset-0 rounded-none" />}
                        <img
                            src={thumbnail}
                            alt={file.name}
                            loading="lazy"
                            decoding="async"
                            className={`h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${thumbnailReady ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setThumbnailReady(true)}
                            onError={() => {
                                forgetThumbnail(file.id, sourceFolderId);
                                setThumbnail(null);
                                setThumbnailReady(false);
                            }}
                        />
                    </>
                ) : (
                    <div className="shelf-art">
                        {isFolder ? (
                            <div className="shelf-stack" aria-hidden="true">
                                <span className="shelf-stack-sheet" />
                                <span className="shelf-stack-sheet" />
                                <span className="shelf-stack-face">
                                    <Folder className="h-5 w-5 text-app-accent" strokeWidth={1.7} />
                                </span>
                            </div>
                        ) : (
                            <span className="shelf-art-badge" aria-hidden="true">
                                {thumbnailLoading && isImageFile(file.name) ? (
                                    <Skeleton className="h-5 w-5" />
                                ) : (
                                    <FileTypeIcon filename={file.name} size="lg" className="h-5 w-5 max-h-full max-w-full" />
                                )}
                            </span>
                        )}
                    </div>
                )}

                {/* Selection toggle */}
                <button
                    type="button"
                    aria-label={isSelected ? `Deselect ${file.name}` : `Select ${file.name}`}
                    aria-pressed={isSelected}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleSelection) onToggleSelection();
                    }}
                    className={`absolute start-2 top-2 z-10 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border transition-opacity ${isSelected ? 'border-app-accent bg-app-accent text-app-accent-contrast' : 'border-white/60 bg-black/35 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
                >
                    {isSelected && <Check className="h-3 w-3" />}
                </button>

                {/* Quick actions on hover */}
                <div className="absolute end-2 top-2 z-10 flex max-w-[calc(100%-2.75rem)] gap-0.5 overflow-hidden rounded-full border border-white/15 bg-black/45 p-0.5 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button type="button" aria-label={`Preview ${file.name}`} onClick={(e) => { e.stopPropagation(); if (onPreview) onPreview() }} className="file-action-btn flex h-6 w-6 items-center justify-center rounded-full text-white/85 hover:bg-white/15 hover:text-white" title={i18n.t("files.preview")}>
                        <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label={`Download ${file.name}`} onClick={(e) => { e.stopPropagation(); onDownload() }} className="file-action-btn flex h-6 w-6 items-center justify-center rounded-full text-white/85 hover:bg-white/15 hover:text-white" title={i18n.t("files.download")}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                    {actions.canShare && onShare && (
                        <button type="button" aria-label={`Share ${file.name}`} onClick={(e) => { e.stopPropagation(); onShare() }} className="file-action-btn flex h-6 w-6 items-center justify-center rounded-full text-white/85 hover:bg-white/15 hover:text-white" title={i18n.t("files.share")}>
                            <Link className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button type="button" aria-label={`Delete ${file.name}`} onClick={(e) => { e.stopPropagation(); onDelete() }} className="file-action-btn flex h-6 w-6 items-center justify-center rounded-full text-white/85 hover:bg-red-500/80 hover:text-white" title={i18n.t("files.delete")}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Label and metadata live under the artwork, the way a shelf is read */}
            <div className="shelf-tile-meta">
                <div className="min-w-0 flex-1">
                    <h2 className="shelf-name truncate" title={file.name}>{file.name}</h2>
                    <div className="shelf-sub flex w-full min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
                        <span className="shrink-0">{file.sizeStr}</span>
                        <EncryptionBadge state={file.encryption_state ?? 'plain'} className="shrink-0" />
                        <VideoMetaBadge metadata={videoMeta} isLoading={videoMetaLoading} />
                        {cachedQualities.length > 0 && (
                            <span className="inline-flex min-w-0 items-center gap-0.5 overflow-hidden">
                                {cachedQualities.map(q => (
                                    <span key={q} className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1 py-0.5 text-badge font-medium text-emerald-600 dark:text-emerald-400">
                                        <Check className="h-2.5 w-2.5" />
                                        {q}
                                    </span>
                                ))}
                            </span>
                        )}
                    </div>
                </div>
                {onContextMenu && (
                    <button
                        type="button"
                        className="shelf-more"
                        aria-haspopup="menu"
                        aria-label={`More actions: ${file.name}`}
                        title={file.name}
                        onClick={openMenu}
                    >
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    )
}
