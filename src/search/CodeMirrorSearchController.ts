/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import {
    findNext,
    findPrevious,
    openSearchPanel,
    replaceAll,
    replaceNext,
    search,
    SearchQuery,
    setSearchQuery,
} from "@codemirror/search";
import { panels, type EditorView } from "@codemirror/view";
import {
    EMPTY_SEARCH_QUERY,
    type SearchController,
    type SearchQueryOptions,
    type SearchStatus,
} from "./SearchController";

export class CodeMirrorSearchController implements SearchController {
    private queryOptions: SearchQueryOptions = { ...EMPTY_SEARCH_QUERY };
    private readonly listeners = new Set<(status: SearchStatus) => void>();
    private destroyed = false;

    constructor(private readonly view: EditorView) {
        // CodeMirror only draws search decorations while its panel is open.
        // The application supplies that panel itself, so we open an invisible
        // panel to activate native highlighting without duplicating the UI.
        openSearchPanel(this.view);
    }

    getQuery(): SearchQueryOptions {
        return { ...this.queryOptions };
    }

    getStatus(): SearchStatus {
        if (this.destroyed) {
            return { total: 0, current: null, valid: false };
        }

        const query = this.createQuery();
        if (!query.valid) {
            return { total: 0, current: null, valid: false };
        }

        const matches: { from: number; to: number }[] = [];
        const cursor = query.getCursor(this.view.state);
        for (let result = cursor.next(); !result.done; result = cursor.next()) {
            matches.push(result.value);
        }
        const selection = this.view.state.selection.main;
        const currentIndex = matches.findIndex(
            (match) => match.from === selection.from && match.to === selection.to
        );

        return {
            total: matches.length,
            current: currentIndex >= 0 ? currentIndex + 1 : null,
            valid: true,
        };
    }

    subscribe(listener: (status: SearchStatus) => void): () => void {
        this.listeners.add(listener);
        listener(this.getStatus());
        return () => this.listeners.delete(listener);
    }

    updateQuery(query: SearchQueryOptions): void {
        if (this.destroyed) return;
        this.queryOptions = { ...query };
        this.view.dispatch({ effects: setSearchQuery.of(this.createQuery()) });
        this.emit();
    }

    findNext(): boolean {
        return this.runCommand(findNext);
    }

    findPrevious(): boolean {
        return this.runCommand(findPrevious);
    }

    replaceCurrent(): boolean {
        if (this.getStatus().current === null) return false;
        return this.runCommand(replaceNext);
    }

    replaceAll(): number {
        const count = this.getStatus().total;
        if (count === 0 || !this.runCommand(replaceAll)) return 0;
        return count;
    }

    focusEditor(): void {
        if (!this.destroyed) this.view.focus();
    }

    clear(): void {
        this.updateQuery({ ...EMPTY_SEARCH_QUERY });
    }

    /** Called by the owning EditorView update listener. */
    handleEditorUpdate(): void {
        this.emit();
    }

    destroy(): void {
        this.destroyed = true;
        this.listeners.clear();
    }

    private createQuery(): SearchQuery {
        return new SearchQuery({
            search: this.queryOptions.search,
            replace: this.queryOptions.replacement,
            caseSensitive: this.queryOptions.caseSensitive,
            wholeWord: this.queryOptions.wholeWord,
            regexp: this.queryOptions.regexp,
        });
    }

    private runCommand(command: (view: EditorView) => boolean): boolean {
        if (this.destroyed) return false;
        const handled = command(this.view);
        this.emit();
        return handled;
    }

    private emit(): void {
        if (this.destroyed) return;
        const status = this.getStatus();
        this.listeners.forEach((listener) => listener(status));
    }
}

export function externalCodeMirrorSearch() {
    const detachedPanelContainer = document.createElement("div");
    return [
        panels({ topContainer: detachedPanelContainer }),
        search({
            top: true,
            createPanel: () => {
                const dom = document.createElement("div");
                return { dom, top: true };
            },
        }),
    ];
}
