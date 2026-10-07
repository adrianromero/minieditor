/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

export type SearchQueryOptions = {
    search: string;
    replacement: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    regexp: boolean;
};

export type SearchStatus = {
    total: number;
    current: number | null;
    valid: boolean;
};

export const EMPTY_SEARCH_QUERY: SearchQueryOptions = {
    search: "",
    replacement: "",
    caseSensitive: false,
    wholeWord: false,
    regexp: false,
};

export const EMPTY_SEARCH_STATUS: SearchStatus = {
    total: 0,
    current: null,
    valid: false,
};

export interface SearchController {
    getQuery(): SearchQueryOptions;
    getStatus(): SearchStatus;
    subscribe(listener: (status: SearchStatus) => void): () => void;
    updateQuery(query: SearchQueryOptions): void;
    findNext(): boolean;
    findPrevious(): boolean;
    replaceCurrent(): boolean;
    replaceAll(): number;
    focusEditor(): void;
    clear(): void;
    destroy(): void;
}

